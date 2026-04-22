import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

function num(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()
    
    const rows = await sql`
      SELECT
        o.id,
        o.order_number,
        o.user_id,
        o.order_type,
        o.status,
        o.stream_type,
        o.quantity,
        o.unit_price,
        o.total_price,
        o.discount_tier_label,
        o.event_id,
        o.validity_days,
        o.credits_cost,
        o.service_type,
        o.payment_gateway,
        o.gateway_order_id,
        o.failure_reason,
        o.created_at,
        o.updated_at,
        o.completed_at,
        u.id AS buyer_id,
        u.name AS buyer_name,
        u.email AS buyer_email,
        e.title AS event_title
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN events e ON o.event_id = e.id
      ORDER BY o.created_at DESC
      LIMIT 200
    `

    const orders = (rows as Record<string, unknown>[]).map((r) => {
      const qty = num(r.quantity, 1) || 1
      return {
        id: r.id,
        orderNumber: r.order_number,
        userId: r.user_id,
        user: {
          id: r.buyer_id,
          name: r.buyer_name,
          email: r.buyer_email,
        },
        orderType: r.order_type,
        status: r.status,
        streamType: r.stream_type ?? undefined,
        quantity: qty,
        unitPrice: num(r.unit_price, 0),
        totalPrice: num(r.total_price, 0),
        discountTierLabel: r.discount_tier_label ?? undefined,
        eventId: r.event_id ?? undefined,
        eventTitle: r.event_title ?? undefined,
        validityDays: r.validity_days != null ? num(r.validity_days) : undefined,
        creditsCost: r.credits_cost != null ? num(r.credits_cost) : undefined,
        serviceType: r.service_type ?? undefined,
        paymentGateway: r.payment_gateway ?? undefined,
        gatewayOrderId: r.gateway_order_id ?? undefined,
        failureReason: r.failure_reason ?? undefined,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        completedAt: r.completed_at ?? undefined,
      }
    })

    return NextResponse.json({ success: true, orders })
  } catch (error: any) {
    console.error("Admin Orders API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
