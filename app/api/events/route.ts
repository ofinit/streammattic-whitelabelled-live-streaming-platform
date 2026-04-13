import { getDb, toCamel, toCamelRows } from "@/lib/db"
import { insertFunnelEvent, visitorKeyForUser } from "@/lib/analytics-funnel"
import { jsonOk, jsonError, withOptionalAuth, withAuth } from "@/lib/api-helpers"
import {
  STREAM_TYPE_MAP,
  getCreditColumn,
  calculateTotalCreditsRequired,
  shouldBypassCredits,
} from "@/lib/server/credits-logic"

export const GET = withOptionalAuth(async (user, request) => {
  const url = new URL(request.url)
  const status = url.searchParams.get("status")
  const rawPage = parseInt(url.searchParams.get("page") || "1", 10)
  const rawLimit = parseInt(url.searchParams.get("limit") || "50", 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const limit = Number.isFinite(rawLimit) ? Math.min(500, Math.max(1, rawLimit)) : 50
  const offset = (page - 1) * limit
  const isPublic = url.searchParams.get("public") === "true"
  const sql = getDb()

  if (!user && !isPublic) {
    return jsonError("Unauthorized", 401)
  }

  const isAdmin = user?.role === "admin"
  const userId = user?.id as string | undefined
  if (!isPublic && !isAdmin && (!userId || String(userId).trim() === "")) {
    return jsonError("Unauthorized", 401)
  }

  let rows: any[] = []
  let total = 0

  try {
    if (isPublic) {
      // Public sees all live/scheduled events
      const filter = status ? sql`AND status = ${status}` : sql`AND status IN ('live', 'scheduled')`
      rows = await sql`SELECT e.*, u.name as user_name FROM events e JOIN users u ON e.user_id = u.id WHERE 1=1 ${filter} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`
      const count = await sql`SELECT count(*)::int as total FROM events WHERE 1=1 ${filter}`
      total = count[0].total as number
    } else if (isAdmin) {
      const filter = status ? sql`WHERE e.status = ${status}` : sql``
      rows = await sql`SELECT e.*, u.name as user_name, u.email as user_email FROM events e JOIN users u ON e.user_id = u.id ${filter} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`
      const count = await sql`SELECT count(*)::int as total FROM events e ${filter}`
      total = count[0].total as number
    } else {
      const filter = status ? sql`AND status = ${status}` : sql``
      rows = await sql`SELECT * FROM events WHERE user_id = ${userId!} ${filter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      const count = await sql`SELECT count(*)::int as total FROM events WHERE user_id = ${userId!} ${filter}`
      total = count[0].total as number
    }
  } catch (e) {
    console.error("[api/events GET]", e)
    return jsonError("Failed to load events", 500)
  }

  return jsonOk({ events: toCamelRows(rows as Record<string, unknown>[]), total, page, limit })
})

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { title, description, streamType, scheduledAt, thumbnailUrl, settings } = body
  const sql = getDb()
  const targetUserId = user.id as string

  if (!title || !streamType) {
    return jsonError("Title and stream type are required")
  }

  // Generate a unique slug (base title + random string to avoid collisions)
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`

  // Fetch verified domain if studio
  let publicUrl = ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://streamlivee.pro"

  if (user.role === "studio") {
    const domains = await sql`
      SELECT domain FROM domains 
      WHERE user_id = ${targetUserId} AND verification_status = 'verified' AND is_primary = true
      LIMIT 1
    `
    if (domains.length > 0) {
      publicUrl = `https://${domains[0].domain}/${slug}`
    } else {
      publicUrl = `${appUrl}/${slug}`
    }
  } else {
    publicUrl = `${appUrl}/${slug}`
  }

  // Determine total credit deduction logic via shared helper
  const host = request.headers.get("host") || ""
  const normalizedStreamType = STREAM_TYPE_MAP[streamType] || streamType
  
  const totalNeed = await calculateTotalCreditsRequired({
    streamType: normalizedStreamType,
    scheduledAt,
    additionalDates: settings?.additionalDates,
    validityDays: settings?.validityDays,
    validityExpiresAt: settings?.validityExpiresAt ?? null,
  })

  const shouldBypassCreditsDeduction = shouldBypassCredits(user, targetUserId, host)

  if (!shouldBypassCreditsDeduction && normalizedStreamType && totalNeed > 0) {
    const creditCol = getCreditColumn(normalizedStreamType)
    const updatedCredits = await sql`
      UPDATE user_credits
      SET ${sql.unsafe(creditCol)} = ${sql.unsafe(creditCol)} - ${totalNeed},
          updated_at = NOW()
      WHERE user_id = ${targetUserId}
        AND ${sql.unsafe(creditCol)} >= ${totalNeed}
      RETURNING *
    `
    if (updatedCredits.length === 0) {
      return jsonError(`Insufficient ${streamType} credits. Required: ${totalNeed}.`, 400)
    }
  }

  // Insert event
  const rows = await sql`
    INSERT INTO events (user_id, title, description, stream_type, scheduled_at, thumbnail_url, settings, slug, public_url)
    VALUES (${targetUserId}, ${title}, ${description || null}, ${streamType}, ${scheduledAt || null}, ${thumbnailUrl || null}, ${JSON.stringify(settings || {})}, ${slug}, ${publicUrl})
    RETURNING *
  `

  const event = rows[0] as Record<string, unknown>
  const eventId = event.id as string

  const vk = await visitorKeyForUser(targetUserId)
  const ctx =
    user.role === "studio" ? ({ type: "studio" as const, id: targetUserId }) : ({ type: "platform" as const, id: null })
  await insertFunnelEvent({
    eventType: "EVENT_CREATED",
    visitorKey: vk,
    userId: targetUserId,
    relatedEventId: eventId,
    contextType: ctx.type,
    contextId: ctx.id,
    payload: { title: String(title), source: "api_events" },
  })

  if (totalNeed > 0 && !shouldBypassCreditsDeduction) {
    await sql`
      INSERT INTO credit_deductions (user_id, event_id, stream_type, amount, reason)
      VALUES (${targetUserId}, ${event.id}, ${streamType}, ${totalNeed}, 'Event creation')
    `
  }

  return jsonOk({ event: toCamel(event) }, 201)
})
