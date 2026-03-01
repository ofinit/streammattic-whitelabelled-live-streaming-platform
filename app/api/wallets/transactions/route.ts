import { getDb, toCamelRows } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId") || user.id as string
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const category = url.searchParams.get("category")
  const offset = (page - 1) * limit
  const sql = getDb()

  if (userId !== user.id && user.role !== "admin") {
    return jsonError("Forbidden", 403)
  }

  const rows = category
    ? await sql`SELECT * FROM wallet_transactions WHERE user_id = ${userId} AND category = ${category} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : await sql`SELECT * FROM wallet_transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const countRows = await sql`SELECT count(*)::int as total FROM wallet_transactions WHERE user_id = ${userId}`
  const total = (countRows[0] as Record<string, unknown>).total as number

  return jsonOk({ transactions: toCamelRows(rows as Record<string, unknown>[]), total, page, limit })
})
