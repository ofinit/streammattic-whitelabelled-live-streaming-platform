import { getDb } from "@/lib/db"
import { hashRtmpToken } from "@/lib/rtmp-auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const stream = body.stream
    const param = body.param || ""

    const token = new URLSearchParams(param).get("token")

    console.log("SRS HOOK:", { stream, token })

    if (!stream || !token) {
      return Response.json({ code: 403 })
    }

    const db = getDb()
    const rows = await db`
      SELECT id, event_id, token_hash
      FROM stream_tokens
      WHERE stream_id = ${stream}
        AND is_active = true
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `

    const streamData = rows[0] as Record<string, unknown> | undefined
    if (!streamData) {
      console.log("VALIDATION RESULT:", false)
      return Response.json({ code: 403 })
    }

    const isValid = streamData.token_hash === hashRtmpToken(token)
    console.log("VALIDATION RESULT:", isValid)

    if (!isValid) {
      return Response.json({ code: 403 })
    }

    if (streamData.event_id) {
      await db`
        UPDATE events
        SET status = 'live',
            started_at = COALESCE(started_at, NOW()),
            ended_at = NULL,
            updated_at = NOW()
        WHERE id = ${streamData.event_id as string}
      `
    }

    return Response.json({ code: 0 })
  } catch (err) {
    console.error("ERROR:", err)
    return Response.json({ code: 500 })
  }
}
