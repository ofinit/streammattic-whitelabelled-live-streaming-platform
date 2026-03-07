import { NextRequest, NextResponse } from "next/server"
import { getEvents, getEventCount } from "@/lib/db-queries"

export async function GET(req: NextRequest) {
  const studioId = req.nextUrl.searchParams.get("studioId")
  const search = req.nextUrl.searchParams.get("search") || undefined
  const status = req.nextUrl.searchParams.get("status") || undefined
  const limit = Number(req.nextUrl.searchParams.get("limit") || 50)
  const offset = Number(req.nextUrl.searchParams.get("offset") || 0)

  if (!studioId) {
    return NextResponse.json({ error: "studioId is required" }, { status: 400 })
  }

  try {
    const [events, totalCount, liveCount, scheduledCount, completedCount] = await Promise.all([
      getEvents({ studioId, search, status, limit, offset }),
      getEventCount({ studioId }),
      getEventCount({ studioId, status: "live" }),
      getEventCount({ studioId, status: "scheduled" }),
      getEventCount({ studioId, status: "completed" }),
    ])

    return NextResponse.json({
      events,
      totalCount,
      liveCount,
      scheduledCount,
      completedCount,
    })
  } catch (error) {
    console.error("[studio/events] Error:", error)
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    )
  }
}
