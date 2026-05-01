import { NextResponse } from "next/server"
import { handleSrsUnpublish, type SrsHookPayload } from "@/lib/rtmp-sessions"
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const payload = (await request.json().catch(() => ({}))) as SrsHookPayload
  const result = await handleSrsUnpublish(payload)
  return NextResponse.json({ ok: result.ok, reason: result.reason }, { status: result.status })
}
