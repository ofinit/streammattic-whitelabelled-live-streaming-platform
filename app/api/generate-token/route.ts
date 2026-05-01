import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { withAuth } from "@/lib/api-helpers"
import { buildRtmpStreamId, createRtmpTokenForStream } from "@/lib/rtmp-auth"

export const POST = withAuth(async (user, request) => {
  const body = await request.json().catch(() => ({}))
  const userId = String(body.userId || user.id || "")
  const eventLookup = body.eventId != null ? String(body.eventId) : null
  const durationMinutes = Number(body.durationMinutes || 0)

  if (!userId || (!body.streamId && !eventLookup)) {
    return NextResponse.json({ error: "userId and streamId are required" }, { status: 400 })
  }
  if (user.role !== "admin" && userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sql = getDb()
  let eventId: string | null = null
  let eventSlug: string | null = null
  if (eventLookup) {
    const rows = await sql`SELECT id, slug, user_id, stream_type FROM events WHERE id::text = ${eventLookup} OR slug = ${eventLookup}`
    if (rows.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    const event = rows[0] as Record<string, unknown>
    if (user.role !== "admin" && event.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (event.stream_type !== "rtmp") {
      return NextResponse.json({ error: "Only RTMP events can generate SRS tokens" }, { status: 400 })
    }
    eventId = event.id as string
    eventSlug = (event.slug as string | null) || eventId
  }
  const streamId = String(body.streamId || (eventSlug ? buildRtmpStreamId(eventSlug) : ""))

  const credits = await sql`SELECT rtmp FROM user_credits WHERE user_id = ${userId}`
  const available = Number((credits[0] as Record<string, unknown> | undefined)?.rtmp || 0)
  if (available <= 0) {
    return NextResponse.json({ error: "No RTMP credits available" }, { status: 400 })
  }

  const result = await createRtmpTokenForStream({
    sql,
    userId,
    eventId,
    streamId,
    expiresInSeconds: durationMinutes > 0 ? durationMinutes * 60 : undefined,
    updateCredentialTarget: !!eventId,
  })

  return NextResponse.json({
    token: result.token,
    rtmpUrl: result.rtmpUrl,
    streamKey: result.streamKey,
    expiresAt: result.expiresAt,
  })
})
