import { NextRequest, NextResponse } from "next/server"
import {
  getResellerDashboardStats,
  getUsers,
  getOrders,
  getEvents,
} from "@/lib/db-queries"

export async function GET(req: NextRequest) {
  const resellerId = req.nextUrl.searchParams.get("resellerId")

  if (!resellerId) {
    return NextResponse.json({ error: "resellerId is required" }, { status: 400 })
  }

  try {
    const [stats, users, orders, events] = await Promise.all([
      getResellerDashboardStats(resellerId),
      getUsers({ parentResellerId: resellerId, role: "user", limit: 5 }),
      getOrders({ resellerId, limit: 5 }),
      getEvents({ resellerId, limit: 10 }),
    ])

    return NextResponse.json({
      stats,
      users,
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
