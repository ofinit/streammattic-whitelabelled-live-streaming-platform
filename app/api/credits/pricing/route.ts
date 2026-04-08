import { getDb } from "@/lib/db"
import { getPublicStreamCreditPricing } from "@/lib/credit-pricing-snapshot"
import { jsonOk, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async () => {
  const sql = getDb()
  const { streamTypePricing, simulcastPricing, validityExtensions } = await getPublicStreamCreditPricing()

  const discountRows = await sql`SELECT value FROM platform_settings WHERE key = 'discount_tiers'`

  /** Flat map in rupees (legacy); derived from base price for consumers that still expect it. */
  const legacyFlat: Record<string, number> = {
    rtmp: Math.round(streamTypePricing.rtmp.basePrice / 100),
    youtube_api: Math.round(streamTypePricing.youtube_api.basePrice / 100),
    youtube_embed: Math.round(streamTypePricing.youtube_embed.basePrice / 100),
    third_party: Math.round(streamTypePricing.third_party.basePrice / 100),
  }

  return jsonOk({
    streamTypePricing,
    simulcastPricing,
    pricing: legacyFlat,
    discountTiers: discountRows.length > 0 ? (discountRows[0] as Record<string, unknown>).value : [],
    validityExtensions,
  })
})
