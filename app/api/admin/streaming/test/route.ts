import { jsonOk, withRole } from "@/lib/api-helpers"
import { getSrsSettings } from "@/lib/srs-settings"
import type { SrsSettings } from "@/lib/srs-settings"

type SrsTestSettings = Partial<Omit<SrsSettings, "httpPort">> & {
  apiHost?: string
  httpApiPort?: number | string | ""
  httpPort?: number | string | ""
}

function cleanHost(host: string): string {
  return host.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "")
}

function buildSrsTestUrl(settings: SrsTestSettings, fallback: SrsSettings): string {
  const rawHost = settings.apiHost ?? settings.host ?? fallback.host
  const host = cleanHost(String(rawHost || fallback.host))
  const rawPort = settings.httpApiPort ?? settings.httpPort ?? ""
  const port = typeof rawPort === "string" ? rawPort.trim() : rawPort

  if (port !== "" && port !== undefined && port !== null) {
    return `http://${host}:${port}/api/v1/summaries`
  }

  return `https://${host}/api/v1/summaries`
}

function formatFetchError(error: unknown): string {
  if (!(error instanceof Error)) return String(error)
  const cause = error.cause
  if (cause && typeof cause === "object") {
    const details = cause as Record<string, unknown>
    const parts = [details.code, details.errno, details.syscall, details.hostname]
      .filter((value): value is string => typeof value === "string" && value.length > 0)
    if (parts.length > 0) return `${error.message} (${parts.join(", ")})`
  }
  return error.message
}

export const POST = withRole(["admin"], async (_user, request) => {
  const settings = await getSrsSettings()
  const body = await request.json().catch(() => ({}))
  const input = body?.settings && typeof body.settings === "object" ? body.settings as SrsTestSettings : {}
  const apiKey = typeof input.apiKey === "string" && !input.apiKey.startsWith("•") ? input.apiKey : settings.apiKey
  const headers: Record<string, string> = { Accept: "application/json" }
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const testUrl = buildSrsTestUrl(input, settings)
  console.log("Testing SRS URL:", testUrl)

  try {
    const res = await fetch(testUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    if (!res.ok) {
      throw new Error(`SRS API failed: ${res.status}`)
    }
    const data = await res.json()
    return jsonOk({ ok: true, success: true, status: res.status, url: testUrl, data, message: `SRS API is reachable at ${testUrl}` })
  } catch (error) {
    return jsonOk({ ok: false, url: testUrl, message: `${formatFetchError(error)} while fetching ${testUrl}` }, 503)
  }
})
