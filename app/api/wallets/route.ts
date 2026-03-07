import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId") || user.id as string
  const sql = getDb()

  // Only admin can view other users' wallets
  if (userId !== user.id && user.role !== "admin") {
    return jsonError("Forbidden", 403)
  }

  const rows = await sql`SELECT * FROM wallets WHERE user_id = ${userId}`
  if (rows.length === 0) return jsonError("Wallet not found", 404)
  return jsonOk({ wallet: toCamel(rows[0] as Record<string, unknown>) })
})
