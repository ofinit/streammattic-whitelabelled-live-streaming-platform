import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getDb } from "@/lib/db"
import { getRequestClientIp } from "@/lib/client-ip"
import { lookupCountryCodeFromIp } from "@/lib/ip-country"
import { resolveAttribution } from "@/lib/attribution"
import { getCurrentUser } from "@/lib/auth"
import { VISITOR_COOKIE_NAME, VISITOR_COOKIE_MAX_AGE_SEC } from "@/lib/visitor-analytics-constants"
import { redis } from "@/lib/redis"
import { insertFunnelEvent } from "@/lib/analytics-funnel"

const RATE_WINDOW_SEC = 3600
const RATE_MAX = 300

type Params = { params: Promise<{ eventId: string }> }

async function allowRateLimit(ip: string | null, eventUuid: string): Promise<boolean> {
  if (!ip) return true
  const key = `watch_sess:${ip}:${eventUuid}`
  if (redis) {
    try {
      const n = await redis.incr(key)
      if (n === 1) await redis.expire(key, RATE_WINDOW_SEC)
      return n <= RATE_MAX
    } catch {
      return true
    }
  }
  return true
}

function newVisitorKey(): string {
  return `vk_${randomUUID().replace(/-/g, "")}`
}

async function resolveEventUuid(eventId: string): Promise<string | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id FROM events WHERE id::text = ${eventId} OR slug = ${eventId} LIMIT 1
  `
  if (rows.length === 0) return null
  return (rows[0] as { id: string }).id
}

export async function POST(req: NextRequest, { params }: Params) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const sessionKey = typeof body.sessionKey === "string" ? body.sessionKey.trim() : ""
  if (!sessionKey || sessionKey.length > 200) {
    return NextResponse.json({ error: "sessionKey is required" }, { status: 400 })
  }

  const landingPageUrl =
    typeof body.landingPageUrl === "string" ? body.landingPageUrl.trim().slice(0, 4000) : null
  const bodyVisitorKey = typeof body.visitorKey === "string" ? body.visitorKey.trim().slice(0, 200) : ""

  const eventUuid = await resolveEventUuid(eventId)
  if (!eventUuid) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const sqlCheck = getDb()
  const eventRows = await sqlCheck`
    SELECT is_suspended FROM events WHERE id = ${eventUuid}::uuid LIMIT 1
  `
  const suspended = (eventRows[0] as { is_suspended?: boolean } | undefined)?.is_suspended
  if (suspended === true) {
    return NextResponse.json({ error: "Event unavailable" }, { status: 403 })
  }

  const ip = getRequestClientIp(req)
  if (!(await allowRateLimit(ip, eventUuid))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const cookieVisitor = req.cookies.get(VISITOR_COOKIE_NAME)?.value?.trim()
  let visitorKey = cookieVisitor || bodyVisitorKey || ""
  let setCookie = false
  if (!visitorKey) {
    visitorKey = newVisitorKey()
    setCookie = true
  }

  const user = await getCurrentUser()
  const userId = user?.id ? (user.id as string) : null
  const isLoggedIn = !!userId

  const referer = req.headers.get("referer")?.slice(0, 2000) ?? null
  const attr = resolveAttribution(req.nextUrl, referer, null)
  const userAgent = req.headers.get("user-agent")?.slice(0, 2000) ?? null
  const acceptLanguage = req.headers.get("accept-language")?.slice(0, 500) ?? null
  const countryCode = lookupCountryCodeFromIp(ip)

  const sql = getDb()

  const inserted = await sql`
    INSERT INTO event_visitor_sessions (
      event_id, visitor_key, session_key, user_id, is_logged_in,
      ip_address, user_agent, accept_language, referer, landing_page_url,
      utm_source, utm_medium, utm_campaign, country_code,
      first_seen_at, last_seen_at
    ) VALUES (
      ${eventUuid}::uuid,
      ${visitorKey},
      ${sessionKey},
      ${userId},
      ${isLoggedIn},
      ${ip},
      ${userAgent},
      ${acceptLanguage},
      ${referer},
      ${landingPageUrl},
      ${attr.utm_source},
      ${attr.utm_medium},
      ${attr.utm_campaign},
      ${countryCode},
      NOW(),
      NOW()
    )
    ON CONFLICT (event_id, session_key) DO NOTHING
    RETURNING id
  `

  if (inserted.length === 0) {
    await sql`
      UPDATE event_visitor_sessions
      SET
        last_seen_at = NOW(),
        visitor_key = COALESCE(${visitorKey}, visitor_key),
        user_id = COALESCE(${userId}, user_id),
        is_logged_in = is_logged_in OR ${isLoggedIn},
        duration_seconds = GREATEST(
          0,
          LEAST(
            86400,
            FLOOR(EXTRACT(EPOCH FROM (NOW() - first_seen_at)))::int
          )
        )
      WHERE event_id = ${eventUuid}::uuid AND session_key = ${sessionKey}
    `
  } else {
    await insertFunnelEvent({
      eventType: "VISITOR_LANDED",
      visitorKey,
      sessionKey,
      userId,
      relatedEventId: eventUuid,
      utmSource: attr.utm_source,
      utmMedium: attr.utm_medium,
      utmCampaign: attr.utm_campaign,
    })
  }

  const res = NextResponse.json({ ok: true, visitorKey })
  if (setCookie) {
    res.cookies.set(VISITOR_COOKIE_NAME, visitorKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: VISITOR_COOKIE_MAX_AGE_SEC,
    })
  }
  return res
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const sessionKey = typeof body.sessionKey === "string" ? body.sessionKey.trim() : ""
  if (!sessionKey) return NextResponse.json({ error: "sessionKey is required" }, { status: 400 })

  const eventUuid = await resolveEventUuid(eventId)
  if (!eventUuid) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const ip = getRequestClientIp(req)
  if (!(await allowRateLimit(ip, eventUuid))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const cookieVisitor = req.cookies.get(VISITOR_COOKIE_NAME)?.value?.trim()
  const bodyVisitor = typeof body.visitorKey === "string" ? body.visitorKey.trim() : ""
  const visitorKey = cookieVisitor || bodyVisitor
  if (!visitorKey) {
    return NextResponse.json({ error: "visitor key missing" }, { status: 400 })
  }

  const user = await getCurrentUser()
  const userId = user?.id ? (user.id as string) : null
  const isLoggedIn = !!userId

  const sql = getDb()
  const updated = await sql`
    UPDATE event_visitor_sessions
    SET
      last_seen_at = NOW(),
      visitor_key = ${visitorKey},
      user_id = COALESCE(${userId}, user_id),
      is_logged_in = is_logged_in OR ${isLoggedIn},
      duration_seconds = GREATEST(
        0,
        LEAST(
          86400,
          FLOOR(EXTRACT(EPOCH FROM (NOW() - first_seen_at)))::int
        )
      )
    WHERE event_id = ${eventUuid}::uuid AND session_key = ${sessionKey}
    RETURNING id
  `

  if (updated.length === 0) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
