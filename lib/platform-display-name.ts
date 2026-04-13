/**
 * `platform_settings.platform_name` may be a string or legacy `{ name, tagline }`.
 * Use this anywhere the value is shown as text or metadata.
 */
export function resolvePlatformDisplayName(raw: unknown, fallback = "StreamLivee"): string {
  if (raw == null || raw === "") return fallback
  if (typeof raw === "string") {
    const t = raw.trim()
    return t.length > 0 ? t : fallback
  }
  if (typeof raw === "object" && raw !== null && "name" in raw) {
    const n = (raw as { name?: unknown }).name
    if (typeof n === "string" && n.trim().length > 0) return n.trim()
  }
  return fallback
}
