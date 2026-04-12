import type { AiImagePricingConfig } from "@/lib/ai-image-generation"
import type { AiImageBackendId } from "@/lib/ai-image-backend"
import { getAiImageBackendFromEnv, getOpenRouterImageModelFromEnv } from "@/lib/ai-image-backend"
import { getCatalogReferenceCostPaise } from "@/lib/ai-image-model-catalog"
import { getFalImageModelId } from "@/lib/fal-image-input"

/**
 * Effective backend: admin `imageBackend` in platform_settings overrides `AI_IMAGE_BACKEND` env.
 */
export function resolveImageBackendFromConfig(config: AiImagePricingConfig): AiImageBackendId {
  if (config.imageBackend === "fal" || config.imageBackend === "openrouter") {
    return config.imageBackend
  }
  return getAiImageBackendFromEnv()
}

export function resolveFalModelIdForGeneration(config: AiImagePricingConfig): string {
  const id = config.falModelId?.trim()
  if (id) return id
  return getFalImageModelId()
}

export function resolveOpenRouterModelIdForGeneration(config: AiImagePricingConfig): string {
  const id = config.openRouterModelId?.trim()
  if (id) return id
  return getOpenRouterImageModelFromEnv()
}

/** True when OpenRouter can run: API key present and model id from DB or env. */
export function isOpenRouterGenerationPossible(config: AiImagePricingConfig): boolean {
  if (!process.env.OPENROUTER_API_KEY?.trim()) return false
  return resolveOpenRouterModelIdForGeneration(config).trim().length > 0
}

/** Reference cost for margin: admin override, else catalog lookup for resolved backend + model. */
export function getEffectiveProviderReferenceCostPaise(config: AiImagePricingConfig): number | null {
  const backend = resolveImageBackendFromConfig(config)
  if (backend === "fal") {
    if (typeof config.providerReferenceCostFalPaise === "number" && config.providerReferenceCostFalPaise >= 0) {
      return config.providerReferenceCostFalPaise
    }
    return getCatalogReferenceCostPaise("fal", resolveFalModelIdForGeneration(config))
  }
  if (typeof config.providerReferenceCostOpenRouterPaise === "number" && config.providerReferenceCostOpenRouterPaise >= 0) {
    return config.providerReferenceCostOpenRouterPaise
  }
  return getCatalogReferenceCostPaise("openrouter", resolveOpenRouterModelIdForGeneration(config))
}
