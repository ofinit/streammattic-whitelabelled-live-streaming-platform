/**
 * Curated OpenRouter models for planned gallery “vision index” jobs (captioning, tags, structured JSON per image).
 * IDs follow [openrouter.ai/models](https://openrouter.ai/models) — reference costs are rough per-job estimates in paise for margin planning only (adjust to your token usage).
 */
export type GalleryVisionModelOption = {
  id: string
  label: string
  /** Typical API cost per vision job (one image + prompt + short output), in paise. */
  referenceCostPaise: number
}

export const OPENROUTER_GALLERY_VISION_MODEL_OPTIONS: GalleryVisionModelOption[] = [
  {
    id: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash (vision)",
    referenceCostPaise: 100,
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini (vision)",
    referenceCostPaise: 80,
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o (vision)",
    referenceCostPaise: 350,
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    label: "Gemini 2.5 Flash preview (vision)",
    referenceCostPaise: 120,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet (vision)",
    referenceCostPaise: 400,
  },
]

export function getDefaultGalleryVisionModelId(): string {
  return OPENROUTER_GALLERY_VISION_MODEL_OPTIONS[0]?.id ?? "google/gemini-2.0-flash-001"
}

export function getGalleryVisionCatalogReferenceCostPaise(modelId: string): number | null {
  const found = OPENROUTER_GALLERY_VISION_MODEL_OPTIONS.find((o) => o.id === modelId)
  return found ? found.referenceCostPaise : null
}
