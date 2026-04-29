import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { checkStudioSubscriptionActiveForEventManagement } from "@/lib/studio-subscription"
import { SELECTABLE_EVENT_TEMPLATES } from "@/lib/template-registry"
import { PENDING_STREAM_DB } from "@/lib/server/credits-logic"

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
}

async function ensureUniqueSlug(
  sql: ReturnType<typeof getDb>,
  base: string,
): Promise<string> {
  let slug = toSlug(base)
  if (!slug) slug = `sample-${Date.now()}`
  let candidate = slug
  let attempt = 0
  while (true) {
    const rows = await sql`SELECT id FROM events WHERE slug = ${candidate}`
    if (rows.length === 0) return candidate
    attempt++
    candidate = `${slug}-${attempt}`
  }
}

async function resolveTargetUser(req: NextRequest, sql: ReturnType<typeof getDb>) {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }

  const requestedUserId = req.nextUrl.searchParams.get("studioId") || req.nextUrl.searchParams.get("userId")
  const targetUserId =
    sessionUser.role === "admin" && requestedUserId
      ? requestedUserId
      : (sessionUser.id as string)

  if (sessionUser.role !== "admin" && requestedUserId && requestedUserId !== sessionUser.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  const rows = await sql`
    SELECT id, role
    FROM users
    WHERE id = ${targetUserId}
    LIMIT 1
  `
  const targetUser = rows[0] as { id?: string; role?: string } | undefined
  if (!targetUser?.id) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) }
  }

  return {
    sessionUser,
    targetUser: {
      id: targetUser.id,
      role: targetUser.role || "streamer",
    },
  }
}

/**
 * Creates one scheduled "pending stream" event per selectable template (no credits).
 */
export async function POST(req: NextRequest) {
  try {
    const sql = getDb()
    const resolved = await resolveTargetUser(req, sql)
    if ("error" in resolved) return resolved.error

    const sub = await checkStudioSubscriptionActiveForEventManagement(
      sql,
      resolved.targetUser.id,
      resolved.targetUser.role,
    )
    if (!sub.ok) {
      return NextResponse.json({ error: sub.message, code: "STUDIO_SUBSCRIPTION_EXPIRED" }, { status: 403 })
    }

    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS subtitle TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS use_custom_domain BOOLEAN DEFAULT false`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS hero_image_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS header_image_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS player_image_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_gallery_urls JSONB DEFAULT '[]'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_logo_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_contact JSONB DEFAULT '{}'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS crew_pin_hash TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT false`.catch(() => {})

    const userId = resolved.targetUser.id
    const isStudio = resolved.targetUser.role === "studio"
    const created: { id: string; title: string; templateId: string }[] = []
    const baseTime = Date.now()

    for (let i = 0; i < SELECTABLE_EVENT_TEMPLATES.length; i++) {
      const t = SELECTABLE_EVENT_TEMPLATES[i]
      const title = `Sample: ${t.name}`
      const slugBase = `sample-${t.id.replace(/^tpl-/, "")}`
      const finalSlug = await ensureUniqueSlug(sql, slugBase)

      const scheduledAt = new Date(baseTime + (i + 1) * 86_400_000).toISOString()
      const templateDataJson = JSON.stringify({ templateId: t.id })
      const description = `Preview sample using the “${t.name}” layout. Edit the event to choose a stream type and go live.`

      const validityExpiresAtValue = sql.unsafe("NOW() + INTERVAL '30 days'")

      const rows = await sql`
        INSERT INTO events (
          user_id, title, subtitle, description, stream_type, stream_key, rtmp_url,
          youtube_url, embed_code, status, scheduled_at,
          is_password_protected, event_password, allow_chat, allow_reactions,
          simulcast_config, slug, timezone, show_scheduled_page, template_data,
          validity_expires_at, hero_image_url, header_image_url, player_image_url, photo_gallery_urls,
          photographer_logo_url, photographer_contact, crew_pin_hash, use_custom_domain,
          is_mock
        ) VALUES (
          ${userId}, ${title}, ${null}, ${description},
          ${PENDING_STREAM_DB}, ${null}, ${null},
          ${null}, ${null},
          'scheduled', ${scheduledAt},
          ${false}, ${null},
          ${true}, ${true},
          ${JSON.stringify({})},
          ${finalSlug},
          ${"UTC"},
          ${false},
          ${templateDataJson}::jsonb,
          ${validityExpiresAtValue},
          ${null}, ${null}, ${null}, ${"[]"}::jsonb,
          ${null}, ${"{}"}::jsonb, ${null},
          ${isStudio},
          ${true}
        )
        RETURNING id, title
      `

      const row = rows[0] as Record<string, unknown>
      created.push({
        id: row.id as string,
        title: row.title as string,
        templateId: t.id,
      })
    }

    return NextResponse.json({
      success: true,
      count: created.length,
      events: created,
    })
  } catch (e) {
    console.error("[studio/events/seed-mock POST]", e)
    return NextResponse.json({ error: "Failed to create sample events" }, { status: 500 })
  }
}

/**
 * Removes seeded sample events for the current user (flagged `is_mock` or legacy title/description match).
 */
export async function DELETE(req: NextRequest) {
  try {
    const sql = getDb()
    const resolved = await resolveTargetUser(req, sql)
    if ("error" in resolved) return resolved.error

    const sub = await checkStudioSubscriptionActiveForEventManagement(
      sql,
      resolved.targetUser.id,
      resolved.targetUser.role,
    )
    if (!sub.ok) {
      return NextResponse.json({ error: sub.message, code: "STUDIO_SUBSCRIPTION_EXPIRED" }, { status: 403 })
    }

    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT false`.catch(() => {})

    const userId = resolved.targetUser.id
    const legacyDesc = "%Edit the event to choose a stream type and go live.%"
    const rows = await sql`
      DELETE FROM events
      WHERE user_id = ${userId}
      AND (
        is_mock = true
        OR (
          title LIKE ${"Sample: %"}
          AND description LIKE ${"%Preview sample using%"}
          AND description LIKE ${legacyDesc}
        )
      )
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      deleted: rows.length,
    })
  } catch (e) {
    console.error("[studio/events/seed-mock DELETE]", e)
    return NextResponse.json({ error: "Failed to remove sample events" }, { status: 500 })
  }
}
