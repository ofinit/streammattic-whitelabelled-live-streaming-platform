import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { escapeSqlLikePattern } from "@/lib/search-like"
import { resolveVisitorIpCountry } from "@/lib/ip-country"

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"])
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.catch(() => {})
    await sql`ALTER TABLE event_visitor_registrations ADD COLUMN IF NOT EXISTS ip_country TEXT`.catch(() => {})

    const url = req.nextUrl
    const eventId = url.searchParams.get("eventId")?.trim() || null
    const studioUserId = url.searchParams.get("studioUserId")?.trim() || null
    const searchRaw = url.searchParams.get("q")?.trim() || ""
    const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit")) || 50))
    const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0)
    const format = url.searchParams.get("format")?.toLowerCase() === "csv" ? "csv" : "json"
    const dateFrom = url.searchParams.get("dateFrom")?.trim() || null
    const dateTo = url.searchParams.get("dateTo")?.trim() || null

    const conditions: string[] = ["1=1"]
    const params: unknown[] = []
    let i = 1
    if (eventId) {
      conditions.push(`r.event_id = $${i++}`)
      params.push(eventId)
    }
    if (studioUserId) {
      conditions.push(`(e.user_id = $${i} OR e.studio_id = $${i})`)
      params.push(studioUserId)
      i++
    }
    if (dateFrom) {
      conditions.push(`r.created_at >= $${i++}::timestamptz`)
      params.push(dateFrom)
    }
    if (dateTo) {
      conditions.push(`r.created_at <= $${i++}::timestamptz`)
      params.push(dateTo)
    }

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
        COALESCE(e.title, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(e.slug, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(u.email, '') ILIKE $${p} ESCAPE '\\' OR
        COALESCE(u.name, '') ILIKE $${p} ESCAPE '\\' OR
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
      `SELECT COUNT(*)::bigint AS c
       FROM event_visitor_registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u ON u.id = e.user_id
       WHERE ${where}`,
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
        to_char(r.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI:SS') AS time_ist,
        e.title AS event_title,
        e.slug AS event_slug,
        u.email AS owner_email,
        u.name AS owner_name
      FROM event_visitor_registrations r
      JOIN events e ON e.id = r.event_id
      JOIN users u ON u.id = e.user_id
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
        "event_title",
        "event_slug",
        "streamer_studio_email",
        "streamer_studio_name",
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
          csvEscape(String(row.event_title ?? "")),
          csvEscape(String(row.event_slug ?? "")),
          csvEscape(String(row.owner_email ?? "")),
          csvEscape(String(row.owner_name ?? "")),
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
    const msg = error instanceof Error ? error.message : String(error)
    if (msg === "Forbidden" || msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[admin/event-visitors]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
