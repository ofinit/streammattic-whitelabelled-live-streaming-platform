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
 * Resolves the display domain name for a studio user owning an event:
 * 1. Verified / primary custom domain linked to the studio (studioCustomDomain, primaryDomain, customDomain)
 * 2. Photographer contact website (e.g. ofinit.com from https://ofinit.com)
 * 3. Current window.location.hostname if visiting on a custom domain (non-localhost)
 * 4. Fallback host / streamlivee.com
 */
export function resolveStudioDomain(
  event?: Partial<LiveEvent> | Record<string, unknown> | null,
  fallbackHost?: string,
): string {
  if (event) {
    const candidateStudio =
      (event as any).studioCustomDomain ||
      (event as any).primaryDomain ||
      (event as any).customDomain

    const fromStudio = cleanDomainName(candidateStudio)
    if (fromStudio && fromStudio.includes(".")) {
      return fromStudio
    }

    const website = (event as any).photographerContact?.website
    const fromWebsite = cleanDomainName(website)
    if (fromWebsite && fromWebsite.includes(".")) {
      return fromWebsite
    }
  }

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
