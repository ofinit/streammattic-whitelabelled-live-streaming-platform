import { jsonOk, jsonError, withRole } from "@/lib/api-helpers"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"
import { parsePlatformGSTSettings, type PlatformGSTSettings } from "@/lib/platform-gst"

export const GET = withRole(["admin"], async () => {
  const raw = await getPlatformSetting("platform_gst")
  const settings = parsePlatformGSTSettings(raw)
  return jsonOk({ settings })
})

function bodyToSettings(body: unknown): PlatformGSTSettings | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>
  return parsePlatformGSTSettings({
    gstEnabled: b.gstEnabled,
    gstPercentage: b.gstPercentage,
    gstNumber: b.gstNumber,
    panNumber: b.panNumber,
    businessName: b.businessName,
    businessAddress: b.businessAddress,
    city: b.city,
    state: b.state,
    pincode: b.pincode,
    minRechargeRupees: b.minRechargeRupees,
  })
}

export const PUT = withRole(["admin"], async (_user, request) => {
  const body = await request.json()
  const settings = bodyToSettings(body.settings ?? body)
  if (!settings) {
    return jsonError("Invalid settings body", 400)
  }
  if (settings.gstPercentage < 0 || settings.gstPercentage > 100) {
    return jsonError("GST percentage must be between 0 and 100", 400)
  }
  if (settings.minRechargeRupees < 1) {
    return jsonError("Minimum recharge must be at least ₹1", 400)
  }

  await setPlatformSetting("platform_gst", settings)
  return jsonOk({ settings })
})
