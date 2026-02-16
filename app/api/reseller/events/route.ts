import { NextRequest, NextResponse } from "next/server"
import { getEvents, getEventCount } from "@/lib/db-queries"

export async function GET(req: NextRequest) {
  const resellerId = req.nextUrl.searchParams.get("resellerId")
  const search = req.nextUrl.searchParams.get("search") || undefined
  const status = req.nextUrl.searchParams.get("status") || undefined
  const limit = Number(req.nextUrl.searchParams.get("limit") || 50)
  const offset = Number(req.nextUrl.searchParams.get("offset") || 0)

  if (!resellerId) {
    return NextResponse.json({ error: "resellerId is required" }, { status: 400 })
  }

  try {
    const [events, totalCount, liveCount, scheduledCount, completedCount] = await Promise.all([
      getEvents({ resellerId, search, status, limit, offset }),
      getEventCount({ resellerId }),
      getEventCount({ resellerId, status: "live" }),
      getEventCount({ resellerId, status: "scheduled" }),
      getEventCount({ resellerId, status: "completed" }),
    ])

    return NextResponse.json({
      events,
      totalCount,
      liveCount,
      scheduledCount,
      completedCount,
    })
  } catch (error) {
    console.error("[reseller/events] Error:", error)
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    )
  }
}
