import type { Branding } from "@/lib/types"

/** Matches hero subtitle fallback in `components/landing/studio-landing.tsx` */
export const STUDIO_LANDING_DEFAULT_META_DESCRIPTION =
  "Professional photography, videography and live streaming services for your special events. Capturing moments that last forever."

/**
 * Title and meta description for the studio landing (SEO + browser tab).
 * Used by root `generateMetadata` and client `document.title` updates.
 */
export function resolveStudioLandingPageMeta(
  branding: Branding,
  fallbackSiteName: string,
): { title: string; description: string } {
  const title = (branding.metaTitle?.trim() || branding.brandName?.trim() || fallbackSiteName).trim()
  const description = (branding.metaDescription?.trim() || STUDIO_LANDING_DEFAULT_META_DESCRIPTION).trim()
  return { title, description }
}

/** Absolute URL for `metadata` / Open Graph (relative paths resolved against `metadataBase`). */
export function absoluteMetadataAssetUrl(raw: string | undefined, metadataBase: URL): string | undefined {
  if (!raw?.trim()) return undefined
  const s = raw.trim()
  if (/^https?:\/\//i.test(s)) return s
  try {
    const path = s.startsWith("/") ? s : `/${s.replace(/^\/+/, "")}`
    return new URL(path, metadataBase).href
  } catch {
    return undefined
  }
}
