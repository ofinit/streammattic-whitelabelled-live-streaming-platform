import { NextResponse } from "next/server"
import { reconcileActiveRtmpUsage } from "@/lib/rtmp-sessions"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  const headerSecret = request.headers.get("x-cron-secret")
  // Note: do NOT accept secret via URL query param — URLs are logged by proxies and servers.
  return auth === `Bearer ${secret}` || headerSecret === secret
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const result = await reconcileActiveRtmpUsage()
  return NextResponse.json({ success: true, ...result })
}
