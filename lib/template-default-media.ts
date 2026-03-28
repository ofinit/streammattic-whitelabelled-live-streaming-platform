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
  /** Tech Forward Summit — dark grid + blue/cyan/neon orbs (matches watch skin `#0a0a0a` palette) */
  "tpl-corporate-tech-forward": "/templates/corporate-tech-forward-hero.svg",
  /** Classic corporate — same bundled hero as Tech Forward */
  "tpl-corporate": "/templates/corporate-tech-forward-hero.svg",
}

export function getDefaultTemplateHeroBackdropUrl(templateId: string): string | undefined {
  const url = TEMPLATE_DEFAULT_HERO_BACKDROP[templateId]
  return typeof url === "string" && url.length > 0 ? url : undefined
}
