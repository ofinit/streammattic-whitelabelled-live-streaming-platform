/**
 * Event title typography for the public watch page (stored in template_data).
 * - titleGoogleFont: Google Font family name, or omit for template default stack
 * - titleFontSizeRem: optional hero base size in rem; omit to use template default
 * - titleFontColor: optional hex color; omit to use the template default
 */

export type { GoogleFontEntry } from "./google-title-fonts"
export { GOOGLE_TITLE_FONTS } from "./google-title-fonts"

export const TITLE_SIZE_SLIDER_MIN = 1.25
export const TITLE_SIZE_SLIDER_MAX = 5.5
export const TITLE_SIZE_SLIDER_STEP = 0.125

/** Default hero base (rem) when titleFontSizeRem is not set — tuned per template */
export function getTemplateDefaultTitleRem(templateId: string): number {
  switch (templateId) {
    case "tpl-wedding-midnight":
      return 4
    case "tpl-wedding":
    case "tpl-wedding-garden":
    case "tpl-wedding-the-heart":
    case "tpl-wedding-royal-circle":
    case "tpl-wedding-papercut":
    case "tpl-wedding-coastal":
    case "tpl-wedding-celestial":
    case "tpl-wedding-traditional-hindu":
    case "tpl-christian-wedding-rose":
    case "tpl-muslim-wedding-nikah":
    case "tpl-engagement":
    case "tpl-anniversary":
      return 3.5
    case "tpl-concert":
    case "tpl-movie-premiere":
    case "tpl-award-ceremony":
    case "tpl-comedy-show":
    case "tpl-gaming":
      return 3.125
    case "tpl-corporate":
    case "tpl-corporate-tech-forward":
    case "tpl-webinar":
    case "tpl-product-launch":
    case "tpl-auction":
    case "tpl-real-estate":
      return 2.375
    case "tpl-baby-shower":
    case "tpl-birthday-party":
    case "tpl-graduation":
    case "tpl-reunion":
    case "tpl-charity":
      return 2.625
    case "tpl-sports":
    case "tpl-political":
    case "tpl-school":
    case "tpl-fitness":
    case "tpl-podcast":
      return 2.25
    case "tpl-christian":
    case "tpl-muslim":
    case "tpl-hindu":
    case "tpl-indian-festival":
    case "tpl-chinese-festival":
    case "tpl-christmas":
    case "tpl-eid":
    case "tpl-thanksgiving":
    case "tpl-halloween":
    case "tpl-funeral":
      return 3.25
    case "tpl-default":
    default:
      return 1.875
  }
}

function clampRem(n: number): number {
  return Math.min(TITLE_SIZE_SLIDER_MAX, Math.max(TITLE_SIZE_SLIDER_MIN, n))
}

export function googleFontsStylesheetHref(family: string): string {
  const q = encodeURIComponent(family).replace(/%20/g, "+")
  return `https://fonts.googleapis.com/css2?family=${q}:wght@400;600;700&display=swap`
}

const PREVIEW_BASE = "https://fonts.googleapis.com/css2?"
const PREVIEW_SUFFIX = "&display=swap"
/** Max URL length to stay under browser limits when batching many families */
const PREVIEW_URL_MAX = 1900
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

function familyPreviewParam(family: string): string {
  const q = encodeURIComponent(family).replace(/%20/g, "+")
  return `family=${q}:wght@400`
}

/**
 * One or more stylesheet URLs loading weight 400 for each family (dropdown previews).
 */
export function googleFontsPreviewStylesheetHrefs(families: string[]): string[] {
  if (families.length === 0) return []
  const hrefs: string[] = []
  let chunk: string[] = []

  const pushChunk = () => {
    if (chunk.length === 0) return
    hrefs.push(`${PREVIEW_BASE}${chunk.join("&")}${PREVIEW_SUFFIX}`)
    chunk = []
  }

  for (const family of families) {
    const param = familyPreviewParam(family)
    const candidate =
      chunk.length === 0
        ? `${PREVIEW_BASE}${param}${PREVIEW_SUFFIX}`
        : `${PREVIEW_BASE}${chunk.join("&")}&${param}${PREVIEW_SUFFIX}`
    if (candidate.length > PREVIEW_URL_MAX && chunk.length > 0) {
      pushChunk()
    }
    chunk.push(param)
  }
  pushChunk()
  return hrefs
}

/** Resolved Google Font family for watch page, or null = use template Tailwind stack */
export function resolveTitleGoogleFontFamily(td: Record<string, unknown>): string | null {
  const g = td.titleGoogleFont
  if (typeof g === "string" && g.trim()) return g.trim()
  const legacy = td.titleFontFamily
  if (legacy === "serif") return "Playfair Display"
  if (legacy === "sans") return "Inter"
  if (legacy === "wedding") return "Lato"
  return null
}

/** Hero base rem (always a concrete number for layout) */
export function resolveTitleHeroRem(td: Record<string, unknown>, templateId: string): number {
  const raw = td.titleFontSizeRem
  if (typeof raw === "number" && Number.isFinite(raw)) return clampRem(raw)
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = parseFloat(raw)
    if (Number.isFinite(n)) return clampRem(n)
  }
  const def = getTemplateDefaultTitleRem(templateId)
  const legacy = td.titleFontSize
  switch (legacy) {
    case "sm":
      return clampRem(def * 0.72)
    case "md":
      return clampRem(def * 0.9)
    case "lg":
      return clampRem(def * 1.08)
    case "xl":
      return clampRem(def * 1.22)
    default:
      return def
  }
}

export function resolveTitleFontColor(td: Record<string, unknown>): string | null {
  const raw = td.titleFontColor
  if (typeof raw !== "string") return null
  const color = raw.trim()
  return HEX_COLOR_RE.test(color) ? color : null
}

export function titleFallbackFontClass(templateId: string, hasGoogleFont: boolean): string {
  if (hasGoogleFont) return ""
  if (
    templateId === "tpl-wedding" ||
    templateId === "tpl-wedding-garden" ||
    templateId === "tpl-wedding-the-heart" ||
    templateId === "tpl-wedding-royal-circle" ||
    templateId === "tpl-wedding-papercut"
  )
    return "font-serif"
  if (templateId === "tpl-wedding-midnight") return "font-midnight-display"
  if (templateId === "tpl-wedding-coastal") return "font-coastal-script"
  if (templateId === "tpl-wedding-celestial") return "font-celestial-display"
  if (templateId === "tpl-wedding-traditional-hindu") return "font-hindu-wedding-display"
  if (templateId === "tpl-funeral") return "font-memorial-display"
  if (templateId === "tpl-christian-wedding-rose") return "font-christian-rose-script"
  if (templateId === "tpl-muslim-wedding-nikah") return "font-nikah-display"
  if (templateId === "tpl-birthday-party") return "font-birthday-display"
  return "font-sans"
}

export function heroTitleFontSizeStyle(baseRem: number): { fontSize: string } {
  const min = Math.max(1.05, baseRem * 0.5)
  const mid = baseRem * 0.38
  const max = baseRem * 1.2
  return {
    fontSize: `clamp(${min.toFixed(3)}rem, 2.25vw + ${mid.toFixed(3)}rem, ${max.toFixed(3)}rem)`,
  }
}

/**
 * "The Heart" hero — matches Wedding Template 03 reference (`clamp(2.75rem, 11vw, 6.667rem)` at default).
 * Generic `heroTitleFontSizeStyle` was too small here because inline styles override `the-heart-template.css`.
 */
export function heroTitleFontSizeStyleForTheHeart(baseRem: number): { fontSize: string } {
  const def = getTemplateDefaultTitleRem("tpl-wedding-the-heart")
  const scale = Math.max(0.45, baseRem / def)
  const min = 2.75 * scale
  const vw = 11 * scale
  const max = 6.667 * scale
  return {
    fontSize: `clamp(${min.toFixed(3)}rem, ${vw.toFixed(3)}vw, ${max.toFixed(3)}rem)`,
  }
}

export function cardTitleFontSizeStyle(baseRem: number): { fontSize: string } {
  const c = baseRem * 0.4
  const min = Math.max(0.9, c * 0.82)
  const max = c * 1.12
  return { fontSize: `clamp(${min.toFixed(3)}rem, 0.9vw + ${(c * 0.5).toFixed(3)}rem, ${max.toFixed(3)}rem)` }
}

export function pageTitleFontSizeStyle(baseRem: number): { fontSize: string } {
  const p = baseRem * 0.58
  const min = Math.max(1.15, p * 0.78)
  const max = p * 1.05
  return { fontSize: `clamp(${min.toFixed(3)}rem, 1.6vw + ${(p * 0.42).toFixed(3)}rem, ${max.toFixed(3)}rem)` }
}
