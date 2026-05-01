import { jsonOk, withRole } from "@/lib/api-helpers"
import { buildSrsApiUrl } from "@/lib/srs-api-url"
import { getSrsSettings } from "@/lib/srs-settings"
import type { SrsSettings } from "@/lib/srs-settings"

type SrsTestSettings = Partial<Omit<SrsSettings, "httpPort">> & {
  httpPort?: number | string | ""
}

function cleanHost(host: string): string {
  return host.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
}

function buildSrsApiBaseUrl(settings: SrsTestSettings, fallback: SrsSettings): string {
  const host = typeof settings.host === "string" && settings.host.trim() ? settings.host.trim() : fallback.host
  const rawPort = settings.httpPort ?? fallback.httpPort
  const port = typeof rawPort === "string" ? rawPort.trim() : rawPort

  if (port !== "" && port !== undefined && port !== null) {
    return `http://${cleanHost(host)}:${port}`
  }

  if (/^https?:\/\//i.test(host)) {
    const url = new URL(host)
    if (!url.pathname || url.pathname === "/") url.pathname = "/api"
    return url.toString().replace(/\/$/, "")
  }

  return `https://${cleanHost(host)}/api`
}

export const POST = withRole(["admin"], async (_user, request) => {
  const settings = await getSrsSettings()
  const body = await request.json().catch(() => ({}))
  const input = body?.settings && typeof body.settings === "object" ? body.settings as SrsTestSettings : {}
  const apiKey = typeof input.apiKey === "string" && !input.apiKey.startsWith("•") ? input.apiKey : settings.apiKey
  const headers: Record<string, string> = { Accept: "application/json" }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  try {
    const baseUrl = buildSrsApiBaseUrl(input, settings)
    const res = await fetch(buildSrsApiUrl(baseUrl, "/api/v1/summaries"), {
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      return jsonOk({ ok: false, status: res.status, message: `SRS API returned ${res.status}` }, 503)
    }
    return jsonOk({ ok: true, status: res.status, message: "SRS API is reachable" })
  } catch (error) {
    return jsonOk({ ok: false, message: (error as Error).message }, 503)
  }
})
