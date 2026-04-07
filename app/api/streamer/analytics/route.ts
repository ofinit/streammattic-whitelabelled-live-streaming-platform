import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireRole(["streamer"])
    const userId = user.id
    
    const sql = getDb()
    
    // Summary stats for the streamer's own events
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_events,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_events,
        COUNT(*) FILTER (WHERE status = 'live') as live_now,
        COALESCE(SUM(current_viewers), 0) as total_viewers,
        COALESCE(AVG(duration) FILTER (WHERE status = 'completed'), 0) as avg_duration
      FROM events
      WHERE user_id = ${userId}
    `
    
    const walletResult = await sql`SELECT balance FROM wallets WHERE user_id = ${userId}`
    
    // Trend data (last 6 months)
    const trendResult = await sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        TO_CHAR(created_at, 'YYYY-MM') as month_key,
        COUNT(*) as events,
        COALESCE(SUM(duration), 0) / 3600 as stream_hours
      FROM events
      WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, month_key
      ORDER BY month_key ASC
    `

    // Top events
    const topEvents = await sql`
      SELECT 
        title,
        stream_type,
        peak_viewers,
        duration,
        status,
        created_at
      FROM events
      WHERE user_id = ${userId}
      ORDER BY peak_viewers DESC
      LIMIT 5
    `

    const s = statsResult[0]
    return NextResponse.json({ 
      success: true, 
      stats: {
        totalEvents: Number(s.total_events),
        completedEvents: Number(s.completed_events),
        liveNow: Number(s.live_now),
        totalViewers: Number(s.total_viewers),
        avgDurationMinutes: Math.round(Number(s.avg_duration) / 60),
        walletBalance: Number(walletResult[0]?.balance || 0)
      },
      trend: trendResult.map(t => ({
        month: t.month,
        events: Number(t.events),
        streamHours: Math.round(Number(t.stream_hours))
      })),
      topEvents: topEvents.map(e => ({
        title: e.title,
        streamType: e.stream_type.replace('_', ' '),
        peakViewers: Number(e.peak_viewers || 0),
        duration: Math.round(Number(e.duration || 0) / 60),
        status: e.status,
        date: e.created_at
      }))
    })
  } catch (error: any) {
    console.error("Streamer Analytics API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
