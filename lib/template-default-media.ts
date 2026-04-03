/**
 * Default hero/backdrop images when an event has no hero_image_url or template image upload.
 * - Classic wedding: remote Unsplash (reliable CDN).
 * - Ethereal Garden & Tech Forward: bundled assets in /public/templates (theme-matched; reliable offline).
 */

export const TEMPLATE_DEFAULT_HERO_BACKDROP: Partial<Record<string, string>> = {
  "tpl-wedding":
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2400&q=80",
  /** Generated botanical / sage-cream garden hero; see `public/templates/ethereal-garden-hero.png` */
  "tpl-wedding-garden": "/templates/ethereal-garden-hero.png",
  /** Midnight Elegance — dark luxury / city night */
  "tpl-wedding-midnight":
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=2400&q=80",
  "tpl-wedding-coastal":
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=80",
  /** Celestial Dreams — night sky / Milky Way */
  "tpl-wedding-celestial":
    "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=2400&q=80",
  /** Shubh Vivah — brass diyas / temple lamps (spiritual, prayer, ritual) */
  "tpl-wedding-traditional-hindu":
    "https://images.unsplash.com/photo-1771929712047-3e7022669175?auto=format&fit=crop&w=2400&q=80",
  /** Tech Forward Summit — dark grid + blue/cyan/neon orbs (matches watch skin `#0a0a0a` palette) */
  "tpl-corporate-tech-forward": "/templates/corporate-tech-forward-hero.svg",
  /** Classic corporate — same bundled hero as Tech Forward */
  "tpl-corporate": "/templates/corporate-tech-forward-hero.svg",
  /** Christian wedding / ceremony — church interior (reliable CDN; public JPG paths were missing) */
  "tpl-christian":
    "https://images.unsplash.com/photo-1519167758481-83f29da30471?auto=format&fit=crop&w=2400&q=80",
  /** Rose & faith animated Christian wedding — rings / soft romantic (optional hero overlay) */
  "tpl-christian-wedding-rose":
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2400&q=80",
  /** Muslim / Islamic wedding or ceremony */
  "tpl-muslim":
    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=2400&q=80",
  /** Nikah live stream — emerald & gold hero overlay */
  "tpl-muslim-wedding-nikah":
    "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=2400&q=80",
  /**
   * Memorial — live hero is CSS gradient only (see memorial watch view).
   * Bundled SVG matches that look for template picker thumbnails / metadata fallbacks.
   */
  "tpl-funeral": "/templates/memorial-hero-default.svg",
  /** Birthday party bash — colorful cake / celebration */
  "tpl-birthday-party":
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=2400&q=80",
}

export function getDefaultTemplateHeroBackdropUrl(templateId: string): string | undefined {
  const url = TEMPLATE_DEFAULT_HERO_BACKDROP[templateId]
  return typeof url === "string" && url.length > 0 ? url : undefined
}
