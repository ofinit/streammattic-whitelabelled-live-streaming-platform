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
