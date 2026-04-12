export type AiImageBackendId = "fal" | "openrouter"

/** `fal` (default) or `openrouter` — set `AI_IMAGE_BACKEND` in server env. */
export function getAiImageBackendFromEnv(): AiImageBackendId {
  const b = process.env.AI_IMAGE_BACKEND?.trim().toLowerCase()
  if (b === "openrouter") return "openrouter"
  return "fal"
}

export function isFalBackendConfigured(): boolean {
  return !!process.env.FAL_KEY?.trim()
}

/** OpenRouter API key present (model may come from Admin DB or OPENROUTER_IMAGE_MODEL env). */
export function hasOpenRouterApiKey(): boolean {
  return !!process.env.OPENROUTER_API_KEY?.trim()
}

/** @deprecated Prefer isOpenRouterGenerationPossible(config) in ai-image-resolve — model can live in DB. */
export function isOpenRouterBackendConfigured(): boolean {
  return hasOpenRouterApiKey()
}

export function getOpenRouterImageModelFromEnv(): string {
  return process.env.OPENROUTER_IMAGE_MODEL?.trim() ?? ""
}
