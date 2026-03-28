/**
 * Maps event template ids to full watch-page layout skins.
 * Tier-C templates (custom hero, chat chrome, etc.) register here; everything else uses "default".
 */
export type WatchPageSkin =
  | "default"
  | "wedding"
  | "weddingGarden"
  | "weddingMidnight"
  | "weddingCoastal"
  | "weddingCelestial"
  | "corporateTechForward"

/** Extend when adding a new Tier-C watch layout. */
export const WATCH_TEMPLATE_SKIN_BY_ID: Partial<Record<string, WatchPageSkin>> = {
  "tpl-wedding": "wedding",
  "tpl-wedding-garden": "weddingGarden",
  "tpl-wedding-midnight": "weddingMidnight",
  "tpl-wedding-coastal": "weddingCoastal",
  "tpl-wedding-celestial": "weddingCelestial",
  "tpl-corporate-tech-forward": "corporateTechForward",
}

export function getWatchPageSkin(templateId: string): WatchPageSkin {
  const id = templateId?.trim()
  if (!id) return "default"
  return WATCH_TEMPLATE_SKIN_BY_ID[id] ?? "default"
}
