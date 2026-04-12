import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { userCanViewEventVisitors } from "@/lib/event-visitor-access"
import {
  aggregateUserAgentBuckets,
  countryCodeToFlagEmoji,
  deltaPct,
  fillDailyGaps,
} from "@/lib/event-analytics-aggregates"

const ALLOWED_DAYS = new Set([7, 30, 90])

function bounceRate(total: number, bounced: number): number {
  if (total <= 0) return 0
  return Math.round((bounced / total) * 1000) / 1000
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const role = user.role as string
    if (!["streamer", "studio", "admin"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id: rawId } = await params
    if (!rawId?.trim()) {
      return NextResponse.json({ error: "Missing event id" }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const daysRaw = searchParams.get("days")
    const days = ALLOWED_DAYS.has(Number(daysRaw)) ? Number(daysRaw) : 30

    const until = new Date()
    const since = new Date(until.getTime() - days * 86400000)
    const prevUntil = since
    const prevSince = new Date(prevUntil.getTime() - days * 86400000)

    const sinceIso = since.toISOString()
    const untilIso = until.toISOString()
    const prevSinceIso = prevSince.toISOString()
    const prevUntilIso = prevUntil.toISOString()

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

    const [
      sessionStats,
      sessionStatsPrev,
      bounceCurrent,
      bouncePrev,
      dailyRaw,
      returningRows,
      topSources,
      topMediums,
      topReferrers,
      topCountries,
      uaGrouped,
      landingRows,
      leadsWindow,
      leadsTotal,
      funnelRows,
      orderRows,
    ] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::bigint AS total_sessions,
          COUNT(DISTINCT visitor_key)::bigint AS unique_visitors,
          AVG(duration_seconds)::float AS avg_duration_seconds
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
      `,
      sql`
        SELECT
          COUNT(*)::bigint AS total_sessions,
          COUNT(DISTINCT visitor_key)::bigint AS unique_visitors
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${prevSinceIso}::timestamptz
          AND first_seen_at < ${prevUntilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
      `,
      sql`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE duration_seconds IS NULL OR duration_seconds < 30)::bigint AS bounced
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
      `,
      sql`
        SELECT
          COUNT(*)::bigint AS total,
          COUNT(*) FILTER (WHERE duration_seconds IS NULL OR duration_seconds < 30)::bigint AS bounced
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${prevSinceIso}::timestamptz
          AND first_seen_at < ${prevUntilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
      `,
      sql`
        SELECT
          to_char(date_trunc('day', first_seen_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
          COUNT(*)::bigint AS sessions,
          COUNT(DISTINCT visitor_key)::bigint AS unique_visitors
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY date_trunc('day', first_seen_at AT TIME ZONE 'UTC')
        ORDER BY day
      `,
      sql`
        SELECT COUNT(*)::bigint AS c FROM (
          SELECT visitor_key
          FROM event_visitor_sessions
          WHERE first_seen_at >= ${sinceIso}::timestamptz
            AND first_seen_at < ${untilIso}::timestamptz
            AND event_id = ${eventUuid}::uuid
          GROUP BY visitor_key
          HAVING COUNT(*) > 1
        ) sub
      `,
      sql`
        SELECT utm_source AS source, COUNT(*)::bigint AS c
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY utm_source
        ORDER BY c DESC
        LIMIT 12
      `,
      sql`
        SELECT utm_medium AS medium, COUNT(*)::bigint AS c
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY utm_medium
        ORDER BY c DESC
        LIMIT 8
      `,
      sql`
        SELECT
          COALESCE(NULLIF(TRIM(referer), ''), '(direct)') AS ref,
          COUNT(*)::bigint AS c
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY COALESCE(NULLIF(TRIM(referer), ''), '(direct)')
        ORDER BY c DESC
        LIMIT 12
      `,
      sql`
        SELECT
          COALESCE(NULLIF(TRIM(country_code), ''), 'unknown') AS country,
          COUNT(*)::bigint AS c
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY COALESCE(NULLIF(TRIM(country_code), ''), 'unknown')
        ORDER BY c DESC
        LIMIT 16
      `,
      sql`
        SELECT user_agent, COUNT(*)::bigint AS c
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY user_agent
        ORDER BY c DESC
        LIMIT 400
      `,
      sql`
        SELECT
          COALESCE(NULLIF(TRIM(landing_page_url), ''), '(direct)') AS url,
          COUNT(*)::bigint AS c
        FROM event_visitor_sessions
        WHERE first_seen_at >= ${sinceIso}::timestamptz
          AND first_seen_at < ${untilIso}::timestamptz
          AND event_id = ${eventUuid}::uuid
        GROUP BY COALESCE(NULLIF(TRIM(landing_page_url), ''), '(direct)')
        ORDER BY c DESC
        LIMIT 15
      `,
      sql`
        SELECT COUNT(*)::bigint AS c
        FROM event_visitor_registrations
        WHERE event_id = ${eventUuid}::uuid
          AND created_at >= ${sinceIso}::timestamptz
          AND created_at < ${untilIso}::timestamptz
      `,
      sql`
        SELECT COUNT(*)::bigint AS c
        FROM event_visitor_registrations
        WHERE event_id = ${eventUuid}::uuid
      `,
      sql`
        SELECT event_type, COUNT(*)::bigint AS c
        FROM analytics_funnel_events
        WHERE created_at >= ${sinceIso}::timestamptz
          AND created_at < ${untilIso}::timestamptz
          AND related_event_id = ${eventUuid}::uuid
        GROUP BY event_type
        ORDER BY c DESC
      `,
      sql`
        SELECT
          status,
          COUNT(*)::bigint AS c,
          COALESCE(SUM(total_price), 0)::bigint AS total_paise
        FROM orders
        WHERE event_id = ${eventUuid}::uuid
          AND created_at >= ${sinceIso}::timestamptz
          AND created_at < ${untilIso}::timestamptz
        GROUP BY status
      `,
    ])

    const s0 = sessionStats[0] as {
      total_sessions: bigint
      unique_visitors: bigint
      avg_duration_seconds: number | null
    }
    const sPrev = sessionStatsPrev[0] as {
      total_sessions: bigint
      unique_visitors: bigint
    }
    const bc = bounceCurrent[0] as { total: bigint; bounced: bigint }
    const bp = bouncePrev[0] as { total: bigint; bounced: bigint }

    const totalSessions = Number(s0.total_sessions)
    const uniqueVisitors = Number(s0.unique_visitors)
    const prevTotalSessions = Number(sPrev.total_sessions)
    const prevUniqueVisitors = Number(sPrev.unique_visitors)

    const bounced = Number(bc.bounced)
    const bounceTotal = Number(bc.total)
    const bouncedPrev = Number(bp.bounced)
    const bounceTotalPrev = Number(bp.total)

    const bounceRateCurrent = bounceRate(bounceTotal, bounced)
    const bounceRatePrevious = bounceRate(bounceTotalPrev, bouncedPrev)

    const avgDurationSeconds =
      s0.avg_duration_seconds != null && !Number.isNaN(Number(s0.avg_duration_seconds))
        ? Math.round(Number(s0.avg_duration_seconds))
        : null

    const returningVisitors = Number((returningRows[0] as { c: bigint }).c)

    const dailySparse = (dailyRaw as { day: string; sessions: bigint; unique_visitors: bigint }[]).map(
      (r) => ({
        day: r.day,
        sessions: Number(r.sessions),
        uniqueVisitors: Number(r.unique_visitors),
      }),
    )
    const series = fillDailyGaps(dailySparse, sinceIso, days)

    const uaBuckets = aggregateUserAgentBuckets(
      uaGrouped as { user_agent: string | null; c: bigint }[],
      totalSessions,
    )

    const topCountriesWithPct = (
      topCountries as { country: string; c: bigint }[]
    ).map((r) => {
      const count = Number(r.c)
      return {
        country: r.country,
        flagEmoji: countryCodeToFlagEmoji(r.country),
        count,
        pct: totalSessions > 0 ? Math.round((count / totalSessions) * 1000) / 10 : 0,
      }
    })

    return NextResponse.json({
      success: true,
      windowDays: days,
      bounceDefinition:
        "Share of watch sessions under 30s or unknown duration (proxy for bounce).",
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
      series,
      comparison: {
        previousPeriodDays: days,
        uniqueVisitors: {
          current: uniqueVisitors,
          previous: prevUniqueVisitors,
          deltaPct: deltaPct(uniqueVisitors, prevUniqueVisitors),
        },
        sessions: {
          current: totalSessions,
          previous: prevTotalSessions,
          deltaPct: deltaPct(totalSessions, prevTotalSessions),
        },
        bounceRate: {
          current: bounceRateCurrent,
          previous: bounceRatePrevious,
          deltaPct: deltaPct(bounceRateCurrent, bounceRatePrevious),
        },
      },
      sessions: {
        totalSessions,
        uniqueVisitors,
        returningVisitors,
        returningRate:
          uniqueVisitors > 0 ? Math.round((returningVisitors / uniqueVisitors) * 1000) / 1000 : 0,
        avgDurationSeconds,
        bounceRate: bounceRateCurrent,
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
        topCountries: topCountriesWithPct,
        landingPages: (landingRows as { url: string; c: bigint }[]).map((r) => ({
          url: r.url.length > 120 ? `${r.url.slice(0, 117)}…` : r.url,
          urlFull: r.url,
          count: Number(r.c),
        })),
        tech: uaBuckets,
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
    console.error("[api/events/[id]/analytics]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
