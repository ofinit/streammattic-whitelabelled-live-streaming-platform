export async function POST(req: Request) {
  try {
    const body = await req.json();

    const stream = body.stream; // "mefo"
    const param = body.param || "";

    // extract token
    const token = param.replace("?token=", "");

    console.log("Incoming publish:", { stream, token });

    // 🔐 YOUR VALIDATION LOGIC
    if (!stream || !token) {
      return Response.json({ code: 403, message: "Missing stream or token" });
    }

    // Example validation (replace with DB check)
    if (stream === "mefo" && token === "gDtEvZbDgph2zzqwz8WhkRyERsGrNx42B6-beacnNq4") {
      return Response.json({ code: 0 });
    }

    return Response.json({ code: 403, message: "Invalid token" });

  } catch (err) {
    console.error(err);
    return Response.json({ code: 500 });
  }
}
