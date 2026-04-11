import geoip from "geoip-lite"

/** English display name for ISO 3166-1 alpha-2 (e.g. IN → India). */
export function countryNameFromCode(code: string | null | undefined): string | null {
  if (!code || code.length !== 2) return null
  const upper = code.toUpperCase()
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(upper)
    return name ?? upper
  } catch {
    return upper
  }
}

/**
 * Resolve country from IPv4/IPv6 using bundled MaxMind data (geoip-lite).
 * Best-effort: private/local IPs and some IPv6 addresses return null.
 */
export function lookupCountryNameFromIp(ip: string | null | undefined): string | null {
  if (!ip?.trim()) return null
  const first = ip.split(",")[0]?.trim() ?? ""
  if (!first || first === "127.0.0.1" || first === "::1") return null
  const geo = geoip.lookup(first)
  if (!geo?.country) return null
  return countryNameFromCode(geo.country)
}
