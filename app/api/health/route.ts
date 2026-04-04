import { NextResponse } from "next/server"

/** Liveness probe for Coolify/Docker/Traefik — no DB or external calls. */
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 })
}

/** Many probes and `curl -I` use HEAD; respond without a body. */
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
