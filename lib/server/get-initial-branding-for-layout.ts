import { headers } from "next/headers"
import { getBrandingLookupByHost } from "@/lib/server/branding-lookup-by-host"
import { platformLookupBrandingToBranding, studioLookupRowToBranding } from "@/lib/map-lookup-branding"
import type { BrandingServerInitialState } from "@/lib/branding-server-initial"

/**
 * Resolve branding on the server from the request Host so custom domains do not
 * briefly render platform marketing before the client fetch completes.
 */
export async function getInitialBrandingForLayout(): Promise<BrandingServerInitialState | null> {
  try {
    const h = await headers()
    const rawHost = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0]?.trim()
    if (!rawHost) return null

    const lookup = await getBrandingLookupByHost(rawHost)
    if (lookup.isWhiteLabel) {
      return {
        branding: studioLookupRowToBranding(lookup.branding, lookup.userId),
        isWhiteLabel: true,
        currentDomain: rawHost,
      }
    }
    return {
      branding: platformLookupBrandingToBranding(lookup.branding),
      isWhiteLabel: false,
      currentDomain: rawHost,
    }
  } catch (e) {
    console.error("[getInitialBrandingForLayout]", e)
    return null
  }
}
