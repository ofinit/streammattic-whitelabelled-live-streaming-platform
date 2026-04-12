import type { AiImageBackendId } from "@/lib/ai-image-backend"

/** Default price in paise (500 = ₹5) */
export const DEFAULT_AI_IMAGE_GENERATION_PRICE_PAISE = 500

export type AiImagePricingConfig = {
  price: number
  enabled: boolean
  /** When set, overrides AI_IMAGE_BACKEND env for which provider generates images. */
  imageBackend?: AiImageBackendId | null
  /** Overrides FAL_IMAGE_MODEL env when non-empty. */
  falModelId?: string | null
  /** Overrides OPENROUTER_IMAGE_MODEL env when non-empty. */
  openRouterModelId?: string | null
  /**
   * Admin estimate of Fal API cost per image (paise), for margin when Fal is the backend.
   * Auto-filled from catalog when picking a Fal model; editable.
   */
  providerReferenceCostFalPaise?: number | null
  /**
   * Admin estimate of OpenRouter API cost per image (paise), for margin when OpenRouter is the backend.
   */
  providerReferenceCostOpenRouterPaise?: number | null
}

export function parseAiImagePricing(raw: unknown): AiImagePricingConfig {
  if (!raw || typeof raw !== "object") {
    return {
      price: DEFAULT_AI_IMAGE_GENERATION_PRICE_PAISE,
      enabled: true,
      imageBackend: null,
      falModelId: null,
      openRouterModelId: null,
      providerReferenceCostFalPaise: null,
      providerReferenceCostOpenRouterPaise: null,
    }
  }
  const o = raw as Record<string, unknown>
  const imageBackend =
    o.imageBackend === "fal" || o.imageBackend === "openrouter" ? (o.imageBackend as AiImageBackendId) : null
  const parseRef = (k: string): number | null => {
    const v = o[k]
    return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.round(v) : null
  }
  /** Legacy single field → Fal */
  const legacyRef = parseRef("providerReferenceCostPaise")
  return {
    price: typeof o.price === "number" ? o.price : DEFAULT_AI_IMAGE_GENERATION_PRICE_PAISE,
    enabled: o.enabled !== false,
    imageBackend,
    falModelId: typeof o.falModelId === "string" ? o.falModelId : null,
    openRouterModelId: typeof o.openRouterModelId === "string" ? o.openRouterModelId : null,
    providerReferenceCostFalPaise: parseRef("providerReferenceCostFalPaise") ?? legacyRef,
    providerReferenceCostOpenRouterPaise: parseRef("providerReferenceCostOpenRouterPaise"),
  }
}

/** Max prompt length for Fal / abuse prevention */
export const AI_IMAGE_PROMPT_MAX_LENGTH = 2000
