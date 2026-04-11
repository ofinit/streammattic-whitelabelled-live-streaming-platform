/**
 * Platform setting `youtube_config_enabled` + per-user override `youtube_config_override_*`.
 * JSONB / Redis / clients may surface booleans as bool, string, or number — normalize here.
 */
export function coerceYoutubeConfigEnabledFlag(raw: unknown): boolean {
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase()
    if (s === "true" || s === "1" || s === "yes") return true
    if (s === "false" || s === "0" || s === "no" || s === "") return false
  }
  return false
}

/** null = inherit platform flag; true/false = admin per-entity override */
export function coerceYoutubeConfigOverride(raw: unknown): boolean | null {
  if (raw === null || raw === undefined) return null
  if (raw === true || raw === 1) return true
  if (raw === false || raw === 0) return false
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase()
    if (s === "null" || s === "undefined" || s === "") return null
    if (s === "true" || s === "1" || s === "yes") return true
    if (s === "false" || s === "0" || s === "no") return false
  }
  return null
}

export function resolveYoutubeDashboardEnabled(platformRaw: unknown, overrideRaw: unknown): boolean {
  const o = coerceYoutubeConfigOverride(overrideRaw)
  if (o === true) return true
  if (o === false) return false
  return coerceYoutubeConfigEnabledFlag(platformRaw)
}
