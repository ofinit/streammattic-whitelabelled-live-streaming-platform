import { NextResponse } from "next/server"
import { reconcileActiveRtmpUsage } from "@/lib/rtmp-sessions"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  const headerSecret = request.headers.get("x-cron-secret")
  const urlSecret = new URL(request.url).searchParams.get("secret")
  return auth === `Bearer ${secret}` || headerSecret === secret || urlSecret === secret
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await reconcileActiveRtmpUsage()
  return NextResponse.json({ success: true, ...result })
}
