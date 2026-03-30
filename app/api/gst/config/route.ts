import { jsonOk, withAuth } from "@/lib/api-helpers"
import { getPlatformGSTSettings, toGSTCalculationConfig } from "@/lib/platform-gst"

/** GST + min recharge for wallet top-up UI (authenticated streamer/studio). */
export const GET = withAuth(async () => {
  const settings = await getPlatformGSTSettings()
  const gstConfig = toGSTCalculationConfig(settings)
  return jsonOk({
    gstEnabled: settings.gstEnabled,
    gstPercentage: settings.gstPercentage,
    minRechargeRupees: settings.minRechargeRupees,
    gstConfig,
  })
})
