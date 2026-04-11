import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()
    
    // Fetch orders and join related tables
    const rows = await sql`
      SELECT 
        o.id, o.order_number as "orderNumber", o.total_price as amount, o.status, o.created_at, o.order_type as "orderType",
        u.id as "buyerId", u.name as "buyerName", u.email as "buyerEmail",
        e.id as "eventId", e.title as "eventTitle"
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `

    // Output formatted to expected UI model
    const orders = rows.map(r => ({
      id: r.id,
      orderNumber: r.orderNumber,
      orderType: r.orderType,
      amount: Number(r.amount) || 0,
      currency: "INR",
      status: r.status,
      createdAt: r.created_at,
      buyer: {
        id: r.buyerId,
        name: r.buyerName,
        email: r.buyerEmail
      },
      event: r.eventId ? {
        id: r.eventId,
        title: r.eventTitle
      } : null
    }))

    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error("Admin Orders API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
