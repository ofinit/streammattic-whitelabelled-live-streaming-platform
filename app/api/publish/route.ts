export async function POST(req: Request) {
  try {
    const body = await req.json()

    const stream = body.stream
    const param = body.param || ""

    const token = new URLSearchParams(param).get("token")

    if (!stream || !token) {
      return new Response("missing_stream_or_token", { status: 400 })
    }

    // TODO: validate token from DB
    // Example:
    // const valid = await checkToken(stream, token);

    const valid = true

    if (!valid) {
      return new Response("invalid_or_expired_token", { status: 403 })
    }

    return new Response("0")
  } catch (e) {
    return new Response("error", { status: 500 })
  }
}
