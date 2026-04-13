import { getDb, toCamelRows } from "@/lib/db"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"

/**
 * Minimal event rows for /client-gallery (avoids full SELECT * + JSON edge cases from /api/events).
 */
export const GET = withAuth(async (user, request) => {
  const role = user.role as string
  if (role !== "streamer" && role !== "studio") {
    return jsonError("Forbidden", 403)
  }

  const userId = typeof user.id === "string" ? user.id : String(user.id ?? "").trim()
  if (!userId) {
    return jsonError("Unauthorized", 401)
  }

  const url = new URL(request.url)
  const rawLimit = parseInt(url.searchParams.get("limit") || "100", 10)
  const limit = Number.isFinite(rawLimit) ? Math.min(200, Math.max(1, rawLimit)) : 100

  try {
    const sql = getDb()
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS photo_gallery_urls JSONB DEFAULT '[]'::jsonb`.catch(() => {})

    const rows = await sql`
      SELECT id, title, slug, status, thumbnail, photo_gallery_urls, updated_at, created_at
      FROM events
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `

    return jsonOk({ events: toCamelRows(rows as Record<string, unknown>[]) })
  } catch (e) {
    console.error("[api/client-gallery/events]", e)
    return jsonError("Failed to load events", 500)
  }
})
