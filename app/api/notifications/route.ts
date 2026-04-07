import { getDb, toCamelRows } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { NextRequest, NextResponse } from "next/server"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const unreadOnly = url.searchParams.get("unread") === "true"
  const offset = (page - 1) * limit
  const sql = getDb()
  const userId = user.id as string

  const rows = unreadOnly
    ? await sql`SELECT * FROM notifications WHERE user_id = ${userId} AND is_read = false ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : await sql`SELECT * FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const countRows = await sql`SELECT count(*)::int as total FROM notifications WHERE user_id = ${userId} AND is_read = false`
  const unreadCount = (countRows[0] as Record<string, unknown>).total as number

  return jsonOk({ notifications: toCamelRows(rows as Record<string, unknown>[]), unreadCount, page, limit })
})

export const PATCH = withAuth(async (user, request) => {
  const body = await request.json()
  const { id, markAll } = body
  const sql = getDb()
  const userId = user.id as string

  if (markAll) {
    await sql`UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = ${userId} AND is_read = false`
    return jsonOk({ success: true, message: "All notifications marked as read" })
  }

  if (!id) return jsonError("Notification ID is required")

  const rows = await sql`
    UPDATE notifications 
    SET is_read = true, read_at = NOW() 
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING *
  `

  if (rows.length === 0) return jsonError("Notification not found", 404)

  return jsonOk({ notification: toCamelRows(rows as Record<string, unknown>[])[0] })
})

export const DELETE = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  const sql = getDb()
  const userId = user.id as string

  if (!id) return jsonError("Notification ID is required")

  const rows = await sql`
    DELETE FROM notifications 
    WHERE id = ${id} AND user_id = ${userId}
    RETURNING id
  `

  if (rows.length === 0) return jsonError("Notification not found", 404)

  return jsonOk({ success: true, message: "Notification deleted" })
})
