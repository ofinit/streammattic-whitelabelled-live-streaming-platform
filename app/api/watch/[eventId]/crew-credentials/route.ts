import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyCrewPin } from "@/lib/crew-pin"
import { buildRtmpStreamId, ensureRtmpTokenForStream, extractTokenFromSrsParam, hashRtmpToken } from "@/lib/rtmp-auth"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId: rawEventId } = await params
  if (!rawEventId) return NextResponse.json({ error: "Missing event id" }, { status: 400 })
  const eventId = rawEventId.toLowerCase()

  try {
    const body = await req.json().catch(() => ({}))
    const pin = body.pin != null ? String(body.pin).trim() : ""
    if (!pin) return NextResponse.json({ error: "PIN is required" }, { status: 400 })

    const sql = getDb()
    const rows = await sql`
      SELECT e.id, e.user_id, e.slug, e.crew_pin_hash, e.stream_type, e.rtmp_url, e.stream_key
      FROM events e
      WHERE e.id::text = ${eventId} OR e.slug = ${eventId}
    `
    if (rows.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    const row = rows[0] as Record<string, unknown>
    const crewPinHash = row.crew_pin_hash as string | null
    if (!crewPinHash) return NextResponse.json({ error: "Crew PIN not set for this event" }, { status: 403 })

    if (!verifyCrewPin(pin, crewPinHash)) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
    }

    const streamType = row.stream_type as string
    let rtmpUrl: string | null = (row.rtmp_url as string) || null
    let streamKey: string | null = (row.stream_key as string) || null

    if (streamType === "youtube_api") {
      try {
        const yb = await sql`
          SELECT rtmp_url, stream_key FROM youtube_broadcasts
          WHERE event_id = ${(row.id as string)}
          ORDER BY created_at DESC LIMIT 1
        `
        if (yb.length > 0) {
          const b = yb[0] as Record<string, unknown>
          rtmpUrl = (b.rtmp_url as string) || rtmpUrl
          streamKey = (b.stream_key as string) || streamKey
        }
      } catch {
        // table may not exist
      }
    }

    if (streamType === "rtmp") {
      const currentKey = streamKey || ""
      const canonicalStreamId = buildRtmpStreamId((row.slug as string | null) || (row.id as string))
      const streamId = currentKey.split("?")[0] || canonicalStreamId
      const currentToken = extractTokenFromSrsParam(currentKey.includes("?") ? currentKey.slice(currentKey.indexOf("?")) : "")
      const tokenHash = currentToken ? hashRtmpToken(currentToken) : ""
      const tokenRows = tokenHash
        ? await sql`
            SELECT id FROM stream_tokens
            WHERE stream_id = ${streamId}
              AND token_hash = ${tokenHash}
              AND is_active = true
              AND expires_at > NOW()
            LIMIT 1
          `
        : []
      if (tokenRows.length === 0) {
        const generated = await ensureRtmpTokenForStream({
          sql,
          userId: row.user_id as string,
          eventId: row.id as string,
          streamId: canonicalStreamId,
          currentStreamKey: currentKey,
          updateCredentialTarget: true,
        })
        rtmpUrl = generated.rtmpUrl
        streamKey = generated.streamKey
      }
    }

    return NextResponse.json({
      rtmpUrl: rtmpUrl || "",
      streamKey: streamKey || "",
    })
  } catch (err) {
    console.error("[crew-credentials] Error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
