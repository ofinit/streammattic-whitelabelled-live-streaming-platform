export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const stream = body.stream;
    const param = body.param || "";

    const token = new URLSearchParams(param).get("token");

    console.log("Incoming publish:", { stream, token });

    if (!stream || !token) {
      return new Response("missing_stream_or_token", { status: 400 });
    }

    // 🚀 TEMP: allow everything for now
    return new Response("0");

  } catch (e) {
    console.error(e);
    return new Response("error", { status: 500 });
  }
}
