import { extractTokenFromSrsParam, findValidRtmpToken } from "@/lib/rtmp-auth"
import { getDb } from "@/lib/db"

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return Response.json({ code: 400 })
  }

  const streamId = typeof body.stream === "string" ? body.stream.trim() : ""
  const token = extractTokenFromSrsParam(body.param)

  if (!streamId || !token) {
    return Response.json({ code: 403 })
  }

  try {
    const sql = getDb()
    const valid = await findValidRtmpToken({ sql, streamId, token })

    if (!valid) {
      return Response.json({ code: 403 })
    }

    // Mark the event as live when publishing starts
    if (valid.event_id) {
      await sql`
        UPDATE events
        SET status = 'live', started_at = COALESCE(started_at, NOW()), updated_at = NOW()
        WHERE id = ${valid.event_id as string}
          AND status IN ('scheduled', 'draft')
      `
    }

    return Response.json({ code: 0 })
  } catch (err) {
    console.error("[publish] DB validation error:", err)
    // Fail closed — deny on error
    return Response.json({ code: 500 })
  }
}
