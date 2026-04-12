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

export function isOpenRouterBackendConfigured(): boolean {
  return !!(process.env.OPENROUTER_API_KEY?.trim() && process.env.OPENROUTER_IMAGE_MODEL?.trim())
}

export function getOpenRouterImageModelFromEnv(): string {
  return process.env.OPENROUTER_IMAGE_MODEL?.trim() ?? ""
}

/** True when the currently selected backend has the required credentials. */
export function isActiveAiBackendConfigured(): boolean {
  const id = getAiImageBackendFromEnv()
  if (id === "openrouter") return isOpenRouterBackendConfigured()
  return isFalBackendConfigured()
}
