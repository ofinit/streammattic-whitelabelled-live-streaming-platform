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

  // Generate a unique slug (base title + random string to avoid collisions)
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`

  // Fetch verified domain if studio
  let publicUrl = ""
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://streamlivee.pro"

  if (user.role === "studio") {
    const domains = await sql`
      SELECT domain FROM domains 
      WHERE user_id = ${userId} AND verification_status = 'verified' AND is_primary = true
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

  const creditCol = streamType === "rtmp" ? "rtmp" : streamType === "youtube_api" ? "youtube_api" : streamType === "youtube_embed" ? "youtube_embed" : "third_party"

  // Atomically check and deduct credit
  const updatedCredits = await sql`
    UPDATE user_credits 
    SET ${sql.unsafe(creditCol)} = ${sql.unsafe(creditCol)} - 1, updated_at = NOW()
    WHERE user_id = ${userId} AND ${sql.unsafe(creditCol)} >= 1
    RETURNING *
  `

  if (updatedCredits.length === 0) {
    return jsonError(`No ${streamType} credits available. Please purchase credits first.`, 400)
  }

  // Insert event
  const rows = await sql`
    INSERT INTO events (user_id, title, description, stream_type, scheduled_at, thumbnail_url, settings, slug, public_url)
    VALUES (${userId}, ${title}, ${description || null}, ${streamType}, ${scheduledAt || null}, ${thumbnailUrl || null}, ${JSON.stringify(settings || {})}, ${slug}, ${publicUrl})
    RETURNING *
  `

  const event = rows[0] as Record<string, unknown>

  // Create credit deduction record
  await sql`
    INSERT INTO credit_deductions (user_id, event_id, stream_type, amount, reason)
    VALUES (${userId}, ${event.id}, ${streamType}, 1, 'Event creation')
  `

  return jsonOk({ event: toCamel(event) }, 201)
})
