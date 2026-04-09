import { jsonOk, withAuth } from "@/lib/api-helpers"
import { getPlatformGSTSettings, toGSTCalculationConfig } from "@/lib/platform-gst"
import { getPaymentGatewayFlags } from "@/lib/payment-gateway-settings"

/** GST + min recharge for wallet top-up UI (authenticated streamer/studio). */
export const GET = withAuth(async () => {
  const settings = await getPlatformGSTSettings()
  const gstConfig = toGSTCalculationConfig(settings)
  const pg = await getPaymentGatewayFlags()
  return jsonOk({
    gstEnabled: settings.gstEnabled,
    gstPercentage: settings.gstPercentage,
    minRechargeRupees: settings.minRechargeRupees,
    gstConfig,
    razorpayEnabled: pg.razorpay,
    instamojoEnabled: pg.instamojo,
  })
})
