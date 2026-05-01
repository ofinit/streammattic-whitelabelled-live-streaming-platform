import { jsonOk, withRole } from "@/lib/api-helpers"
import { fetchSrsApiJson } from "@/lib/srs-api-url"
import { getSrsSettings } from "@/lib/srs-settings"
import type { SrsSettings } from "@/lib/srs-settings"

type SrsTestSettings = Partial<Omit<SrsSettings, "httpPort">> & {
  apiHost?: string
  httpApiPort?: number | string | ""
  httpPort?: number | string | ""
}

export const POST = withRole(["admin"], async (_user, request) => {
  const settings = await getSrsSettings()
  const body = await request.json().catch(() => ({}))
  const input = body?.settings && typeof body.settings === "object" ? body.settings as SrsTestSettings : {}
  const apiKey = typeof input.apiKey === "string" && !input.apiKey.startsWith("•") ? input.apiKey : settings.apiKey
  const connection = {
    ...settings,
    ...input,
    host: input.apiHost || input.host || settings.host,
    httpPort: input.httpApiPort ?? input.httpPort ?? settings.httpPort,
    apiKey,
  }

  const result = await fetchSrsApiJson(connection, "/api/v1/summaries")
  console.log("Testing SRS URL:", result.url, result.usedFallback ? `(DNS fallback ${result.fallbackAddress})` : "")

  return jsonOk({
    ok: result.ok,
    success: result.ok,
    status: result.status,
    url: result.url,
    usedFallback: result.usedFallback,
    fallbackAddress: result.fallbackAddress,
    data: result.data,
    message: result.message,
  }, result.ok ? 200 : 503)
})
