import { getDb, toCamelRows, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth, withRole } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit
  const sql = getDb()

  const rows = user.role === "admin"
    ? await sql`SELECT r.*, u.name as user_name, u.email as user_email FROM refund_requests r JOIN users u ON r.requested_by = u.id ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : await sql`SELECT * FROM refund_requests WHERE requested_by = ${user.id} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  return jsonOk({ refunds: toCamelRows(rows as Record<string, unknown>[]) })
})

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { orderId, refundType, amount, reason } = body
  const sql = getDb()

  if (!orderId || !refundType || !amount) return jsonError("orderId, refundType, and amount are required")

  const rows = await sql`
    INSERT INTO refund_requests (order_id, requested_by, refund_type, amount, reason)
    VALUES (${orderId}, ${user.id}, ${refundType}, ${Math.round(amount * 100)}, ${reason || null})
    RETURNING *
  `
  return jsonOk({ refund: toCamel(rows[0] as Record<string, unknown>) }, 201)
})
