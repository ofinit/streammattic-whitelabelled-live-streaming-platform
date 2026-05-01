import { findValidRtmpToken } from "@/lib/rtmp-auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const stream = body.stream
    const param = body.param || ""

    const token = new URLSearchParams(param).get("token")

    console.log({ stream, token })

    if (!token) {
      return Response.json({ code: 403 })
    }

    const isValid = await findValidRtmpToken({
      streamId: stream,
      token,
    })

    return Response.json({ code: isValid ? 0 : 403 })
  } catch (err) {
    console.error("ERROR:", err)
    return Response.json({ code: 500 })
  }
}
