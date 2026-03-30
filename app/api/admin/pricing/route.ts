import type { PoolClient } from "pg"
import { withTransaction } from "@/lib/db"
import {
  buildFlatCreditPricingRupee,
  buildValidityExtensionsPayload,
  parseAdminPricingRequest,
} from "@/lib/admin-pricing-save"
import { invalidateCache } from "@/lib/redis"
import { jsonError, jsonOk, withRole } from "@/lib/api-helpers"
import { serializeSimulcastPricing } from "@/lib/stream-type-pricing"
import type { StreamTypePricing } from "@/lib/types"

const CACHE_KEYS = [
  "stream_type_pricing",
  "simulcast_pricing",
  "validity_extensions",
  "studio_annual_subscription",
  "credit_pricing",
] as const

async function upsertPlatformSetting(client: PoolClient, key: string, value: unknown) {
  await client.query(
    `INSERT INTO platform_settings (key, value, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, JSON.stringify(value)],
  )
}

export const PUT = withRole(["admin"], async (_user, request: Request) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  let parsed: ReturnType<typeof parseAdminPricingRequest>
  try {
    parsed = parseAdminPricingRequest(body)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Invalid pricing payload", 400)
  }

  const streamPayload = JSON.parse(JSON.stringify(parsed.streamTypePricing)) as StreamTypePricing
  const simulcastValue = serializeSimulcastPricing(parsed.simulcastPricing)
  const validityValue = buildValidityExtensionsPayload(parsed.validityDefaultDays, parsed.validityTiers)
  const flatCredit = buildFlatCreditPricingRupee(parsed.streamTypePricing)

  try {
    await withTransaction(async (client) => {
      await upsertPlatformSetting(client, "stream_type_pricing", streamPayload)
      await upsertPlatformSetting(client, "simulcast_pricing", simulcastValue)
      await upsertPlatformSetting(client, "validity_extensions", validityValue)
      await upsertPlatformSetting(client, "studio_annual_subscription", parsed.studioSubscription)
      await upsertPlatformSetting(client, "credit_pricing", flatCredit)
    })
  } catch (e) {
    console.error("[admin/pricing] Transaction failed:", e)
    return jsonError("Failed to save pricing settings", 500)
  }

  await Promise.all(CACHE_KEYS.map((k) => invalidateCache(`platform_setting:${k}`)))

  return jsonOk({ ok: true })
})
