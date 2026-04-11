import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

const ALLOWED_DAYS = new Set([7, 30, 90])

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"])
    const sql = getDb()
    const { searchParams } = new URL(req.url)
    const daysRaw = searchParams.get("days")
    const days = ALLOWED_DAYS.has(Number(daysRaw)) ? Number(daysRaw) : 30
    const eventFilter = searchParams.get("eventId")?.trim()

    const since = new Date(Date.now() - days * 86400000).toISOString()

    const sessionStats = eventFilter
      ? await sql`
          SELECT
            COUNT(*)::bigint AS total_sessions,
            COUNT(DISTINCT visitor_key)::bigint AS unique_visitors
          FROM event_visitor_sessions
          WHERE first_seen_at >= ${since}::timestamptz
            AND event_id = ${eventFilter}::uuid
        `
      : await sql`
          SELECT
            COUNT(*)::bigint AS total_sessions,
            COUNT(DISTINCT visitor_key)::bigint AS unique_visitors
          FROM event_visitor_sessions
          WHERE first_seen_at >= ${since}::timestamptz
        `

    const returningRows = eventFilter
      ? await sql`
          SELECT COUNT(*)::bigint AS c FROM (
            SELECT visitor_key
            FROM event_visitor_sessions
            WHERE first_seen_at >= ${since}::timestamptz
              AND event_id = ${eventFilter}::uuid
            GROUP BY visitor_key
            HAVING COUNT(*) > 1
          ) sub
        `
      : await sql`
          SELECT COUNT(*)::bigint AS c FROM (
            SELECT visitor_key
            FROM event_visitor_sessions
            WHERE first_seen_at >= ${since}::timestamptz
            GROUP BY visitor_key
            HAVING COUNT(*) > 1
          ) sub
        `

    const topSources = eventFilter
      ? await sql`
          SELECT utm_source AS source, COUNT(*)::bigint AS c
          FROM event_visitor_sessions
          WHERE first_seen_at >= ${since}::timestamptz
            AND event_id = ${eventFilter}::uuid
          GROUP BY utm_source
          ORDER BY c DESC
          LIMIT 12
        `
      : await sql`
          SELECT utm_source AS source, COUNT(*)::bigint AS c
          FROM event_visitor_sessions
          WHERE first_seen_at >= ${since}::timestamptz
          GROUP BY utm_source
          ORDER BY c DESC
          LIMIT 12
        `

    const funnelRows = await sql`
      SELECT event_type, COUNT(*)::bigint AS c
      FROM analytics_funnel_events
      WHERE created_at >= ${since}::timestamptz
      GROUP BY event_type
      ORDER BY c DESC
    `

    const s0 = sessionStats[0] as { total_sessions: bigint; unique_visitors: bigint }
    const totalSessions = Number(s0.total_sessions)
    const uniqueVisitors = Number(s0.unique_visitors)
    const returningVisitors = Number((returningRows[0] as { c: bigint }).c)

    return NextResponse.json({
      success: true,
      windowDays: days,
      eventId: eventFilter || null,
      totalSessions,
      uniqueVisitors,
      returningVisitors,
      returningRate:
        uniqueVisitors > 0 ? Math.round((returningVisitors / uniqueVisitors) * 1000) / 1000 : 0,
      topSources: (topSources as { source: string; c: bigint }[]).map((r) => ({
        source: r.source,
        count: Number(r.c),
      })),
      funnel: (funnelRows as { event_type: string; c: bigint }[]).map((r) => ({
        eventType: r.event_type,
        count: Number(r.c),
      })),
    })
  } catch (error: unknown) {
    console.error("Admin visitors analytics error:", error)
    const msg = error instanceof Error ? error.message : ""
    if (msg === "Forbidden" || msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
