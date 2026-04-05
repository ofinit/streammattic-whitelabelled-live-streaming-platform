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
    console.log(`[api/watch/[eventId]] Fetching event for ID/Slug: ${eventId}`)

    // Query for the event by ID or Slug
    const rows = await sql`
      SELECT e.*, 
             u.name AS studio_name,
             u.platform_name,
             u.logo_url,
             u.primary_color,
             u.secondary_color,
             u.custom_domain,
             (
               SELECT domain FROM domains 
               WHERE user_id = u.id AND verification_status = 'verified' AND is_primary = true 
               LIMIT 1
             ) AS primary_domain,
             (
               SELECT json_agg(json_build_object(
                 'id', ed.id,
                 'label', ed.label,
                 'scheduledAt', ed.scheduled_at,
                 'timezone', ed.timezone,
                 'streamKey', ed.stream_key,
                 'rtmpUrl', ed.rtmp_url,
                 'sortOrder', ed.sort_order
               ) ORDER BY ed.sort_order)
               FROM event_dates ed
               WHERE ed.event_id = e.id
             ) as event_dates
      FROM events e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id::text = ${eventId} OR e.slug = ${eventId}
    `

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
    if (youtubeBroadcastId) {
      eventRow.youtubeBroadcastId = youtubeBroadcastId
    }

    const ownerId = eventRow.userId
    console.log(`[api/watch/[eventId]] Resolving favicon for owner: ${ownerId}`)
    const faviconHref = await resolveFaviconForWatchEvent(ownerId || null)

    return NextResponse.json({
      event: eventRow,
      favicon: faviconHref
    })
  } catch (err) {
    console.error(`[api/watch/[eventId]] CRITICAL ERROR:`, err)
    // Fallback to minimal data if full query failed (maybe domains table doesn't exist?)
    try {
       const sql = getDb()
       const rows = await sql`SELECT * FROM events WHERE id::text = ${eventId} OR slug = ${eventId} LIMIT 1`
       if (rows.length > 0) {
         return NextResponse.json({ event: toCamel(rows[0] as any) })
       }
    } catch (fallbackErr) {
       console.error(`[api/watch/[eventId]] Fallback also failed:`, fallbackErr)
    }
    return NextResponse.json({ error: "Internal server error", message: err.message }, { status: 500 })
  }
}
