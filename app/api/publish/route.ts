export async function POST(req: Request) {
  const body = await req.json()

  const stream = body.stream
  const raw = body.param || ""
  const clean = raw.startsWith("?") ? raw.slice(1) : raw

  const token = new URLSearchParams(clean).get("token")

  console.log("STREAM:", stream)
  console.log("TOKEN:", token)
  console.log("PARAM:", raw)

  if (!token) {
    return Response.json({ code: 403 })
  }

  // IMPORTANT: temporarily bypass DB to confirm flow
  return Response.json({ code: 0 })

  /*
  // enable this AFTER testing
  const isValid = await db.streams.findOne({
    where: {
      stream_key: stream,
      token: token,
    },
  });

  return Response.json({ code: isValid ? 0 : 403 });
  */
}
