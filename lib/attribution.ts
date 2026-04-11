/**
 * UTM and traffic attribution from URL query + Referer.
 * Defaults: source = "direct", medium = "none" when no UTM and no classified referrer.
 */

export type Attribution = {
  utm_source: string
  utm_medium: string
  utm_campaign: string | null
}

const SEARCH_HOSTS = new Set([
  "google",
  "bing",
  "yahoo",
  "duckduckgo",
  "yandex",
  "baidu",
])
function hostRoot(hostname: string): string {
  const h = hostname.toLowerCase().split(":")[0] ?? ""
  return h.replace(/^www\./, "")
}

function isSearchHost(root: string): boolean {
  if (root.includes("google.") || root === "google" || /^google\.[^.]+(\.|$)/.test(root)) return true
  for (const s of SEARCH_HOSTS) {
    if (s === "google") continue
    if (root === s || root.endsWith(`.${s}.com`) || root.endsWith(`.${s}.co.uk`) || root === `${s}.com`) {
      return true
    }
  }
  return false
}

const SOCIAL_ROOTS = [
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "reddit.com",
  "pinterest.com",
] as const

function isSocialHost(root: string): boolean {
  for (const d of SOCIAL_ROOTS) {
    if (root === d || root.endsWith(`.${d}`)) return true
  }
  return false
}

function classifyReferrer(hostname: string): Attribution | null {
  const root = hostRoot(hostname)
  if (!root) return null

  if (isSearchHost(root)) {
    const label = root.split(".")[0] || "search"
    return { utm_source: label, utm_medium: "organic", utm_campaign: null }
  }
  if (isSocialHost(root)) {
    const first = root.split(".")[0] ?? "social"
    return { utm_source: first === "x" ? "twitter" : first, utm_medium: "social", utm_campaign: null }
  }
  return null
}

/**
 * Parse referrer URL string (e.g. from Referer header) and classify SEO/social.
 */
export function attributionFromReferrerUrl(referer: string | null | undefined): Attribution | null {
  if (!referer?.trim()) return null
  try {
    const u = new URL(referer)
    return classifyReferrer(u.hostname)
  } catch {
    return null
  }
}

/**
 * Read utm_* from a URL's query string. Empty strings treated as missing.
 */
export function utmFromUrl(url: URL): Partial<Pick<Attribution, "utm_source" | "utm_medium" | "utm_campaign">> {
  const s = url.searchParams.get("utm_source")?.trim()
  const m = url.searchParams.get("utm_medium")?.trim()
  const c = url.searchParams.get("utm_campaign")?.trim()
  const out: Partial<Pick<Attribution, "utm_source" | "utm_medium" | "utm_campaign">> = {}
  if (s) out.utm_source = s
  if (m) out.utm_medium = m
  if (c) out.utm_campaign = c
  return out
}

/**
 * Merge: URL query UTMs win; then optional body/query string from client (legacy utmQuery);
 * then referrer classification; else direct/none.
 */
export function resolveAttribution(
  requestUrl: URL,
  refererHeader: string | null | undefined,
  legacyUtmSearch?: string | null,
): Attribution {
  const fromRequest = utmFromUrl(requestUrl)
  let source = fromRequest.utm_source
  let medium = fromRequest.utm_medium
  let campaign = fromRequest.utm_campaign ?? null

  if (!source && !medium && legacyUtmSearch) {
    try {
      const q = legacyUtmSearch.startsWith("?") ? legacyUtmSearch : `?${legacyUtmSearch}`
      const u = new URL(q, "https://local.invalid")
      const legacy = utmFromUrl(u)
      if (legacy.utm_source) source = legacy.utm_source
      if (legacy.utm_medium) medium = legacy.utm_medium
      if (legacy.utm_campaign != null) campaign = legacy.utm_campaign
    } catch {
      /* ignore */
    }
  }

  if (!source && !medium) {
    const fromRef = attributionFromReferrerUrl(refererHeader)
    if (fromRef) {
      return {
        utm_source: fromRef.utm_source,
        utm_medium: fromRef.utm_medium,
        utm_campaign: campaign ?? fromRef.utm_campaign,
      }
    }
  }

  return {
    utm_source: source ?? "direct",
    utm_medium: medium ?? "none",
    utm_campaign: campaign,
  }
}
