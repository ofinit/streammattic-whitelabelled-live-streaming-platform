import { NextRequest, NextResponse } from "next/server"
import {
  getResellerDashboardStats,
  getOrders,
  getEvents,
} from "@/lib/db-queries"

export async function GET(req: NextRequest) {
  const resellerId = req.nextUrl.searchParams.get("resellerId")

  if (!resellerId) {
    return NextResponse.json({ error: "resellerId is required" }, { status: 400 })
  }

  try {
    const [stats, orders, events] = await Promise.all([
      getResellerDashboardStats(resellerId),
      getOrders({ resellerId, limit: 5 }),
      getEvents({ resellerId, limit: 10 }),
    ])

    return NextResponse.json({
      stats,
      orders,
      events,
    })
  } catch (error) {
    console.error("[reseller/dashboard] Error:", error)
    return NextResponse.json(
      { error: "Failed to load reseller dashboard data" },
      { status: 500 }
    )
  }
}
