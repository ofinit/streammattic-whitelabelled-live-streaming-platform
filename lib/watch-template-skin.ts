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
  | "weddingTraditionalHindu"
  | "weddingTheHeart"
  | "christianWeddingRose"
  | "muslimWeddingNikah"
  | "birthdayParty"
  | "corporateTechForward"
  | "memorialService"

/** Extend when adding a new Tier-C watch layout. */
export const WATCH_TEMPLATE_SKIN_BY_ID: Partial<Record<string, WatchPageSkin>> = {
  "tpl-wedding": "wedding",
  "tpl-wedding-garden": "weddingGarden",
  "tpl-wedding-midnight": "weddingMidnight",
  "tpl-wedding-coastal": "weddingCoastal",
  "tpl-wedding-celestial": "weddingCelestial",
  "tpl-wedding-traditional-hindu": "weddingTraditionalHindu",
  /** Wedding Template 03 ("The Heart") — requires `templateData.templateId` (or legacy `template_id`) on the event */
  "tpl-wedding-the-heart": "weddingTheHeart",
  "tpl-christian-wedding-rose": "christianWeddingRose",
  "tpl-muslim-wedding-nikah": "muslimWeddingNikah",
  "tpl-birthday-party": "birthdayParty",
  "tpl-corporate-tech-forward": "corporateTechForward",
  /** Classic corporate — same Tier-C watch layout + default hero asset as Tech Forward */
  "tpl-corporate": "corporateTechForward",
  "tpl-funeral": "memorialService",
}

export function getWatchPageSkin(templateId: string): WatchPageSkin {
  const id = templateId?.trim()
  if (!id) return "default"
  return WATCH_TEMPLATE_SKIN_BY_ID[id] ?? "default"
}
