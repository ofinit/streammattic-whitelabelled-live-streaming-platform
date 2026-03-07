import { NextResponse } from "next/server"
import { getStreamStatus, getMockStreamStats, getServerHealth } from "@/lib/nimble-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const checkServer = searchParams.get("server") === "true"

    if (checkServer) {
      const serverHealth = await getServerHealth()
      return NextResponse.json({ success: true, server: serverHealth })
    }

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const applicationName = `event-${eventId}`

    // Try live Nimble API first
    const liveStats = await getStreamStatus(applicationName)

    if (liveStats) {
      return NextResponse.json({ success: true, stats: liveStats, source: "live" })
    }

    // Fall back to mock stats for development
    const mockStats = getMockStreamStats(eventId)
    return NextResponse.json({ success: true, stats: mockStats, source: "mock" })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to get stream status: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}
