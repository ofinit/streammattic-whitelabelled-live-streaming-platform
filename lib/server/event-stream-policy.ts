import { getDb } from "@/lib/db"
import { parseSimulcastPricing, parseStreamTypePricing } from "@/lib/stream-type-pricing"
import { PENDING_STREAM_DB, STREAM_TYPE_MAP } from "@/lib/server/credits-logic"
import type { SimulcastConfig, SimulcastPricing, StreamTypePricing } from "@/lib/types"

type Sql = ReturnType<typeof getDb>

export type StreamPolicyError = { error: string; status: 400 }

/** Map request `streamType` (form or API) to DB enum string, or null if unset. */
export function bodyStreamTypeToDb(streamType: unknown): string | null {
  if (streamType == null || streamType === "") return null
  const s = String(streamType)
  return STREAM_TYPE_MAP[s] ?? s
}

export async function loadStreamAndSimulcastPricing(sql: Sql): Promise<{
  streamTypePricing: StreamTypePricing
  simulcastPricing: SimulcastPricing
}> {
  const streamRows = await sql`SELECT value FROM platform_settings WHERE key = 'stream_type_pricing'`
  const volumeRows = await sql`SELECT value FROM platform_settings WHERE key = 'volume_discount_tiers'`
  const simulcastRows = await sql`SELECT value FROM platform_settings WHERE key = 'simulcast_pricing'`
  const streamRaw = streamRows.length > 0 ? (streamRows[0] as Record<string, unknown>).value : null
  const volumeRaw = volumeRows.length > 0 ? (volumeRows[0] as Record<string, unknown>).value : null
  const simulcastRaw = simulcastRows.length > 0 ? (simulcastRows[0] as Record<string, unknown>).value : null
  return {
    streamTypePricing: parseStreamTypePricing(streamRaw, volumeRaw),
    simulcastPricing: parseSimulcastPricing(simulcastRaw),
  }
}

/** `dbStreamType` is already canonical (rtmp, youtube_api, ...). */
export function assertStreamTypeEnabled(
  streamTypePricing: StreamTypePricing,
  dbStreamType: string | null,
): StreamPolicyError | null {
  if (!dbStreamType || dbStreamType === PENDING_STREAM_DB) return null
  const key = dbStreamType as keyof StreamTypePricing
  const cfg = streamTypePricing[key]
  if (!cfg || !cfg.enabled) {
    return {
      error: `This stream type is not available (${dbStreamType}). It has been disabled by an administrator.`,
      status: 400,
    }
  }
  return null
}

function simulcastConfigUsesYouTube(c: SimulcastConfig | undefined | null): boolean {
  if (!c?.enabled) return false
  return !!(c.youtubeChannelId && String(c.youtubeChannelId).trim() !== "")
}

function simulcastConfigUsesFacebook(c: SimulcastConfig | undefined | null): boolean {
  if (!c?.enabled) return false
  return !!(c.facebookPageId && String(c.facebookPageId).trim() !== "")
}

function simulcastConfigUsesCustomRtmp(c: SimulcastConfig | undefined | null): boolean {
  if (!c?.enabled) return false
  return Array.isArray(c.customDestinations) && c.customDestinations.length > 0
}

export function assertSimulcastAllowed(
  simulcastPricing: SimulcastPricing,
  simulcastConfig: SimulcastConfig | undefined | null,
  dbStreamType: string | null,
): StreamPolicyError | null {
  if (dbStreamType !== "rtmp") return null
  if (!simulcastConfig?.enabled) return null

  const anyPricingEnabled =
    simulcastPricing.youtube.enabled ||
    simulcastPricing.facebook.enabled ||
    simulcastPricing.customRtmp.enabled

  if (!anyPricingEnabled) {
    return {
      error: "Simulcast is disabled by an administrator.",
      status: 400,
    }
  }

  if (simulcastConfigUsesYouTube(simulcastConfig) && !simulcastPricing.youtube.enabled) {
    return { error: "YouTube simulcast is disabled by an administrator.", status: 400 }
  }
  if (simulcastConfigUsesFacebook(simulcastConfig) && !simulcastPricing.facebook.enabled) {
    return { error: "Facebook simulcast is disabled by an administrator.", status: 400 }
  }
  if (simulcastConfigUsesCustomRtmp(simulcastConfig) && !simulcastPricing.customRtmp.enabled) {
    return { error: "Custom RTMP simulcast is disabled by an administrator.", status: 400 }
  }

  return null
}

/**
 * When stream type is omitted on create, default billing/DB used to be RTMP; use {@link PENDING_STREAM_DB} instead for zero-credit draft rows.
 */
export function effectiveDbStreamTypeForCreate(dbStreamType: string | null): string {
  return dbStreamType || "rtmp"
}
