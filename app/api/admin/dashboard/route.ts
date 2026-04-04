import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()

    const statsQuery = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'studio') as total_studios,
        (SELECT COUNT(*) FROM users WHERE role = 'streamer') as total_streamers,
        (SELECT COUNT(*) FROM events WHERE status = 'live') as live_events,
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COALESCE(SUM(balance), 0) FROM wallets) as total_wallet_balance,
        (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'completed') as total_revenue
    `
    const statsRow = statsQuery[0] || {}

    const studios = await sql`
      SELECT u.id, u.name, u.email, u.status, COALESCE(w.balance, 0) as wallet_balance
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.role = 'studio'
      ORDER BY u.created_at DESC
      LIMIT 10
    `

    const orders = await sql`
      SELECT o.order_number as "orderNumber", o.total_price as total, o.status, u.name as "userName"
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `

    const events = await sql`
      SELECT e.id, e.title, e.stream_type as "streamType", e.status, e.current_viewers as "currentViewers"
      FROM events e
      ORDER BY e.created_at DESC
      LIMIT 10
    `

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue: Number(statsRow.total_revenue) || 0,
        monthlyRevenue: 0, // Mock for now
        totalStudios: Number(statsRow.total_studios) || 0,
        totalStreamers: Number(statsRow.total_streamers) || 0,
        liveEvents: Number(statsRow.live_events) || 0,
        totalEvents: Number(statsRow.total_events) || 0,
        activeStudios: Number(statsRow.total_studios) || 0,
      },
      studios: studios.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        status: s.status,
        walletBalance: Number(s.wallet_balance)
      })),
      recentOrders: orders.map(o => ({
        orderNumber: o.orderNumber,
        userName: o.userName,
        total: Number(o.total),
        status: o.status
      })),
      recentEvents: events.map(e => ({
        id: e.id,
        title: e.title,
        streamType: e.streamType,
        status: e.status,
        currentViewers: Number(e.currentViewers) || 0
      }))
    })
  } catch (error: any) {
    console.error("Admin Dashboard API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
