export type GalleryTemplateCategory = "wedding" | "events" | "sports" | "custom"

export type ClientGalleryTemplateDef = {
  id: string
  name: string
  category: GalleryTemplateCategory
  description: string
}

export const DEFAULT_GALLERY_TEMPLATE_ID = "classic-grid"

export const CLIENT_GALLERY_TEMPLATES: ClientGalleryTemplateDef[] = [
  {
    id: "classic-grid",
    name: "Classic grid",
    category: "events",
    description: "Even photo grid — works everywhere.",
  },
  {
    id: "hero-ribbon",
    name: "Hero ribbon",
    category: "events",
    description: "Bold header band with photos below.",
  },
  {
    id: "masonry-flow",
    name: "Masonry flow",
    category: "events",
    description: "Pinterest-style staggered columns.",
  },
  {
    id: "bento-modern",
    name: "Bento modern",
    category: "events",
    description: "Mixed tile sizes for variety.",
  },
  {
    id: "wedding-soft",
    name: "Wedding soft",
    category: "wedding",
    description: "Soft gradient hero and elegant grid.",
  },
  {
    id: "lavender-dream",
    name: "Lavender dream",
    category: "wedding",
    description: "Lavender tones and gentle spacing.",
  },
  {
    id: "sports-bold",
    name: "Sports bold",
    category: "sports",
    description: "High-contrast header and dense grid.",
  },
  {
    id: "minimal-dark",
    name: "Minimal dark",
    category: "custom",
    description: "Dark frame, focus on imagery.",
  },
]

const templateIds = new Set(CLIENT_GALLERY_TEMPLATES.map((t) => t.id))

export function isValidGalleryTemplateId(id: string): boolean {
  return templateIds.has(id)
}

export function getGalleryTemplateById(id: string): ClientGalleryTemplateDef | undefined {
  return CLIENT_GALLERY_TEMPLATES.find((t) => t.id === id)
}

export function normalizeGalleryTemplateId(id: string | undefined | null): string {
  if (id && templateIds.has(id)) return id
  return DEFAULT_GALLERY_TEMPLATE_ID
}
