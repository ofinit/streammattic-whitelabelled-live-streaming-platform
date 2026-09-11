import type { LiveEvent } from "@/lib/types"

export function cleanDomainName(raw?: string | null): string {
  if (!raw || typeof raw !== "string") return ""
  return raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
}

/**
 * Resolves the display domain name for copyright & platform branding:
 * 1. Verified custom domain linked to the studio account owning the event (only if verified)
 * 2. Domain from event publicUrl if absolute and valid (e.g. streamlivee.com or custom domain)
 * 3. Current active browser hostname (window.location.hostname) where user is logged in / viewing
 * 4. Fallback host / streamlivee.com
 *
 * Note: Photographer contact website (e.g. ofinit.com) is intentionally NOT used here,
 * as copyright belongs to the platform / studio account domain, not individual photographer contact details.
 */
export function resolveStudioDomain(
  event?: Partial<LiveEvent> | Record<string, unknown> | null,
  fallbackHost?: string,
): string {
  if (event) {
    // 1. Verified custom domain linked to the studio
    const candidateStudio =
      (event as any).studioCustomDomain ||
      (event as any).primaryDomain ||
      (event as any).customDomain

    const fromStudio = cleanDomainName(candidateStudio)
    if (fromStudio && fromStudio.includes(".") && !fromStudio.includes("localhost") && !fromStudio.includes("127.0.0.1")) {
      return fromStudio
    }

    // 2. Domain the event was created with / published under (if absolute URL)
    const publicUrl = (event as any).publicUrl || (event as any).public_url
    if (typeof publicUrl === "string" && publicUrl.startsWith("http")) {
      const fromPublicUrl = cleanDomainName(publicUrl)
      if (fromPublicUrl && fromPublicUrl.includes(".") && !fromPublicUrl.includes("localhost") && !fromPublicUrl.includes("127.0.0.1")) {
        return fromPublicUrl
      }
    }
  }

  // 3. Current active browser hostname where user is viewing / logged into (non-localhost)
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = cleanDomainName(window.location.hostname)
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && host.includes(".")) {
      return host
    }
  }

  if (fallbackHost) {
    const host = cleanDomainName(fallbackHost)
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1") && host.includes(".")) {
      return host
    }
  }

  return "streamlivee.com"
}
