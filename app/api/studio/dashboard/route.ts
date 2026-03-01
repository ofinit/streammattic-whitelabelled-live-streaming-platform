import { NextRequest, NextResponse } from "next/server"
import {
  getStudioDashboardStats,
  getOrders,
  getEvents,
} from "@/lib/db-queries"

export async function GET(req: NextRequest) {
  const studioId = req.nextUrl.searchParams.get("studioId")

  if (!studioId) {
    return NextResponse.json({ error: "studioId is required" }, { status: 400 })
  }

  try {
    const [stats, orders, events] = await Promise.all([
      getStudioDashboardStats(studioId),
      getOrders({ studioId, limit: 5 }),
      getEvents({ studioId, limit: 10 }),
    ])

    return NextResponse.json({
      stats,
      orders,
      events,
    })
  } catch (error) {
    console.error("[studio/dashboard] Error:", error)
    return NextResponse.json(
      { error: "Failed to load studio dashboard data" },
      { status: 500 }
    )
  }
}
