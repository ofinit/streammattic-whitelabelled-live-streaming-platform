import { handleSrsPublish, type SrsHookPayload } from "@/lib/rtmp-sessions"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SrsHookPayload

    const stream = typeof body.stream === "string" ? body.stream : String(body.stream || "")
    const param = typeof body.param === "string" ? body.param : ""

    // Extract token safely from SRS param, e.g. "?token=xxxx".
    const token = new URLSearchParams(param).get("token")

    console.log("SRS Publish:", { stream, token })

    if (!token) {
      return Response.json({ code: 403 })
    }

    const result = await handleSrsPublish(body)
    if (!result.ok) {
      return Response.json({ code: 403 })
    }

    return Response.json({ code: 0 })
  } catch (err) {
    console.error("ERROR:", err)
    return Response.json({ code: 500 })
  }
}
