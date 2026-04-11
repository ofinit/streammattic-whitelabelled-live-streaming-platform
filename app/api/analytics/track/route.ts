import { NextRequest, NextResponse } from "next/server"
import { getRequestClientIp } from "@/lib/client-ip"
import { redis } from "@/lib/redis"
import { insertFunnelEvent } from "@/lib/analytics-funnel"

const RATE_WINDOW_SEC = 3600
const RATE_MAX = 200

async function allowTrack(ip: string | null): Promise<boolean> {
  if (!ip) return true
  if (!redis) return true
  try {
    const key = `analytics_track:${ip}`
    const n = await redis.incr(key)
    if (n === 1) await redis.expire(key, RATE_WINDOW_SEC)
    return n <= RATE_MAX
  } catch {
    return true
  }
}

/**
 * Public endpoint for optional client-side custom analytics events.
 * Requires visitor_key (from watch session flow). Fire-and-forget from the browser.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : ""
  const visitorKey = typeof body.visitorKey === "string" ? body.visitorKey.trim().slice(0, 200) : ""
  if (!name || !visitorKey) {
    return NextResponse.json({ error: "name and visitorKey are required" }, { status: 400 })
  }

  const ip = getRequestClientIp(req)
  if (!(await allowTrack(ip))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const sessionKey = typeof body.sessionKey === "string" ? body.sessionKey.trim().slice(0, 200) : null
  const eventId = typeof body.eventId === "string" ? body.eventId.trim() : null
  const extra =
    body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
      ? (body.payload as Record<string, unknown>)
      : {}

  await insertFunnelEvent({
    eventType: "ANALYTICS_CUSTOM",
    visitorKey,
    sessionKey,
    relatedEventId: eventId,
    payload: { clientEvent: name, ...extra },
  })

  return NextResponse.json({ ok: true })
}
