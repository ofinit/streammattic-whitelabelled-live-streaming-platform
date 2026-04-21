import { NextRequest, NextResponse } from "next/server"
import { getDb, toCamel } from "@/lib/db"
import { resolveFaviconForWatchEvent } from "@/lib/favicon-resolve"
import { normalizeWatchEventTemplateFields } from "@/lib/watch-template-data"

/** Crawlers and misrouted probes hit `/api/watch/robots.txt` etc. — not event slugs. */
const WATCH_EVENT_ID_SKIP = new Set(
  ["robots.txt", "favicon.ico", "sitemap.xml", "sitemap_index.xml", "apple-touch-icon.png", "manifest.json"].map((s) =>
    s.toLowerCase(),
  ),
)

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
  if (WATCH_EVENT_ID_SKIP.has(eventId.toLowerCase()) || eventId.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const sql = getDb()
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false`.catch(() => {})
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS capture_visitor_data BOOLEAN NOT NULL DEFAULT true`.catch(() => {})
    console.log(`[api/watch/[eventId]] Fetching event for ID/Slug: ${eventId}`)

    // Branding lives on studio_branding, not users. One bind for id OR slug (avoids driver edge cases).
    const rows = await sql(
      `SELECT e.*, 
             u.name AS studio_name,
             sb.platform_name,
             sb.logo AS logo_url,
             sb.primary_color,
             sb.secondary_color,
             (
               SELECT domain FROM domains 
               WHERE user_id = u.id AND verification_status = 'verified' AND is_primary = true 
               LIMIT 1
             ) AS primary_domain,
             (
               SELECT domain FROM domains 
               WHERE user_id = u.id AND verification_status = 'verified' AND is_primary = true 
               LIMIT 1
             ) AS custom_domain,
             (
               SELECT COALESCE(
                 json_agg(
                   json_build_object(
                     'id', ed.id,
                     'label', ed.label,
                     'scheduledAt', ed.scheduled_at,
                     'timezone', ed.timezone,
                     'streamKey', ed.stream_key,
                     'rtmpUrl', ed.rtmp_url,
                     'sortOrder', ed.sort_order
                   )
                   ORDER BY ed.sort_order
                 ),
                 '[]'::json
               )
               FROM event_dates ed
               WHERE ed.event_id = e.id
             ) AS event_dates
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN studio_branding sb ON sb.user_id = u.id
      WHERE e.id::text = $1 OR e.slug = $1`,
      [eventId],
    )

    if (rows.length === 0) {
      console.log(`[api/watch/[eventId]] Event not found: ${eventId}`)
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const eventData = rows[0] as Record<string, unknown>
    console.log(`[api/watch/[eventId]] Found event: ${eventData.id}`)
    
    // Attach YouTube broadcast ID if it exists
    let youtubeBroadcastId = null
    try {
      if (eventData.id) {
        const ybRows = await sql`
          SELECT broadcast_id FROM youtube_broadcasts
          WHERE event_id = ${eventData.id}
          ORDER BY created_at DESC LIMIT 1
        `
        if (ybRows.length > 0) {
          youtubeBroadcastId = (ybRows[0] as any).broadcast_id
        }
      }
    } catch (e) {
      console.warn(`[api/watch/[eventId]] YouTube broadcast lookup failed:`, e.message)
    }

    const eventRow = toCamel(eventData) as Record<string, any>
    normalizeWatchEventTemplateFields(eventRow)
    if (youtubeBroadcastId) {
      eventRow.youtubeBroadcastId = youtubeBroadcastId
    }

    const ownerId = eventRow.userId
    console.log(`[api/watch/[eventId]] Resolving favicon for owner: ${ownerId}`)
    const faviconHref = await resolveFaviconForWatchEvent(ownerId || null)

    const jsonHeaders = {
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    }

    return NextResponse.json(
      {
        event: eventRow,
        favicon: faviconHref,
      },
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error(`[api/watch/[eventId]] CRITICAL ERROR:`, err)
    // Fallback to minimal data if full query failed (maybe domains table doesn't exist?)
    try {
       const sql = getDb()
       const rows = await sql("SELECT * FROM events WHERE id::text = $1 OR slug = $1 LIMIT 1", [eventId])
       if (rows.length > 0) {
         const ev = toCamel(rows[0] as any) as Record<string, unknown>
         normalizeWatchEventTemplateFields(ev)
         return NextResponse.json(
           { event: ev },
           {
             headers: {
               "Cache-Control": "private, no-store, max-age=0, must-revalidate",
             },
           },
         )
       }
    } catch (fallbackErr) {
       console.error(`[api/watch/[eventId]] Fallback also failed:`, fallbackErr)
    }
    return NextResponse.json({ error: "Internal server error", message: err.message }, { status: 500 })
  }
}
