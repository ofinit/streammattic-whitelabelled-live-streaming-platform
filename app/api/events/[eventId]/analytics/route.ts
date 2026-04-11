import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { userCanViewEventVisitors } from "@/lib/event-visitor-access"

const ALLOWED_DAYS = new Set([7, 30, 90])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const role = user.role as string
    if (!["streamer", "studio", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId: rawId } = await params
    if (!rawId?.trim()) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const daysRaw = searchParams.get("days")
    const days = ALLOWED_DAYS.has(Number(daysRaw)) ? Number(daysRaw) : 30
    const since = new Date(Date.now() - days * 86400000).toISOString()

    const sql = getDb()
    const eventRows = await sql`
      SELECT
        id,
        user_id,
        studio_id,
        title,
        slug,
        status,
        stream_type,
        scheduled_at,
        started_at,
        ended_at,
        current_viewers,
        total_views,
        max_viewers,
        validity_expires_at,
        created_at,
        is_mock
      FROM events
      WHERE id::text = ${rawId} OR slug = ${rawId}
      LIMIT 1
    `

    if (eventRows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const evRaw = eventRows[0] as Record<string, unknown>
    const event = toCamel(evRaw) as {
      id: string
      userId: string
      studioId?: string | null
      title: string
      slug: string | null
      status: string
      streamType: string
      scheduledAt: string | null
      startedAt: string | null
      endedAt: string | null
      currentViewers: number
      totalViews: number
      maxViewers: number | null
      validityExpiresAt: string | null
      createdAt: string
      isMock: boolean
    }

    if (
      !userCanViewEventVisitors(
        { id: user.id as string, role },
        { userId: event.userId, studioId: event.studioId ?? null },
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const eventUuid = event.id

    const sessionStats = await sql`
      SELECT
        COUNT(*)::bigint AS total_sessions,
        COUNT(DISTINCT visitor_key)::bigint AS unique_visitors,
        AVG(duration_seconds)::float AS avg_duration_seconds
      FROM event_visitor_sessions
      WHERE first_seen_at >= ${since}::timestamptz
        AND event_id = ${eventUuid}::uuid
    `

    const returningRows = await sql`
      SELECT COUNT(*)::bigint AS c FROM (
        SELECT visitor_key
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${since}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY visitor_key
        HAVING COUNT(*) > 1
      ) sub
    `

    const topSources = await sql`
      SELECT utm_source AS source, COUNT(*)::bigint AS c
      FROM event_visitor_sessions
      WHERE first_seen_at >= ${since}::timestamptz
        AND event_id = ${eventUuid}::uuid
      GROUP BY utm_source
      ORDER BY c DESC
      LIMIT 12
    `

    const topMediums = await sql`
      SELECT utm_medium AS medium, COUNT(*)::bigint AS c
      FROM event_visitor_sessions
      WHERE first_seen_at >= ${since}::timestamptz
        AND event_id = ${eventUuid}::uuid
      GROUP BY utm_medium
      ORDER BY c DESC
      LIMIT 8
    `

    const topReferrers = await sql`
      SELECT
        COALESCE(NULLIF(TRIM(referer), ''), '(direct)') AS ref,
        COUNT(*)::bigint AS c
      FROM event_visitor_sessions
      WHERE first_seen_at >= ${since}::timestamptz
        AND event_id = ${eventUuid}::uuid
      GROUP BY COALESCE(NULLIF(TRIM(referer), ''), '(direct)')
      ORDER BY c DESC
      LIMIT 10
    `

    const topCountries = await sql`
      SELECT
        COALESCE(NULLIF(TRIM(country_code), ''), 'unknown') AS country,
        COUNT(*)::bigint AS c
      FROM event_visitor_sessions
      WHERE first_seen_at >= ${since}::timestamptz
        AND event_id = ${eventUuid}::uuid
      GROUP BY COALESCE(NULLIF(TRIM(country_code), ''), 'unknown')
      ORDER BY c DESC
      LIMIT 12
    `

    const leadsWindow = await sql`
      SELECT COUNT(*)::bigint AS c
      FROM event_visitor_registrations
      WHERE event_id = ${eventUuid}::uuid
        AND created_at >= ${since}::timestamptz
    `

    const leadsTotal = await sql`
      SELECT COUNT(*)::bigint AS c
      FROM event_visitor_registrations
      WHERE event_id = ${eventUuid}::uuid
    `

    const funnelRows = await sql`
      SELECT event_type, COUNT(*)::bigint AS c
      FROM analytics_funnel_events
      WHERE created_at >= ${since}::timestamptz
        AND related_event_id = ${eventUuid}::uuid
      GROUP BY event_type
      ORDER BY c DESC
    `

    const orderRows = await sql`
      SELECT
        status,
        COUNT(*)::bigint AS c,
        COALESCE(SUM(total_price), 0)::bigint AS total_paise
      FROM orders
      WHERE event_id = ${eventUuid}::uuid
        AND created_at >= ${since}::timestamptz
      GROUP BY status
    `

    const s0 = sessionStats[0] as {
      total_sessions: bigint
      unique_visitors: bigint
      avg_duration_seconds: number | null
    }
    const totalSessions = Number(s0.total_sessions)
    const uniqueVisitors = Number(s0.unique_visitors)
    const returningVisitors = Number((returningRows[0] as { c: bigint }).c)
    const avgDurationSeconds =
      s0.avg_duration_seconds != null && !Number.isNaN(Number(s0.avg_duration_seconds))
        ? Math.round(Number(s0.avg_duration_seconds))
        : null

    return NextResponse.json({
      success: true,
      windowDays: days,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        status: event.status,
        streamType: event.streamType,
        scheduledAt: event.scheduledAt,
        startedAt: event.startedAt,
        endedAt: event.endedAt,
        currentViewers: event.currentViewers,
        totalViews: event.totalViews,
        maxViewers: event.maxViewers ?? 0,
        validityExpiresAt: event.validityExpiresAt,
        createdAt: event.createdAt,
        isMock: event.isMock,
      },
      sessions: {
        totalSessions,
        uniqueVisitors,
        returningVisitors,
        returningRate:
          uniqueVisitors > 0 ? Math.round((returningVisitors / uniqueVisitors) * 1000) / 1000 : 0,
        avgDurationSeconds,
      },
      acquisition: {
        topSources: (topSources as { source: string; c: bigint }[]).map((r) => ({
          source: r.source,
          count: Number(r.c),
        })),
        topMediums: (topMediums as { medium: string; c: bigint }[]).map((r) => ({
          medium: r.medium,
          count: Number(r.c),
        })),
        topReferrers: (topReferrers as { ref: string; c: bigint }[]).map((r) => ({
          referer: r.ref,
          count: Number(r.c),
        })),
        topCountries: (topCountries as { country: string; c: bigint }[]).map((r) => ({
          country: r.country,
          count: Number(r.c),
        })),
      },
      leads: {
        inWindow: Number((leadsWindow[0] as { c: bigint }).c),
        allTime: Number((leadsTotal[0] as { c: bigint }).c),
      },
      funnel: (funnelRows as { event_type: string; c: bigint }[]).map((r) => ({
        eventType: r.event_type,
        count: Number(r.c),
      })),
      orders: (orderRows as { status: string; c: bigint; total_paise: bigint }[]).map((r) => ({
        status: r.status,
        count: Number(r.c),
        totalPaise: Number(r.total_paise),
      })),
    })
  } catch (error: unknown) {
    console.error("[api/events/[eventId]/analytics]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
