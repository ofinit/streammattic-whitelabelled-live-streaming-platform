/** Default price in paise (500 = ₹5) */
export const DEFAULT_AI_IMAGE_GENERATION_PRICE_PAISE = 500

export type AiImagePricingConfig = {
  price: number
  enabled: boolean
}

export function parseAiImagePricing(raw: unknown): AiImagePricingConfig {
  if (!raw || typeof raw !== "object") {
    return { price: DEFAULT_AI_IMAGE_GENERATION_PRICE_PAISE, enabled: true }
  }
  const o = raw as Record<string, unknown>
  return {
    price: typeof o.price === "number" ? o.price : DEFAULT_AI_IMAGE_GENERATION_PRICE_PAISE,
    enabled: o.enabled !== false,
  }
}

/** Max prompt length for Fal / abuse prevention */
export const AI_IMAGE_PROMPT_MAX_LENGTH = 2000
