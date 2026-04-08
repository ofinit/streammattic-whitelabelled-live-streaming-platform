import { getDb } from "@/lib/db"
import { parseSimulcastPricing, parseStreamTypePricing } from "@/lib/stream-type-pricing"
import { parseValidityExtensionsSetting, type ParsedValidityExtensions } from "@/lib/validity-extensions"
import type { SimulcastPricing, StreamTypePricing } from "@/lib/types"

/**
 * Shared snapshot for `/api/credits/pricing` and streamer/studio dashboards.
 */
export async function getPublicStreamCreditPricing(): Promise<{
  streamTypePricing: StreamTypePricing
  simulcastPricing: SimulcastPricing
  validityExtensions: ParsedValidityExtensions
}> {
  const sql = getDb()
  const streamRows = await sql`SELECT value FROM platform_settings WHERE key = 'stream_type_pricing'`
  const volumeRows = await sql`SELECT value FROM platform_settings WHERE key = 'volume_discount_tiers'`
  const validityRows = await sql`SELECT value FROM platform_settings WHERE key = 'validity_extensions'`
  const simulcastRows = await sql`SELECT value FROM platform_settings WHERE key = 'simulcast_pricing'`

  const streamRaw = streamRows.length > 0 ? (streamRows[0] as Record<string, unknown>).value : null
  const volumeRaw = volumeRows.length > 0 ? (volumeRows[0] as Record<string, unknown>).value : null
  const streamTypePricing = parseStreamTypePricing(streamRaw, volumeRaw)

  const simulcastRaw = simulcastRows.length > 0 ? (simulcastRows[0] as Record<string, unknown>).value : null
  const simulcastPricing = parseSimulcastPricing(simulcastRaw)

  const validityExtensions =
    validityRows.length > 0
      ? parseValidityExtensionsSetting((validityRows[0] as Record<string, unknown>).value)
      : parseValidityExtensionsSetting(null)

  return { streamTypePricing, simulcastPricing, validityExtensions }
}
