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
      SELECT id
      FROM stream_tokens
      WHERE stream_id = ${stream}
        AND token_hash = ${hashRtmpToken(token)}
        AND is_active = true
        AND expires_at > NOW()
      LIMIT 1
    `

    const isValid = rows.length > 0
    console.log("VALIDATION RESULT:", isValid)

    return Response.json({ code: isValid ? 0 : 403 })
  } catch (err) {
    console.error("ERROR:", err)
    return Response.json({ code: 500 })
  }
}
