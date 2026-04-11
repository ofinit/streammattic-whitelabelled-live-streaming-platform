import { randomUUID } from "crypto"
import { getDb, toCamelRows, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "50")
  const offset = (page - 1) * limit
  const userId = url.searchParams.get("userId")
  const studioId = url.searchParams.get("studioId")
  const sql = getDb()

  let rows: any[] = []
  let total = 0

  if (user.role === "admin") {
    if (studioId) {
      rows = await sql`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.studio_id = ${studioId} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`
      const count = await sql`SELECT count(*)::int as total FROM orders WHERE studio_id = ${studioId}`
      total = count[0].total as number
    } else if (userId) {
      rows = await sql`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.user_id = ${userId} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`
      const count = await sql`SELECT count(*)::int as total FROM orders WHERE user_id = ${userId}`
      total = count[0].total as number
    } else {
      rows = await sql`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`
      const count = await sql`SELECT count(*)::int as total FROM orders`
      total = count[0].total as number
    }
  } else if (user.role === "studio") {
    // Studio can see their own orders AND orders where they are the studio_id
    rows = await sql`SELECT o.*, u.name as user_name, u.email as user_email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.studio_id = ${user.id} OR o.user_id = ${user.id} ORDER BY o.created_at DESC LIMIT ${limit} OFFSET ${offset}`
    const count = await sql`SELECT count(*)::int as total FROM orders WHERE studio_id = ${user.id} OR user_id = ${user.id}`
    total = count[0].total as number
  } else {
    // Streamer can only see their own
    rows = await sql`SELECT * FROM orders WHERE user_id = ${user.id} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
    const count = await sql`SELECT count(*)::int as total FROM orders WHERE user_id = ${user.id}`
    total = count[0].total as number
  }

  return jsonOk({ 
    orders: toCamelRows(rows as Record<string, unknown>[]), 
    total, 
    page, 
    limit 
  })
})

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { orderType, amount, description, gateway } = body
  const sql = getDb()
  const userId = user.id as string

  if (!orderType || !amount) return jsonError("orderType and amount are required")

  const orderNumber = `SL-${randomUUID().replace(/-/g, "").slice(0, 14).toUpperCase()}`
  const rows = await sql`
    INSERT INTO orders (order_number, user_id, order_type, total_price, description, payment_gateway)
    VALUES (${orderNumber}, ${userId}, ${orderType}, ${Math.round(amount * 100)}, ${description || null}, ${gateway || "razorpay"})
    RETURNING *
  `

  return jsonOk({ order: toCamel(rows[0] as Record<string, unknown>) }, 201)
})
