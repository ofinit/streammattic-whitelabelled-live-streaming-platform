import { NextRequest, NextResponse } from "next/server"
import { getDb, toCamel } from "@/lib/db"
import { resolveFaviconForWatchEvent } from "@/lib/favicon-resolve"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })

  try {
    const sql = getDb()
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS subtitle TEXT`.catch(() => {})

    // Minimal select for DBs that don't have new columns yet
    const minimalQuery = sql`
      SELECT e.id, e.user_id, e.title, e.subtitle, e.description, e.status, e.stream_type,
             e.scheduled_at, e.ended_at, e.thumbnail, e.slug,
             e.hls_url, e.youtube_url, e.embed_code,
             e.current_viewers, e.total_views,
             e.allow_chat, e.allow_reactions, e.is_password_protected,
             e.timezone, e.show_scheduled_page,
             COALESCE(e.show_recording, false) AS show_recording,
             e.template_id, e.template_data,
             u.name AS studio_name,
             COALESCE((
               SELECT json_agg(
                 json_build_object(
                   'id', ed.id,
                   'label', ed.label,
                   'scheduledAt', ed.scheduled_at,
                   'timezone', ed.timezone,
                   'streamKey', ed.stream_key,
                   'rtmpUrl', ed.rtmp_url,
                   'sortOrder', ed.sort_order
                 ) ORDER BY ed.sort_order
               )
               FROM event_dates ed
               WHERE ed.event_id = e.id
             ), '[]'::json) AS event_dates
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id::text = ${eventId} OR e.slug = ${eventId}
    `

    const fullQuery = sql`
      SELECT e.id, e.user_id, e.title, e.subtitle, e.description, e.status, e.stream_type,
             e.scheduled_at, e.ended_at, e.thumbnail, e.slug,
             e.hls_url, e.youtube_url, e.embed_code,
             e.current_viewers, e.total_views,
             e.allow_chat, e.allow_reactions, e.is_password_protected,
             e.timezone, e.show_scheduled_page,
             COALESCE(e.show_recording, false) AS show_recording,
             e.validity_expires_at,
             e.hero_image_url, e.player_image_url, e.photo_gallery_urls,
             e.photographer_logo_url, e.photographer_contact,
             e.template_id, e.template_data,
             u.name AS studio_name,
             COALESCE((
               SELECT json_agg(
                 json_build_object(
                   'id', ed.id,
                   'label', ed.label,
                   'scheduledAt', ed.scheduled_at,
                   'timezone', ed.timezone,
                   'streamKey', ed.stream_key,
                   'rtmpUrl', ed.rtmp_url,
                   'sortOrder', ed.sort_order
                 ) ORDER BY ed.sort_order
               )
               FROM event_dates ed
               WHERE ed.event_id = e.id
             ), '[]'::json) AS event_dates
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id::text = ${eventId} OR e.slug = ${eventId}
    `

    let rows: Record<string, unknown>[]
    try {
      rows = await fullQuery
    } catch (colErr: unknown) {
      const msg = colErr instanceof Error ? colErr.message : String(colErr)
      if (msg.includes("does not exist") || msg.includes("column")) {
        rows = await minimalQuery
      } else {
        throw colErr
      }
    }

    // Optionally attach YouTube broadcast ID (separate query so we don't overwrite row)
    if (rows.length > 0) {
      try {
        const ybRows = await sql`
          SELECT broadcast_id FROM youtube_broadcasts
          WHERE event_id = ${rows[0].id ?? eventId}
          ORDER BY created_at DESC LIMIT 1
        `
        if (ybRows.length > 0 && ybRows[0]) {
          (rows[0] as Record<string, unknown>).youtube_broadcast_id = (ybRows[0] as Record<string, unknown>).broadcast_id
        }
      } catch {
        // youtube_broadcasts table may not exist
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    const eventRow = toCamel(rows[0] as Record<string, unknown>) as { userId?: string }
    const ownerId = eventRow.userId ?? ""
    const faviconHref = await resolveFaviconForWatchEvent(ownerId || null)
    return NextResponse.json({ event: { ...eventRow, faviconHref } })
  } catch (err) {
    console.error("Watch event fetch error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
