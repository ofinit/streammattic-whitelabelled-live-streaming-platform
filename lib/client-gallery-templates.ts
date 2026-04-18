export type GalleryTemplateCategory = "wedding" | "events" | "sports" | "custom"

export type ClientGalleryTemplateDef = {
  id: string
  name: string
  category: GalleryTemplateCategory
  description: string
}

export const DEFAULT_GALLERY_TEMPLATE_ID = "midnight-elegance"

export const CLIENT_GALLERY_TEMPLATES: ClientGalleryTemplateDef[] = [
  {
    id: "midnight-elegance",
    name: "Midnight Elegance",
    category: "events",
    description: "Clean gallery with subtle sophistication and balanced grid layout.",
  },
  {
    id: "cinematic-hero",
    name: "Cinematic Hero",
    category: "events",
    description: "Dramatic featured image with cinematic overlay and bold typography.",
  },
  {
    id: "storyflow",
    name: "Storyflow",
    category: "events",
    description: "Dynamic masonry arrangement that tells your visual story.",
  },
  {
    id: "artisan-bento",
    name: "Artisan Bento",
    category: "events",
    description: "Curated asymmetric tiles with mixed proportions and modern flair.",
  },
  {
    id: "blush-serenity",
    name: "Blush Serenity",
    category: "wedding",
    description: "Romantic rose gradients with delicate typography and soft elegance.",
  },
  {
    id: "amethyst-garden",
    name: "Amethyst Garden",
    category: "wedding",
    description: "Dreamy violet tones with garden-inspired spacious layout.",
  },
  {
    id: "velocity-edge",
    name: "Velocity Edge",
    category: "sports",
    description: "High-energy gradient header with bold athletic presence.",
  },
  {
    id: "obsidian-frame",
    name: "Obsidian Frame",
    category: "custom",
    description: "Pure dark canvas that puts your imagery center stage.",
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
