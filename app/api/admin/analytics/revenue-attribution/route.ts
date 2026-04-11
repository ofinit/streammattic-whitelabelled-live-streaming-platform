import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

const ALLOWED_DAYS = new Set([7, 30, 90])

/**
 * Completed-order revenue grouped by first-touch UTM source from `event_visitor_sessions`
 * (earliest `first_seen_at` per user_id).
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"])
    const sql = getDb()
    const { searchParams } = new URL(req.url)
    const daysRaw = searchParams.get("days")
    const days = ALLOWED_DAYS.has(Number(daysRaw)) ? Number(daysRaw) : 30
    const since = new Date(Date.now() - days * 86400000).toISOString()

    const rows = await sql`
      WITH first_touch AS (
        SELECT DISTINCT ON (user_id)
          user_id,
          utm_source,
          utm_medium,
          utm_campaign
        FROM event_visitor_sessions
        WHERE user_id IS NOT NULL
        ORDER BY user_id, first_seen_at ASC
      )
      SELECT
        COALESCE(NULLIF(TRIM(ft.utm_source), ''), 'unknown') AS source,
        COUNT(*)::bigint AS order_count,
        SUM(o.total_price)::bigint AS revenue_paise
      FROM orders o
      LEFT JOIN first_touch ft ON ft.user_id = o.user_id
      WHERE o.status = 'completed'
        AND COALESCE(o.completed_at, o.created_at) >= ${since}::timestamptz
      GROUP BY 1
      ORDER BY revenue_paise DESC NULLS LAST
    `

    const bySource = (rows as { source: string; order_count: bigint; revenue_paise: bigint }[]).map(
      (r) => ({
        source: r.source,
        orderCount: Number(r.order_count),
        revenuePaise: Number(r.revenue_paise),
        revenueRupees: Number(r.revenue_paise) / 100,
      }),
    )

    const totals = bySource.reduce(
      (acc, r) => {
        acc.orders += r.orderCount
        acc.revenuePaise += r.revenuePaise
        return acc
      },
      { orders: 0, revenuePaise: 0 },
    )

    return NextResponse.json({
      success: true,
      windowDays: days,
      attribution: "first_touch",
      description:
        "Revenue from completed orders in the window, grouped by earliest session UTM source per user (unknown = no linked watch session).",
      totalOrders: totals.orders,
      totalRevenuePaise: totals.revenuePaise,
      totalRevenueRupees: totals.revenuePaise / 100,
      bySource,
    })
  } catch (error: unknown) {
    console.error("Admin revenue attribution error:", error)
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Forbidden" || msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
