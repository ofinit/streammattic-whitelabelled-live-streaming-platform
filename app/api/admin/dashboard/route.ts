import { NextResponse } from "next/server"
import {
  getAdminDashboardStats,
  getStudios,
  getRecentOrders,
  getRecentEvents,
} from "@/lib/db-queries"

export async function GET() {
  try {
    const [stats, studios, recentOrders, recentEvents] = await Promise.all([
      getAdminDashboardStats(),
      getStudios({ limit: 5 }),
      getRecentOrders(5),
      getRecentEvents(10),
    ])

    return NextResponse.json({
      stats,
      studios,
      recentOrders,
      recentEvents,
    })
  } catch (error) {
    console.error("[admin/dashboard] Error:", error)
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    )
  }
}
