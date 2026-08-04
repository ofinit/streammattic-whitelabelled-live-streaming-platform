import { jsonOk, withRole } from "@/lib/api-helpers"
import { getPublicSrsSettings, saveSrsSettings, toPublicSrsSettings } from "@/lib/srs-settings"
import { getDb } from "@/lib/db"

export interface EliveKeyUsageInfo {
  streamKey: string
  eventId: string
  eventTitle: string
  eventSlug: string
  eventStatus: string
  scheduledAt: string | null
  createdAt: string
  userId: string
  userName: string
  userEmail: string
  userRole: string
}

export const GET = withRole(["admin"], async () => {
  const settings = await getPublicSrsSettings()
  const sql = getDb()

  const usageMap: Record<string, EliveKeyUsageInfo> = {}

  try {
    const rows = await sql`
      SELECT e.id AS event_id, e.title AS event_title, e.slug AS event_slug, e.status AS event_status,
             e.scheduled_at, e.created_at, e.stream_key,
             u.id AS user_id, u.name AS user_name, u.email AS user_email, u.role AS user_role
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.stream_key IS NOT NULL AND e.stream_key != ''
      ORDER BY e.created_at DESC
    `

    for (const r of rows) {
      const k = String(r.stream_key).trim()
      if (k && !usageMap[k]) {
        usageMap[k] = {
          streamKey: k,
          eventId: String(r.event_id),
          eventTitle: String(r.event_title || "Untitled Event"),
          eventSlug: String(r.event_slug || ""),
          eventStatus: String(r.event_status || "scheduled"),
          scheduledAt: r.scheduled_at ? String(r.scheduled_at) : null,
          createdAt: String(r.created_at),
          userId: String(r.user_id || ""),
          userName: String(r.user_name || "Unknown User"),
          userEmail: String(r.user_email || ""),
          userRole: String(r.user_role || "user"),
        }
      }
    }
  } catch (err) {
    console.error("[admin/streaming/settings GET] Failed to fetch key usages:", err)
  }

  const keys = settings.eliveStreamKeys || []
  let assignedCount = 0
  for (const k of keys) {
    if (usageMap[k]) assignedCount++
  }

  return jsonOk({
    settings,
    eliveUsageMap: usageMap,
    eliveSummary: {
      totalKeys: keys.length,
      assignedCount,
      availableCount: Math.max(0, keys.length - assignedCount),
      nextIndex: settings.eliveNextKeyIndex || 0,
      nextKey: keys.length > 0 ? keys[(settings.eliveNextKeyIndex || 0) % keys.length] : "",
    },
  })
})

export const PUT = withRole(["admin"], async (_user, request) => {
  const body = await request.json().catch(() => ({}))
  const settings = await saveSrsSettings(body?.settings ?? body)
  return jsonOk({ settings: toPublicSrsSettings(settings) })
})
