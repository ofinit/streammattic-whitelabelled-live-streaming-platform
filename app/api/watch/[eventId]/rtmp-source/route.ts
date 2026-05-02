import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

type ProbeResult = {
  url: string
  exists: boolean
  status: number | null
}

async function mediaExists(url: string): Promise<ProbeResult> {
  try {
    let res = await fetch(url, { method: "HEAD", cache: "no-store" })
    if (res.status === 405) {
      res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { Range: "bytes=0-0" },
      })
    }
    return { url, exists: res.ok, status: res.status }
  } catch {
    return { url, exists: false, status: null }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId: rawEventId } = await params
  const eventId = rawEventId?.toLowerCase()
  if (!eventId || eventId.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const sql = getDb()
  const rows = await sql(
    `SELECT e.id,
            e.slug,
            e.stream_type,
            e.stream_key,
            e.status,
            COALESCE(NULLIF(sr.public_url, ''), NULLIF(ss.final_recording_url, '')) AS final_recording_url
     FROM events e
     LEFT JOIN LATERAL (
       SELECT public_url
       FROM stream_recordings
       WHERE event_id = e.id AND status = 'merged'
       ORDER BY merged_at DESC
       LIMIT 1
     ) sr ON true
     LEFT JOIN LATERAL (
       SELECT final_recording_url
       FROM stream_sessions
       WHERE event_id = e.id
         AND merged = true
         AND final_recording_url IS NOT NULL
         AND final_recording_url <> ''
       ORDER BY COALESCE(merged_at, ended_at, updated_at, created_at) DESC
       LIMIT 1
     ) ss ON true
     WHERE e.id::text = $1 OR e.slug = $1
     LIMIT 1`,
    [eventId],
  )

  const event = rows[0] as Record<string, unknown> | undefined
  if (!event || event.stream_type !== "rtmp") {
    return NextResponse.json({ error: "RTMP event not found" }, { status: 404 })
  }

  const streamKey = typeof event.stream_key === "string" ? event.stream_key : ""
  const slug = typeof event.slug === "string" ? event.slug : eventId
  const stream = (streamKey.split("?")[0] || slug).trim()
  const hlsUrl = `https://rtmplive.in/live/${stream}.m3u8`
  const fallbackMp4Url = `/recordings/${stream}.mp4`
  const fallbackMp4ProbeUrl = new URL(fallbackMp4Url, request.url).toString()
  const finalRecordingUrl =
    typeof event.final_recording_url === "string" ? event.final_recording_url.trim() : ""
  const mp4Urls = Array.from(new Set([finalRecordingUrl, fallbackMp4Url].filter(Boolean)))

  const hls = await mediaExists(hlsUrl)
  const mp4 = await Promise.all(
    mp4Urls.map((url) =>
      mediaExists(url.startsWith("/") ? fallbackMp4ProbeUrl : url).then((result) => ({
        ...result,
        url,
      })),
    ),
  )
  const mp4Match = mp4.find((item) => item.exists)
  const selected = hls.exists
    ? { type: "hls", url: hlsUrl }
    : mp4Match
      ? { type: "mp4", url: mp4Match.url }
      : { type: event.status === "live" ? "waiting" : "processing", url: null }

  return NextResponse.json(
    {
      stream,
      status: event.status,
      hlsUrl,
      finalRecordingUrl: finalRecordingUrl || null,
      fallbackMp4Url,
      hls,
      mp4,
      selected,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
      },
    },
  )
}
