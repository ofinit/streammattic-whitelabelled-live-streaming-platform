/**
 * Fetch OpenRouter list price for a model (GET /api/v1/models) and convert to INR for admin display.
 * OpenRouter quotes USD/token; we apply USD_INR_REFERENCE (default 83) for all customer-facing amounts.
 * @see https://openrouter.ai/docs/api-reference/models/get-models
 */

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"
const LIST_CACHE_TTL_MS = 10 * 60 * 1000

/** Illustrative tokens for one gallery vision job (caption/tags JSON) — margin planning only. */
export const GALLERY_VISION_JOB_PROMPT_TOKENS_ESTIMATE = 3000
export const GALLERY_VISION_JOB_COMPLETION_TOKENS_ESTIMATE = 500

type CachedList = { fetchedAt: number; models: OpenRouterModelRow[] }

let listCache: CachedList | null = null

type OpenRouterModelRow = {
  id: string
  name?: string
  pricing?: {
    prompt?: string | number
    completion?: string | number
    image?: string | number
  }
}

function parseUsdPerToken(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw >= 0 ? raw : 0
  if (typeof raw === "string") {
    const n = parseFloat(raw)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }
  return 0
}

function getOpenRouterAuthHeader(): Record<string, string> {
  const key = process.env.OPENROUTER_API_KEY?.trim()
  if (!key) return {}
  return { Authorization: `Bearer ${key}` }
}

async function fetchModelsList(): Promise<OpenRouterModelRow[]> {
  const now = Date.now()
  if (listCache && now - listCache.fetchedAt < LIST_CACHE_TTL_MS) {
    return listCache.models
  }

  const res = await fetch(OPENROUTER_MODELS_URL, {
    headers: {
      ...getOpenRouterAuthHeader(),
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
    throw new Error(err.error?.message || `OpenRouter models HTTP ${res.status}`)
  }

  const body = (await res.json()) as { data?: OpenRouterModelRow[] }
  const models = Array.isArray(body.data) ? body.data : []
  listCache = { fetchedAt: now, models }
  return models
}

export type OpenRouterGalleryJobPricing = {
  modelId: string
  name: string
  /** INR (rupees) per 1M prompt tokens — converted from OpenRouter USD list price. */
  promptInrPer1M: number
  /** INR (rupees) per 1M completion tokens. */
  completionInrPer1M: number
  /** Illustrative job cost in paise (INR × 100) using token assumptions below. */
  estimatedJobPaisa: number
  /** FX used for USD → INR (OpenRouter lists USD). */
  usdInrRate: number
  promptTokensAssumed: number
  completionTokensAssumed: number
}

function defaultUsdInr(): number {
  const raw = process.env.USD_INR_REFERENCE?.trim() || process.env.OPENROUTER_USD_INR?.trim()
  if (raw) {
    const n = parseFloat(raw)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 83
}

/**
 * Returns list pricing from OpenRouter for `modelId`, converted to INR for display.
 */
export async function getOpenRouterGalleryJobPricing(modelId: string): Promise<OpenRouterGalleryJobPricing> {
  const id = modelId.trim()
  if (!id) throw new Error("modelId is required")

  const models = await fetchModelsList()
  const m = models.find((x) => x.id === id)
  if (!m) {
    throw new Error(`Model not found on OpenRouter: ${id}`)
  }

  const promptPerToken = parseUsdPerToken(m.pricing?.prompt)
  const completionPerToken = parseUsdPerToken(m.pricing?.completion)

  const promptUsdPer1M = promptPerToken * 1_000_000
  const completionUsdPer1M = completionPerToken * 1_000_000

  const pt = GALLERY_VISION_JOB_PROMPT_TOKENS_ESTIMATE
  const ct = GALLERY_VISION_JOB_COMPLETION_TOKENS_ESTIMATE
  const estimatedJobUsd = pt * promptPerToken + ct * completionPerToken

  const usdInrRate = defaultUsdInr()
  const promptInrPer1M = promptUsdPer1M * usdInrRate
  const completionInrPer1M = completionUsdPer1M * usdInrRate
  const estimatedInr = estimatedJobUsd * usdInrRate
  const estimatedJobPaisa = Math.max(0, Math.round(estimatedInr * 100))

  return {
    modelId: m.id,
    name: typeof m.name === "string" && m.name.trim() ? m.name.trim() : m.id,
    promptInrPer1M,
    completionInrPer1M,
    estimatedJobPaisa,
    usdInrRate,
    promptTokensAssumed: pt,
    completionTokensAssumed: ct,
  }
}
