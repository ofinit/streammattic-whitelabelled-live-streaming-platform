import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()
    
    // Fetch global counters and totals
    const result = await sql`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'studio') as total_studios,
        (SELECT COUNT(*) FROM users WHERE role = 'streamer') as total_streamers,
        (SELECT COUNT(*) FROM events WHERE status = 'live') as live_events,
        (SELECT (SELECT COUNT(*) FROM events) + (SELECT COUNT(*) FROM deleted_events_log)) as total_events,
        (SELECT COALESCE(SUM(balance), 0) FROM wallets) as total_wallet_balance,
        (SELECT COALESCE(SUM(total_price), 0) FROM orders WHERE status = 'completed') as platform_revenue
    `
    
    const r = result[0]

    return NextResponse.json({ 
      success: true, 
      overview: {
        totalStudios: Number(r.total_studios),
        totalStreamers: Number(r.total_streamers),
        liveEvents: Number(r.live_events),
        totalEvents: Number(r.total_events),
        totalWalletBalance: Number(r.total_wallet_balance),
        platformRevenue: Number(r.platform_revenue)
      } 
    })
  } catch (error: any) {
    console.error("Admin Analytics API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
