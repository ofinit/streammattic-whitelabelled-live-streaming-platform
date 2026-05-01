import { jsonOk, withRole } from "@/lib/api-helpers"
import { getSrsSettings, testSrsConnection } from "@/lib/srs-settings"

export const POST = withRole(["admin"], async () => {
  const settings = await getSrsSettings()
  const result = await testSrsConnection(settings)
  return jsonOk(result, result.ok ? 200 : 503)
})
