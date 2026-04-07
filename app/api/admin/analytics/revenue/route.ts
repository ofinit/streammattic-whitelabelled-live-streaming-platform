import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    await requireRole(["admin"])
    
    const sql = getDb()
    
    // Group completed orders by month (last 12 months)
    const revenueTrend = await sql`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        TO_CHAR(created_at, 'YYYY-MM') as month_key,
        SUM(total_price)::numeric as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month, month_key
      ORDER BY month_key ASC
    `

    // Get top studios by revenue
    const topStudios = await sql`
      SELECT 
        u.name,
        u.email,
        (SELECT COUNT(*) FROM users s WHERE s.studio_id = u.id AND s.role = 'streamer') as users,
        SUM(o.total_price)::numeric as revenue
      FROM users u
      JOIN orders o ON u.id = o.studio_id
      WHERE u.role = 'studio' AND o.status = 'completed'
      GROUP BY u.id, u.name, u.email
      ORDER BY revenue DESC
      LIMIT 10
    `

    return NextResponse.json({ 
      success: true, 
      revenueTrend: revenueTrend.map(r => ({
        month: r.month,
        revenue: Number(r.revenue),
        orders: Number(r.orders)
      })),
      topStudios: topStudios.map(s => ({
        name: s.name,
        email: s.email,
        users: Number(s.users),
        revenue: Number(s.revenue)
      }))
    })
  } catch (error: any) {
    console.error("Admin Analytics Revenue API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
