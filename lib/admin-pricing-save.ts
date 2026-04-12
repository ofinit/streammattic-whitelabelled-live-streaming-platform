import type { SimulcastPricing, StreamTypePricing, ValidityTier, VolumeDiscountTier } from "@/lib/types"
import { parseEnabledFlag } from "@/lib/stream-type-pricing"

const STREAM_KEYS = ["rtmp", "youtube_api", "youtube_embed", "third_party"] as const

export function buildFlatCreditPricingRupee(streamTypePricing: StreamTypePricing): Record<string, number> {
  return {
    rtmp: Math.max(1, Math.round(streamTypePricing.rtmp.basePrice / 100)),
    youtube_api: Math.max(1, Math.round(streamTypePricing.youtube_api.basePrice / 100)),
    youtube_embed: Math.max(1, Math.round(streamTypePricing.youtube_embed.basePrice / 100)),
    third_party: Math.max(1, Math.round(streamTypePricing.third_party.basePrice / 100)),
  }
}

export function buildValidityExtensionsPayload(defaultDays: number, tiers: ValidityTier[]) {
  return {
    defaultDays,
    options: tiers.map((t) => ({
      days: t.days,
      extraDays: Math.max(0, t.days - defaultDays),
      creditCost: t.creditCost,
      label: t.label ?? `${t.days} days`,
      enabled: t.enabled,
    })),
  }
}

function assertFiniteNonNeg(n: unknown, label: string): number {
  const x = Number(n)
  if (!Number.isFinite(x) || x < 0) {
    throw new Error(`${label} must be a non-negative number`)
  }
  return x
}

function assertPositiveInt(n: unknown, label: string, max = 1_000_000): number {
  const x = Number(n)
  if (!Number.isFinite(x) || x < 1 || x > max || Math.floor(x) !== x) {
    throw new Error(`${label} must be a positive integer`)
  }
  return Math.floor(x)
}

function assertVolumeTiers(raw: unknown, streamKey: string): VolumeDiscountTier[] {
  if (!Array.isArray(raw)) {
    throw new Error(`volumeDiscountTiers for ${streamKey} must be an array`)
  }
  return raw.map((row, idx) => {
    if (!row || typeof row !== "object") {
      throw new Error(`Invalid volume tier ${idx} for ${streamKey}`)
    }
    const t = row as Record<string, unknown>
    const minQty = assertPositiveInt(Math.round(Number(t.minQty)), `tier[${idx}].minQty`, 100_000)
    const pricePerEvent = assertPositiveInt(
      Math.round(Number(t.pricePerEvent)),
      `tier[${idx}].pricePerEvent`,
      1_000_000_000,
    )
    const label = t.label === undefined || t.label === null ? undefined : String(t.label)
    return { minQty, pricePerEvent, ...(label !== undefined ? { label } : {}) }
  })
}

function assertStreamTypePricing(raw: unknown): StreamTypePricing {
  if (!raw || typeof raw !== "object") {
    throw new Error("streamTypePricing is required")
  }
  const o = raw as Record<string, unknown>
  const out = {} as StreamTypePricing
  for (const key of STREAM_KEYS) {
    const block = o[key]
    if (!block || typeof block !== "object") {
      throw new Error(`Missing or invalid stream type: ${key}`)
    }
    const b = block as Record<string, unknown>
    const basePriceRaw = assertFiniteNonNeg(b.basePrice, `${key}.basePrice`)
    const basePrice = Math.round(basePriceRaw)
    if (basePrice < 1 || basePrice > 1e12) {
      throw new Error(`${key}.basePrice must be at least 1 paisa`)
    }
    const enabled = parseEnabledFlag(b.enabled, true)
    const volumeDiscountTiers = assertVolumeTiers(b.volumeDiscountTiers, key)
    out[key] = { basePrice, enabled, volumeDiscountTiers }
  }
  return out
}

function assertSimulcastPricing(raw: unknown): SimulcastPricing {
  if (!raw || typeof raw !== "object") {
    throw new Error("simulcastPricing is required")
  }
  const o = raw as Record<string, unknown>
  const pick = (k: keyof SimulcastPricing, name: string) => {
    const block = o[k]
    if (!block || typeof block !== "object") {
      throw new Error(`simulcastPricing.${name} is required`)
    }
    const b = block as Record<string, unknown>
    const price = assertFiniteNonNeg(b.price, `${name}.price`)
    if (price > 1e12) {
      throw new Error(`${name}.price is too large`)
    }
    const enabled = parseEnabledFlag(b.enabled, true)
    return { price, enabled }
  }
  return {
    youtube: pick("youtube", "youtube"),
    facebook: pick("facebook", "facebook"),
    customRtmp: pick("customRtmp", "customRtmp"),
  }
}

function assertValidityTiers(raw: unknown): ValidityTier[] {
  if (!Array.isArray(raw)) {
    throw new Error("validityTiers must be an array")
  }
  return raw.map((row, idx) => {
    if (!row || typeof row !== "object") {
      throw new Error(`Invalid validity tier at index ${idx}`)
    }
    const t = row as Record<string, unknown>
    const days = assertPositiveInt(t.days, `validityTiers[${idx}].days`, 3650)
    const creditCost = assertFiniteNonNeg(t.creditCost, `validityTiers[${idx}].creditCost`)
    if (creditCost > 1_000_000) {
      throw new Error(`validityTiers[${idx}].creditCost is too large`)
    }
    const enabled = parseEnabledFlag(t.enabled, true)
    const label = t.label === undefined || t.label === null ? undefined : String(t.label)
    return { days, creditCost: Math.round(creditCost), enabled, ...(label !== undefined ? { label } : {}) }
  })
}

function assertStudioSubscription(raw: unknown): { price: number; enabled: boolean } {
  if (!raw || typeof raw !== "object") {
    throw new Error("studioSubscription is required")
  }
  const s = raw as Record<string, unknown>
  const price = assertFiniteNonNeg(s.price, "studioSubscription.price")
  if (price > 1e14) {
    throw new Error("studioSubscription.price is too large")
  }
  const enabled = parseEnabledFlag(s.enabled, true)
  return { price: Math.round(price), enabled }
}

function assertAiImagePricing(raw: unknown): {
  price: number
  enabled: boolean
  imageBackend?: "fal" | "openrouter" | null
  falModelId?: string | null
  openRouterModelId?: string | null
  providerReferenceCostFalPaise?: number | null
  providerReferenceCostOpenRouterPaise?: number | null
} {
  if (!raw || typeof raw !== "object") {
    throw new Error("aiImagePricing is required")
  }
  const s = raw as Record<string, unknown>
  const price = assertFiniteNonNeg(s.price, "aiImagePricing.price")
  if (price > 1e12) {
    throw new Error("aiImagePricing.price is too large")
  }
  const enabled = parseEnabledFlag(s.enabled, true)
  let imageBackend: "fal" | "openrouter" | null = null
  if (s.imageBackend === "fal" || s.imageBackend === "openrouter") {
    imageBackend = s.imageBackend
  } else if (s.imageBackend !== undefined && s.imageBackend !== null) {
    throw new Error("aiImagePricing.imageBackend must be fal, openrouter, or null")
  }
  let falModelId: string | null = null
  if (typeof s.falModelId === "string") {
    falModelId = s.falModelId.trim().slice(0, 200) || null
  } else if (s.falModelId !== undefined && s.falModelId !== null) {
    throw new Error("aiImagePricing.falModelId must be a string or null")
  }
  let openRouterModelId: string | null = null
  if (typeof s.openRouterModelId === "string") {
    openRouterModelId = s.openRouterModelId.trim().slice(0, 200) || null
  } else if (s.openRouterModelId !== undefined && s.openRouterModelId !== null) {
    throw new Error("aiImagePricing.openRouterModelId must be a string or null")
  }
  const parseOptRef = (key: string): number | null => {
    const v = s[key]
    if (v === undefined || v === null) return null
    const r = assertFiniteNonNeg(v, `aiImagePricing.${key}`)
    if (r > 1e12) throw new Error(`aiImagePricing.${key} is too large`)
    return Math.round(r)
  }
  const providerReferenceCostFalPaise = parseOptRef("providerReferenceCostFalPaise")
  const providerReferenceCostOpenRouterPaise = parseOptRef("providerReferenceCostOpenRouterPaise")
  return {
    price: Math.round(price),
    enabled,
    imageBackend,
    falModelId,
    openRouterModelId,
    providerReferenceCostFalPaise,
    providerReferenceCostOpenRouterPaise,
  }
}

/**
 * Validate the admin pricing bundle from `PUT /api/admin/pricing`.
 */
export function parseAdminPricingRequest(body: unknown): {
  streamTypePricing: StreamTypePricing
  simulcastPricing: SimulcastPricing
  validityDefaultDays: number
  validityTiers: ValidityTier[]
  studioSubscription: { price: number; enabled: boolean }
  aiImagePricing: {
    price: number
    enabled: boolean
    imageBackend?: "fal" | "openrouter" | null
    falModelId?: string | null
    openRouterModelId?: string | null
    providerReferenceCostFalPaise?: number | null
    providerReferenceCostOpenRouterPaise?: number | null
  }
} {
  if (!body || typeof body !== "object") {
    throw new Error("Request body must be a JSON object")
  }
  const o = body as Record<string, unknown>

  const streamTypePricing = assertStreamTypePricing(o.streamTypePricing)
  const simulcastPricing = assertSimulcastPricing(o.simulcastPricing)
  const validityDefaultDays = assertPositiveInt(o.validityDefaultDays, "validityDefaultDays", 3650)
  const validityTiers = assertValidityTiers(o.validityTiers)
  const studioSubscription = assertStudioSubscription(o.studioSubscription)
  const aiImagePricing = o.aiImagePricing ? assertAiImagePricing(o.aiImagePricing) : { price: 500, enabled: true }

  return {
    streamTypePricing,
    simulcastPricing,
    validityDefaultDays,
    validityTiers,
    studioSubscription,
    aiImagePricing,
  }
}
