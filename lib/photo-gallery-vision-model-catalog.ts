/**
 * Curated OpenRouter models for planned gallery “vision index” jobs (captioning, tags, structured JSON per image).
 * IDs follow [openrouter.ai/models](https://openrouter.ai/models). List pricing comes from OpenRouter’s API in admin.
 */
export type GalleryVisionModelOption = {
  id: string
  label: string
}

export const OPENROUTER_GALLERY_VISION_MODEL_OPTIONS: GalleryVisionModelOption[] = [
  {
    id: "google/gemini-2.0-flash-001",
    label: "Gemini 2.0 Flash (vision)",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o mini (vision)",
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o (vision)",
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    label: "Gemini 2.5 Flash preview (vision)",
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet (vision)",
  },
]

export function getDefaultGalleryVisionModelId(): string {
  return OPENROUTER_GALLERY_VISION_MODEL_OPTIONS[0]?.id ?? "google/gemini-2.0-flash-001"
}
