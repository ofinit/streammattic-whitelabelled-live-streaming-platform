import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()
    
    const rows = await sql`
      SELECT 
        r.id, r.original_amount, r.total_refund_amount as "totalRefundAmount", r.status, r.requested_at as "requestedAt", r.type as "refundMethod",
        u.id as "requestedBy", u.name as "requestedByName",
        e.id as "eventId", e.title as "eventTitle"
      FROM refund_requests r
      JOIN users u ON r.requested_by = u.id
      LEFT JOIN events e ON r.event_id = e.id
      ORDER BY r.requested_at DESC
      LIMIT 100
    `

    // Output formatted to expected UI model
    const refunds = rows.map(r => ({
      id: r.id,
      originalAmount: Number(r.original_amount) || 0,
      totalRefundAmount: Number(r.totalRefundAmount) || 0,
      status: r.status,
      requestedAt: r.requestedAt,
      refundMethod: r.refundMethod,
      requestedBy: r.requestedBy,
      eventName: r.eventTitle || "Unknown Event",
      requestedByName: r.requestedByName || "Unknown User",
      eventId: r.eventId,
      rejectionReason: null
    }))

    return NextResponse.json({ success: true, refunds })
  } catch (error: any) {
    console.error("Admin Refunds API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
