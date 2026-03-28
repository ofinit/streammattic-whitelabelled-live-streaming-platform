import { getDb } from "@/lib/db"
import { jsonOk, withAuth } from "@/lib/api-helpers"
import { parseStreamTypePricing } from "@/lib/stream-type-pricing"
import { parseValidityExtensionsSetting } from "@/lib/validity-extensions"

export const GET = withAuth(async () => {
  const sql = getDb()
  const streamRows = await sql`SELECT value FROM platform_settings WHERE key = 'stream_type_pricing'`
  const volumeRows = await sql`SELECT value FROM platform_settings WHERE key = 'volume_discount_tiers'`
  const validityRows = await sql`SELECT value FROM platform_settings WHERE key = 'validity_extensions'`

  const streamRaw = streamRows.length > 0 ? (streamRows[0] as Record<string, unknown>).value : null
  const volumeRaw = volumeRows.length > 0 ? (volumeRows[0] as Record<string, unknown>).value : null
  const streamTypePricing = parseStreamTypePricing(streamRaw, volumeRaw)

  const discountRows = await sql`SELECT value FROM platform_settings WHERE key = 'discount_tiers'`

  /** Flat map in rupees (legacy); derived from base price for consumers that still expect it. */
  const legacyFlat: Record<string, number> = {
    rtmp: Math.round(streamTypePricing.rtmp.basePrice / 100),
    youtube_api: Math.round(streamTypePricing.youtube_api.basePrice / 100),
    youtube_embed: Math.round(streamTypePricing.youtube_embed.basePrice / 100),
    third_party: Math.round(streamTypePricing.third_party.basePrice / 100),
  }

  const validityExtensions =
    validityRows.length > 0
      ? parseValidityExtensionsSetting((validityRows[0] as Record<string, unknown>).value)
      : parseValidityExtensionsSetting(null)

  return jsonOk({
    streamTypePricing,
    pricing: legacyFlat,
    discountTiers: discountRows.length > 0 ? (discountRows[0] as Record<string, unknown>).value : [],
    validityExtensions,
  })
})
