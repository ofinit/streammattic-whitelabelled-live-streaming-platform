import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getRequestClientIp } from "@/lib/client-ip"
import { lookupCountryNameFromIp } from "@/lib/ip-country"
import { composeInternationalPhone } from "@/lib/phone-country-codes"
import { resolveAttribution } from "@/lib/attribution"

const RATE_LIMIT_PER_HOUR = 30

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId: rawEventId } = await params
  if (!rawEventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
  const eventId = rawEventId.toLowerCase()

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""
  const emailRaw = typeof body.email === "string" ? body.email.trim() : ""
  const email = emailRaw.toLowerCase()
  const phoneDial = typeof body.phoneDial === "string" ? body.phoneDial.trim() : ""
  const phoneLocal = typeof body.phoneLocal === "string" ? body.phoneLocal.trim() : ""
  const utmQuery = typeof body.utmQuery === "string" ? body.utmQuery : ""
  const visitorKeyBody = typeof body.visitorKey === "string" ? body.visitorKey.trim().slice(0, 200) : ""
  const sessionKeyBody = typeof body.sessionKey === "string" ? body.sessionKey.trim().slice(0, 200) : ""

  if (!fullName || fullName.length > 500) {
    return NextResponse.json({ error: "Full name is required" }, { status: 400 })
  }
  if (!email || !isValidEmail(email) || email.length > 320) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
  }
  const phone = composeInternationalPhone(phoneDial || "+91", phoneLocal)
  if (!phone || phone.length > 64) {
    return NextResponse.json({ error: "Valid mobile number is required" }, { status: 400 })
  }

  const sql = getDb()
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS capture_visitor_data BOOLEAN NOT NULL DEFAULT true`.catch(() => {})
  await sql`
    CREATE TABLE IF NOT EXISTS event_visitor_registrations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      accept_language TEXT,
      referer TEXT,
      utm_source TEXT,
      utm_medium TEXT,
        utm_campaign TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_country TEXT
      )
    `.catch(() => {})
    await sql`ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS ip_country TEXT`.catch(() => {})
  await sql`ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS visitor_key TEXT`.catch(() => {})
  await sql`ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS session_key TEXT`.catch(() => {})

  const eventRows = await sql`
    SELECT id, is_suspended, capture_visitor_data
    FROM events
    WHERE id::text = ${eventId} OR slug = ${eventId}
    LIMIT 1
  `

  if (eventRows.length === 0) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  const ev = eventRows[0] as Record<string, unknown>
  if (ev.is_suspended === true) {
    return NextResponse.json({ error: "Event unavailable" }, { status: 403 })
  }
  const capture = ev.capture_visitor_data !== false
  if (!capture) {
    return NextResponse.json({ error: "Visitor capture is disabled for this event" }, { status: 403 })
  }

  const eventUuid = ev.id as string
  const ip = getRequestClientIp(req)
  if (ip) {
    const recent = await sql`
      SELECT COUNT(*)::int AS c FROM event_visitor_registrations
      WHERE event_id = ${eventUuid}
        AND ip_address = ${ip}
        AND created_at > NOW() - INTERVAL '1 hour'
    `
    const count = Number((recent[0] as { c: number }).c) || 0
    if (count >= RATE_LIMIT_PER_HOUR) {
      return NextResponse.json({ error: "Too many submissions. Try again later." }, { status: 429 })
    }
  }

  const referer = req.headers.get("referer")?.slice(0, 2000) ?? null
  const utm = resolveAttribution(req.nextUrl, referer, utmQuery)
  const userAgent = req.headers.get("user-agent")?.slice(0, 2000) ?? null
  const acceptLanguage = req.headers.get("accept-language")?.slice(0, 500) ?? null
  const ipCountry = lookupCountryNameFromIp(ip)

  const visitorKeySql = visitorKeyBody || null
  const sessionKeySql = sessionKeyBody || null

  await sql`
    INSERT INTO event_visitor_registrations (
      event_id, full_name, email, phone,
      ip_address, ip_country, user_agent, accept_language, referer,
      utm_source, utm_medium, utm_campaign,
      visitor_key, session_key
    ) VALUES (
      ${eventUuid},
      ${fullName},
      ${email},
      ${phone},
      ${ip},
      ${ipCountry},
      ${userAgent},
      ${acceptLanguage},
      ${referer},
      ${utm.utm_source},
      ${utm.utm_medium},
      ${utm.utm_campaign},
      ${visitorKeySql},
      ${sessionKeySql}
    )
  `

  return NextResponse.json({ success: true })
}
