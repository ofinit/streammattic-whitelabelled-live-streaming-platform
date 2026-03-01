import { getDb, toCamelRows, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const offset = (page - 1) * limit
  const userId = url.searchParams.get("userId") || user.id as string
  const sql = getDb()

  if (userId !== user.id && user.role !== "admin") {
    return jsonError("Forbidden", 403)
  }

  const isAdmin = user.role === "admin" && !url.searchParams.get("userId")

  const rows = isAdmin
    ? await sql`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`
    : await sql`SELECT * FROM orders WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const countRows = isAdmin
    ? await sql`SELECT count(*)::int as total FROM orders`
    : await sql`SELECT count(*)::int as total FROM orders WHERE user_id = ${userId}`

  return jsonOk({ orders: toCamelRows(rows as Record<string, unknown>[]), total: (countRows[0] as Record<string, unknown>).total, page, limit })
})

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { orderType, amount, description, gateway } = body
  const sql = getDb()
  const userId = user.id as string

  if (!orderType || !amount) return jsonError("orderType and amount are required")

  const rows = await sql`
    INSERT INTO orders (user_id, order_type, amount, description, gateway)
    VALUES (${userId}, ${orderType}, ${Math.round(amount * 100)}, ${description || null}, ${gateway || 'razorpay'})
    RETURNING *
  `

  return jsonOk({ order: toCamel(rows[0] as Record<string, unknown>) }, 201)
})
