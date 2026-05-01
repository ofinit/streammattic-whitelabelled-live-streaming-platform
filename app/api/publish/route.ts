export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY:", body);

    const stream = body.stream;
    const param = body.param || "";

    const token = param.replace("?token=", "");

    console.log("Parsed:", { stream, token });

    if (stream === "mefo" && token === "gDtEvZbDgph2zzqwz8WhkRyERsGrNx42B6-beacnNq4") {
      return Response.json({ code: 0 });
    }

    return Response.json({ code: 403 });

  } catch (err) {
    console.error("ERROR:", err);
    return Response.json({ code: 500 });
  }
}
