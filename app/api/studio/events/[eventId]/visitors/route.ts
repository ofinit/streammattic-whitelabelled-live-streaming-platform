import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { userCanViewEventVisitors } from "@/lib/event-visitor-access"
import { escapeSqlLikePattern } from "@/lib/search-like"
import { resolveVisitorIpCountry } from "@/lib/ip-country"

/** geoip-lite and DB drivers expect Node; avoid Edge where lookups can throw. */
export const runtime = "nodejs"

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

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

    const { eventId } = await params
    if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

    const sql = getDb()
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS capture_visitor_data BOOLEAN NOT NULL DEFAULT true`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS studio_id UUID REFERENCES users(id) ON DELETE SET NULL`.catch(() => {})
    await sql`CREATE INDEX IF NOT EXISTS idx_events_studio_id ON events(studio_id)`.catch(() => {})
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`.catch(() => {})
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
    await sql`ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS accept_language TEXT`.catch(() => {})
    await sql`ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS visitor_key TEXT`.catch(() => {})
    await sql`ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS session_key TEXT`.catch(() => {})

    let eventRows: Record<string, unknown>[]
    try {
      eventRows = await sql`
        SELECT id, user_id, studio_id FROM events
        WHERE id::text = ${eventId} OR slug = ${eventId}
        LIMIT 1
      `
    } catch {
      eventRows = await sql`
        SELECT id, user_id FROM events
        WHERE id::text = ${eventId} OR slug = ${eventId}
        LIMIT 1
      `
    }
    if (eventRows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    const evRaw = eventRows[0] as Record<string, unknown>
    const event = toCamel(evRaw) as { id: string; userId: string; studioId?: string | null }
    if (event.studioId === undefined) event.studioId = null
    if (!userCanViewEventVisitors({ id: user.id as string, role }, event)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const url = req.nextUrl
    const searchRaw = url.searchParams.get("q")?.trim() || ""
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 50))
    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)
    const format = url.searchParams.get("format")?.toLowerCase() === "csv" ? "csv" : "json"

    const eventUuid = String(event.id)

    const conditions: string[] = ["r.event_id = $1"]
    const params: unknown[] = [eventUuid]
    let i = 2

    if (searchRaw.length > 0) {
      const pattern = `%${escapeSqlLikePattern(searchRaw)}%`
      const p = i
      conditions.push(`(
        r.full_name ILIKE $${p} ESCAPE '\\' OR
        r.email ILIKE $${p} ESCAPE '\\' OR
        r.phone ILIKE $${p} ESCAPE '\\' OR
        COALESCE(r.ip_address, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(r.user_agent, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(r.referer, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(r.ip_country, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(r.utm_source, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(r.utm_medium, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(r.utm_campaign, '') ILIKE $${p} ESCAPE '\\' OR
        to_char(r.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') ILIKE $${p} ESCAPE '\\'
      )`)
      params.push(pattern)
      i++
    }

    const where = conditions.join(" AND ")
    const limitIdx = i
    const offsetIdx = i + 1
    const listParams = [...params, limit, offset]

    const countRows = await sql(
      `SELECT COUNT(*)::bigint AS c FROM event_visitor_registrations r WHERE ${where}`,
      params,
    )
    const total = Number((countRows[0] as { c: string }).c) || 0

    const rows = await sql(
      `SELECT
        r.id,
        r.event_id AS event_id,
        r.full_name AS full_name,
        r.email AS email,
        r.phone AS phone,
        r.ip_address AS ip_address,
        r.ip_country AS ip_country,
        r.user_agent AS user_agent,
        r.accept_language AS accept_language,
        r.referer AS referer,
        r.utm_source AS utm_source,
        r.utm_medium AS utm_medium,
        r.utm_campaign AS utm_campaign,
        r.created_at AS created_at,
        to_char(r.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') AS time_ist
      FROM event_visitor_registrations r
      WHERE ${where}
      ORDER BY r.created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams,
    )

    const enrichedRows = (rows as Record<string, unknown>[]).map((row) => {
      const ip = row.ip_address != null ? String(row.ip_address) : ""
      const country = resolveVisitorIpCountry(ip || null, row.ip_country != null ? String(row.ip_country) : null)
      return { ...row, ip_country: country ?? row.ip_country }
    })

    if (format === "csv") {
      const header = [
        "time_ist",
        "visitor_full_name",
        "visitor_email",
        "visitor_phone",
        "visitor_ip",
        "visitor_ip_country",
        "visitor_user_agent",
        "referer",
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "created_at_utc",
      ].join(",")
      const lines = enrichedRows.map((row) =>
        [
          csvEscape(String(row.time_ist ?? "")),
          csvEscape(String(row.full_name ?? "")),
          csvEscape(String(row.email ?? "")),
          csvEscape(String(row.phone ?? "")),
          csvEscape(String(row.ip_address ?? "")),
          csvEscape(String(row.ip_country ?? "")),
          csvEscape(String(row.user_agent ?? "")),
          csvEscape(String(row.referer ?? "")),
          csvEscape(String(row.utm_source ?? "")),
          csvEscape(String(row.utm_medium ?? "")),
          csvEscape(String(row.utm_campaign ?? "")),
          csvEscape(String(row.created_at ?? "")),
        ].join(","),
      )
      const csv = [header, ...lines].join("\r\n")
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="event-visitors.csv"',
        },
      })
    }

    const registrations = enrichedRows.map((r) => toCamel(r))

    return NextResponse.json({ success: true, total, limit, offset, registrations })
  } catch (error: unknown) {
    console.error("[studio/events/.../visitors]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
