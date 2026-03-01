import { getDb, toCamel, toCamelRows } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const status = url.searchParams.get("status")
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit
  const sql = getDb()
  const userId = user.id as string
  const isAdmin = user.role === "admin"

  const rows = isAdmin
    ? status
      ? await sql`SELECT e.*, u.name as user_name, u.email as user_email FROM events e JOIN users u ON e.user_id = u.id WHERE e.status = ${status} ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`
      : await sql`SELECT e.*, u.name as user_name, u.email as user_email FROM events e JOIN users u ON e.user_id = u.id ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : status
      ? await sql`SELECT * FROM events WHERE user_id = ${userId} AND status = ${status} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      : await sql`SELECT * FROM events WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const countRows = isAdmin
    ? await sql`SELECT count(*)::int as total FROM events`
    : await sql`SELECT count(*)::int as total FROM events WHERE user_id = ${userId}`

  return jsonOk({ events: toCamelRows(rows as Record<string, unknown>[]), total: (countRows[0] as Record<string, unknown>).total, page, limit })
})

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { title, description, streamType, scheduledAt, thumbnailUrl, settings } = body
  const sql = getDb()
  const userId = user.id as string

  if (!title || !streamType) {
    return jsonError("Title and stream type are required")
  }

  // Check if user has credits for this stream type
  const credits = await sql`SELECT * FROM user_credits WHERE user_id = ${userId}`
  if (credits.length === 0) return jsonError("No credits available", 400)

  const creditRow = credits[0] as Record<string, unknown>
  const creditCol = streamType === "rtmp" ? "rtmp" : streamType === "youtube_api" ? "youtube_api" : streamType === "youtube_embed" ? "youtube_embed" : "third_party"
  if ((creditRow[creditCol] as number) < 1) {
    return jsonError(`No ${streamType} credits available. Please purchase credits first.`, 400)
  }

  const rows = await sql`
    INSERT INTO events (user_id, title, description, stream_type, scheduled_at, thumbnail_url, settings)
    VALUES (${userId}, ${title}, ${description || null}, ${streamType}, ${scheduledAt || null}, ${thumbnailUrl || null}, ${JSON.stringify(settings || {})})
    RETURNING *
  `

  return jsonOk({ event: toCamel(rows[0] as Record<string, unknown>) }, 201)
})
