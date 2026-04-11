import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { insertDeletedEventLog } from "@/lib/server/deleted-events-log"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const id = url.pathname.split("/").pop()!
  const sql = getDb()

  const rows = await sql`SELECT * FROM events WHERE id = ${id}`
  if (rows.length === 0) return jsonError("Event not found", 404)

  const event = rows[0] as Record<string, unknown>
  if (user.role !== "admin" && event.user_id !== user.id) {
    return jsonError("Forbidden", 403)
  }

  return jsonOk({ event: toCamel(event) })
})

export const PUT = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const id = url.pathname.split("/").pop()!
  const body = await request.json()
  const sql = getDb()

  // Check ownership
  const existing = await sql`SELECT * FROM events WHERE id = ${id}`
  if (existing.length === 0) return jsonError("Event not found", 404)
  if (user.role !== "admin" && (existing[0] as Record<string, unknown>).user_id !== user.id) {
    return jsonError("Forbidden", 403)
  }

  const { title, description, status, scheduledAt, thumbnailUrl, settings } = body

  const rows = await sql`
    UPDATE events SET
      title = COALESCE(${title ?? null}, title),
      description = COALESCE(${description ?? null}, description),
      status = COALESCE(${status ?? null}, status),
      scheduled_at = COALESCE(${scheduledAt ?? null}, scheduled_at),
      thumbnail_url = COALESCE(${thumbnailUrl ?? null}, thumbnail_url),
      settings = COALESCE(${settings ? JSON.stringify(settings) : null}, settings),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `

  return jsonOk({ event: toCamel(rows[0] as Record<string, unknown>) })
})

export const DELETE = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const id = url.pathname.split("/").pop()!
  const sql = getDb()

  const existing = await sql`
    SELECT e.*, u.email AS owner_email
    FROM events e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE e.id = ${id}
  `
  if (existing.length === 0) return jsonError("Event not found", 404)
  const row = existing[0] as Record<string, unknown>
  if (user.role !== "admin" && row.user_id !== user.id) {
    return jsonError("Forbidden", 403)
  }

  await sql`DELETE FROM events WHERE id = ${id}`
  await insertDeletedEventLog(sql, {
    eventId: id,
    eventTitle: (row.title as string) ?? null,
    ownerEmail: (row.owner_email as string | null) ?? null,
    ownerUserId: (row.user_id as string) ?? null,
    studioId: (row.studio_id as string | null | undefined) ?? null,
    reason: "manual_delete",
  })
  return jsonOk({ deleted: true })
})
