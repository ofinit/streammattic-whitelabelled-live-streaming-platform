import { NextResponse } from "next/server"
import { handleSrsPublish, type SrsHookPayload } from "@/lib/rtmp-sessions"
import { getSrsSettings } from "@/lib/srs-settings"

async function isAuthorized(request: Request): Promise<boolean> {
  const settings = await getSrsSettings()
  if (!settings.hookSecret) return true
  const url = new URL(request.url)
  const provided =
    url.searchParams.get("secret") ||
    request.headers.get("x-srs-hook-secret") ||
    request.headers.get("x-hook-secret")
  return provided === settings.hookSecret
}

export async function POST(request: Request) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ code: 403, error: "Forbidden" }, { status: 403 })
  }
  const payload = (await request.json().catch(() => ({}))) as SrsHookPayload
  const result = await handleSrsPublish(payload)
  if (result.ok) {
    return NextResponse.json({ code: 0, ok: true, reason: result.reason }, { status: 200 })
  }
  return NextResponse.json({ code: result.status || 403, ok: false, reason: result.reason }, { status: result.status })
}
