import type { SimulcastPricing, StreamTypeKey, StreamTypePricing, VolumeDiscountTier } from "@/lib/types"

const STREAM_KEYS: StreamTypeKey[] = ["rtmp", "youtube_api", "youtube_embed", "third_party"]

/** Keep in sync with `masterStreamTypePricing` in mock-data (fallback when DB/settings missing). */
const INTERNAL_DEFAULT_STREAM_TYPE_PRICING: StreamTypePricing = {
  rtmp: {
    basePrice: 1500,
    enabled: true,
    volumeDiscountTiers: [
      { minQty: 5, pricePerEvent: 1300, label: "5 Pack" },
      { minQty: 10, pricePerEvent: 1100, label: "10 Pack" },
      { minQty: 25, pricePerEvent: 900, label: "25 Pack" },
      { minQty: 50, pricePerEvent: 750, label: "50 Pack" },
    ],
  },
  youtube_api: {
    basePrice: 1000,
    enabled: true,
    volumeDiscountTiers: [
      { minQty: 5, pricePerEvent: 850, label: "5 Pack" },
      { minQty: 10, pricePerEvent: 700, label: "10 Pack" },
      { minQty: 25, pricePerEvent: 550, label: "25 Pack" },
      { minQty: 50, pricePerEvent: 450, label: "50 Pack" },
    ],
  },
  youtube_embed: {
    basePrice: 500,
    enabled: true,
    volumeDiscountTiers: [
      { minQty: 5, pricePerEvent: 425, label: "5 Pack" },
      { minQty: 10, pricePerEvent: 350, label: "10 Pack" },
      { minQty: 25, pricePerEvent: 275, label: "25 Pack" },
      { minQty: 50, pricePerEvent: 200, label: "50 Pack" },
    ],
  },
  third_party: {
    basePrice: 400,
    enabled: true,
    volumeDiscountTiers: [
      { minQty: 5, pricePerEvent: 340, label: "5 Pack" },
      { minQty: 10, pricePerEvent: 280, label: "10 Pack" },
      { minQty: 25, pricePerEvent: 220, label: "25 Pack" },
      { minQty: 50, pricePerEvent: 160, label: "50 Pack" },
    ],
  },
}

export function getBestPriceForQuantity(
  streamType: StreamTypeKey,
  quantity: number,
  pricing: StreamTypePricing = INTERNAL_DEFAULT_STREAM_TYPE_PRICING,
): { pricePerEvent: number; tierLabel?: string; totalPrice: number; savings: number } {
  const config = pricing[streamType]
  let pricePerEvent = config.basePrice
  let tierLabel: string | undefined

  for (const tier of config.volumeDiscountTiers) {
    if (quantity >= tier.minQty) {
      pricePerEvent = tier.pricePerEvent
      tierLabel = tier.label
    }
  }

  const totalPrice = pricePerEvent * quantity
  const savings = config.basePrice * quantity - totalPrice

  return { pricePerEvent, tierLabel, totalPrice, savings }
}

type LegacyVolumeRow = {
  minQty?: number
  maxQty?: number | null
  pricePerCredit?: number
  pricePerEvent?: number
  label?: string
  enabled?: boolean
}

function clonePricing(source: StreamTypePricing): StreamTypePricing {
  return JSON.parse(JSON.stringify(source)) as StreamTypePricing
}

/**
 * Coerce platform JSON `enabled` fields to boolean. Some stacks surface `"false"` as a string;
 * `!== false` alone would incorrectly keep those stream types enabled.
 */
export function parseEnabledFlag(value: unknown, defaultValue = true): boolean {
  if (value === false || value === "false" || value === 0) return false
  if (value === true || value === "true" || value === 1) return true
  return defaultValue
}

export function getDefaultStreamTypePricing(): StreamTypePricing {
  return clonePricing(INTERNAL_DEFAULT_STREAM_TYPE_PRICING)
}

function normalizeTier(row: LegacyVolumeRow): VolumeDiscountTier | null {
  const minQty = typeof row.minQty === "number" ? row.minQty : 0
  const pricePerEvent =
    typeof row.pricePerEvent === "number"
      ? row.pricePerEvent
      : typeof row.pricePerCredit === "number"
        ? row.pricePerCredit
        : 0
  if (minQty < 1 || pricePerEvent < 1) return null
  return {
    minQty,
    pricePerEvent,
    label: typeof row.label === "string" ? row.label : undefined,
  }
}

/**
 * Canonical stream catalog: full `StreamTypePricing` stored under `platform_settings.stream_type_pricing`.
 * Merges legacy split rows (`stream_type_pricing` without tiers + `volume_discount_tiers`).
 */
export function parseStreamTypePricing(streamRaw: unknown, volumeDiscountRaw?: unknown): StreamTypePricing {
  const fallback = () => clonePricing(INTERNAL_DEFAULT_STREAM_TYPE_PRICING)
  if (!streamRaw || typeof streamRaw !== "object") {
    if (volumeDiscountRaw && typeof volumeDiscountRaw === "object") {
      return parseStreamTypePricing({ rtmp: {}, youtube_api: {}, youtube_embed: {}, third_party: {} }, volumeDiscountRaw)
    }
    return fallback()
  }

  const s = streamRaw as Record<string, unknown>
  const vol =
    volumeDiscountRaw && typeof volumeDiscountRaw === "object"
      ? (volumeDiscountRaw as Record<string, unknown>)
      : null

  const out = {} as StreamTypePricing

  for (const key of STREAM_KEYS) {
    const block = s[key]
    const baseFallback = INTERNAL_DEFAULT_STREAM_TYPE_PRICING[key]
    if (!block || typeof block !== "object") {
      out[key] = clonePricing(INTERNAL_DEFAULT_STREAM_TYPE_PRICING)[key]
      continue
    }
    const b = block as Record<string, unknown>
    const basePrice = typeof b.basePrice === "number" ? b.basePrice : baseFallback.basePrice
    const enabled = parseEnabledFlag(b.enabled, true)

    let tiers: VolumeDiscountTier[] = []
    if (Array.isArray(b.volumeDiscountTiers)) {
      for (const x of b.volumeDiscountTiers) {
        if (!x || typeof x !== "object") continue
        const t = normalizeTier(x as LegacyVolumeRow)
        if (t) tiers.push(t)
      }
    } else if (vol && Array.isArray(vol[key])) {
      for (const x of vol[key] as LegacyVolumeRow[]) {
        if (x && x.enabled === false) continue
        const t = normalizeTier(x)
        if (t) tiers.push(t)
      }
    }

    tiers.sort((a, b) => a.minQty - b.minQty)
    // REMOVED: Auto-fallback for empty tiers. If the admin explicitly deletes all tiers,
    // they should STAY deleted. Fallback ONLY if the entire stream type block is missing or invalid.
    
    out[key] = { basePrice, enabled, volumeDiscountTiers: tiers }
  }

  return out
}

/** Map DB / seed simulcast JSON to UI `SimulcastPricing` shape. */
export function parseSimulcastPricing(raw: unknown): SimulcastPricing {
  const fb = (): SimulcastPricing => ({
    youtube: { price: 75, enabled: true },
    facebook: { price: 75, enabled: true },
    customRtmp: { price: 100, enabled: true },
  })
  if (!raw || typeof raw !== "object") return fb()
  const o = raw as Record<string, unknown>

  const pick = (block: unknown, fallbackPrice: number, fallbackEnabled: boolean) => {
    if (!block || typeof block !== "object") {
      return { price: fallbackPrice, enabled: fallbackEnabled }
    }
    const b = block as Record<string, unknown>
    const price =
      typeof b.price === "number"
        ? b.price
        : typeof b.pricePerEvent === "number"
          ? b.pricePerEvent
          : fallbackPrice
    return { price, enabled: parseEnabledFlag(b.enabled, fallbackEnabled) }
  }

  const youtube = pick(o.youtube, 75, true)
  const facebook = pick(o.facebook, 75, true)
  const customBlock = o.customRtmp ?? o.custom_rtmp
  const customRtmp = pick(customBlock, 100, true)

  return { youtube, facebook, customRtmp }
}

/** Persist simulcast settings; supports both camelCase and legacy snake keys. */
export function serializeSimulcastPricing(p: SimulcastPricing): Record<string, unknown> {
  return {
    youtube: { price: p.youtube.price, enabled: p.youtube.enabled, pricePerEvent: p.youtube.price },
    facebook: { price: p.facebook.price, enabled: p.facebook.enabled, pricePerEvent: p.facebook.price },
    custom_rtmp: {
      price: p.customRtmp.price,
      enabled: p.customRtmp.enabled,
      pricePerEvent: p.customRtmp.price,
    },
  }
}

export function isStreamTypeKey(v: string): v is StreamTypeKey {
  return (STREAM_KEYS as string[]).includes(v)
}
