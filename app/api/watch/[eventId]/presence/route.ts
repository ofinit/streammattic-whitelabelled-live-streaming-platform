import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { insertFunnelEvent } from "@/lib/analytics-funnel"

type Params = { params: Promise<{ eventId: string }> }
const ACTIVE_VIEWER_WINDOW_SEC = 90

async function resolveEventUuid(rawEventId: string): Promise<string | null> {
  const eventId = rawEventId.toLowerCase()
  const sql = getDb()
  const rows = await sql`
    SELECT id FROM events WHERE id::text = ${eventId} OR slug = ${eventId} LIMIT 1
  `
  if (rows.length === 0) return null
  return (rows[0] as { id: string }).id
}

// GET — active viewer count from recent watch sessions.
export async function GET(_req: NextRequest, { params }: Params) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 })

  try {
    const eventUuid = await resolveEventUuid(eventId)
    if (!eventUuid) return NextResponse.json({ ok: false, currentViewers: 0 }, { status: 404 })

    const db = getDb()
    const rows = await db`
      SELECT COUNT(*)::int AS current_viewers
      FROM event_visitor_sessions
      WHERE event_id = ${eventUuid}::uuid
        AND last_seen_at >= NOW() - (${ACTIVE_VIEWER_WINDOW_SEC}::int * INTERVAL '1 second')
    `
    const currentViewers = Number((rows[0] as { current_viewers?: number } | undefined)?.current_viewers ?? 0)
    return NextResponse.json({ ok: true, currentViewers })
  } catch {
    return NextResponse.json({ ok: false, currentViewers: 0 }, { status: 500 })
  }
}

// POST — viewer joined: increment current_viewers (+ optional funnel)
export async function POST(req: NextRequest, { params }: Params) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 })
  try {
    let visitorKey: string | undefined
    let sessionKey: string | undefined
    try {
      const body = (await req.json()) as { visitorKey?: string; sessionKey?: string }
      if (typeof body.visitorKey === "string" && body.visitorKey.trim()) visitorKey = body.visitorKey.trim()
      if (typeof body.sessionKey === "string" && body.sessionKey.trim()) sessionKey = body.sessionKey.trim()
    } catch {
      /* empty body */
    }

    const db = getDb()
    await db`
      UPDATE events
      SET current_viewers = GREATEST(0, COALESCE(current_viewers, 0) + 1),
          total_views      = COALESCE(total_views, 0) + 1
      WHERE (id::text = ${eventId} OR slug = ${eventId})
        AND status IN ('live', 'on_break')
    `

    const eventUuid = await resolveEventUuid(eventId)
    if (eventUuid && visitorKey) {
      await insertFunnelEvent({
        eventType: "VIEWER_JOINED",
        visitorKey,
        sessionKey: sessionKey ?? null,
        relatedEventId: eventUuid,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

// DELETE — viewer left: decrement current_viewers
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { eventId } = await params
  if (!eventId) return NextResponse.json({ ok: false }, { status: 400 })
  try {
    const db = getDb()
    await db`
      UPDATE events
      SET current_viewers = GREATEST(0, COALESCE(current_viewers, 0) - 1)
      WHERE (id::text = ${eventId} OR slug = ${eventId})
        AND status IN ('live', 'on_break')
    `
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
