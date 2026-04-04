import { NextResponse } from "next/server"

/** Liveness probe for Coolify/Docker/Traefik — no DB or external calls.
 *  Plain-text body `OK` so platforms that match "Response Text" (e.g. Coolify) pass. */
export async function GET() {
  return new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

/** Many probes and `curl -I` use HEAD; respond without a body. */
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
