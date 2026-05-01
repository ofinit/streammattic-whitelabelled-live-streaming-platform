import { NextResponse } from "next/server"
import { getStreamStatus, getMockStreamStats, getServerHealth } from "@/lib/nimble-service"
import { getDb } from "@/lib/db"

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

    let applicationName = `event-${eventId}`
    try {
      const sql = getDb()
      const rows = await sql`SELECT slug, stream_type FROM events WHERE id::text = ${eventId} OR slug = ${eventId} LIMIT 1`
      const event = rows[0] as Record<string, unknown> | undefined
      if (event?.stream_type === "rtmp" && typeof event.slug === "string" && event.slug.trim()) {
        applicationName = event.slug.trim()
      }
    } catch {
      // Fall back to legacy event-{id} lookup when DB is unavailable.
    }

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
