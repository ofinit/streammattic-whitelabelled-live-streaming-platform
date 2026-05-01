import { jsonOk, withRole } from "@/lib/api-helpers"
import { getPublicSrsSettings, saveSrsSettings, toPublicSrsSettings } from "@/lib/srs-settings"

export const GET = withRole(["admin"], async () => {
  return jsonOk({ settings: await getPublicSrsSettings() })
})

export const PUT = withRole(["admin"], async (_user, request) => {
  const body = await request.json().catch(() => ({}))
  const settings = await saveSrsSettings(body?.settings ?? body)
  return jsonOk({ settings: toPublicSrsSettings(settings) })
})
