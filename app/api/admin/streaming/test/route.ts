import { jsonOk, withRole } from "@/lib/api-helpers"
import { getSrsSettings, testSrsConnection } from "@/lib/srs-settings"
import type { SrsSettings } from "@/lib/srs-settings"

export const POST = withRole(["admin"], async (_user, request) => {
  const settings = await getSrsSettings()
  const body = await request.json().catch(() => ({}))
  const input = body?.settings && typeof body.settings === "object" ? body.settings as Partial<SrsSettings> : {}
  const testSettings: SrsSettings = {
    ...settings,
    ...input,
    apiKey: typeof input.apiKey === "string" && !input.apiKey.startsWith("•") ? input.apiKey : settings.apiKey,
    hookSecret: typeof input.hookSecret === "string" && !input.hookSecret.startsWith("•") ? input.hookSecret : settings.hookSecret,
    workerSecret: typeof input.workerSecret === "string" && !input.workerSecret.startsWith("•") ? input.workerSecret : settings.workerSecret,
  }
  const result = await testSrsConnection(testSettings)
  return jsonOk(result, result.ok ? 200 : 503)
})
