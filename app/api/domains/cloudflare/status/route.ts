import { NextResponse } from "next/server"

export async function GET() {
  const cfApiToken = process.env.CLOUDFLARE_API_TOKEN
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID

  return NextResponse.json({
    configured: Boolean(cfApiToken && cfZoneId),
  })
}
