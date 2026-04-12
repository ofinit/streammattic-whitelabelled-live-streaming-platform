import type { AiImageBackendId } from "@/lib/ai-image-backend"
import { DEFAULT_FAL_IMAGE_MODEL } from "@/lib/fal-image-input"

export type ImageModelOption = {
  id: string
  label: string
  /** Typical API cost per image in paise (₹1 = 100 paise); estimates for margin planning only. */
  referenceCostPaise: number
}

/** Curated Fal endpoints — ids must match `buildFalSubscribeInput` families in fal-image-input.ts */
export const FAL_IMAGE_MODEL_OPTIONS: ImageModelOption[] = [
  {
    id: "fal-ai/flux-1/schnell",
    label: "FLUX.1 Schnell (fast)",
    referenceCostPaise: 180,
  },
  {
    id: "fal-ai/flux/schnell",
    label: "FLUX Schnell (legacy id)",
    referenceCostPaise: 180,
  },
  {
    id: "fal-ai/flux/dev",
    label: "FLUX.1 Dev (quality)",
    referenceCostPaise: 450,
  },
]

/** OpenRouter image models — ids from openrouter.ai/models (image output) */
export const OPENROUTER_IMAGE_MODEL_OPTIONS: ImageModelOption[] = [
  {
    id: "google/gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image (Nano Banana)",
    referenceCostPaise: 280,
  },
  {
    id: "google/gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image (Nano Banana 2)",
    referenceCostPaise: 380,
  },
  {
    id: "google/gemini-3-pro-image-preview",
    label: "Gemini 3 Pro Image (Nano Banana Pro)",
    referenceCostPaise: 900,
  },
  {
    id: "black-forest-labs/flux-2-pro",
    label: "FLUX.2 Pro",
    referenceCostPaise: 500,
  },
]

export function getDefaultFalModelOptionId(): string {
  const match = FAL_IMAGE_MODEL_OPTIONS.find((o) => o.id === DEFAULT_FAL_IMAGE_MODEL)
  return match?.id ?? FAL_IMAGE_MODEL_OPTIONS[0]?.id ?? DEFAULT_FAL_IMAGE_MODEL
}

export function getDefaultOpenRouterModelOptionId(): string {
  return OPENROUTER_IMAGE_MODEL_OPTIONS[0]?.id ?? "google/gemini-2.5-flash-image"
}

export function getCatalogReferenceCostPaise(backend: AiImageBackendId, modelId: string): number | null {
  const list = backend === "fal" ? FAL_IMAGE_MODEL_OPTIONS : OPENROUTER_IMAGE_MODEL_OPTIONS
  const found = list.find((o) => o.id === modelId)
  return found ? found.referenceCostPaise : null
}

export function getCatalogLabel(backend: AiImageBackendId, modelId: string): string | null {
  const list = backend === "fal" ? FAL_IMAGE_MODEL_OPTIONS : OPENROUTER_IMAGE_MODEL_OPTIONS
  return list.find((o) => o.id === modelId)?.label ?? null
}
