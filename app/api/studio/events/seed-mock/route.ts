import { NextResponse } from "next/server"
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

/**
 * Creates one scheduled "pending stream" event per selectable template (no credits).
 */
export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sql = getDb()
    const sub = await checkStudioSubscriptionActiveForEventManagement(sql, user.id as string, user.role as string)
    if (!sub.ok) {
      return NextResponse.json({ error: sub.message, code: "STUDIO_SUBSCRIPTION_EXPIRED" }, { status: 403 })
    }

    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS subtitle TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS use_custom_domain BOOLEAN DEFAULT false`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS hero_image_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS player_image_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_gallery_urls JSONB DEFAULT '[]'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_logo_url TEXT`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photographer_contact JSONB DEFAULT '{}'`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS crew_pin_hash TEXT`.catch(() => {})

    const userId = user.id as string
    const isStudio = user.role === "studio"
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
          validity_expires_at, hero_image_url, player_image_url, photo_gallery_urls,
          photographer_logo_url, photographer_contact, crew_pin_hash, use_custom_domain
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
          ${null}, ${null}, ${"[]"}::jsonb,
          ${null}, ${"{}"}::jsonb, ${null},
          ${isStudio}
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
