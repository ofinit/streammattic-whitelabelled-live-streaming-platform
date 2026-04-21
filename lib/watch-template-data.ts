/**
 * Parse `events.template_data` JSON for watch UI (and resolve template id from column fallbacks).
 */

export function parseWatchTemplateData(raw: unknown): Record<string, unknown> {
  if (raw == null || raw === "") return {}
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return {}
    } catch {
      return {}
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

/**
 * Resolves the stream template id for watch chrome and Tier-C skins.
 * Prefer `templateData.templateId` (what the event form saves); fall back to DB columns.
 */
export function resolveWatchTemplateId(event: unknown): string {
  if (!event || typeof event !== "object") return ""
  const ev = event as Record<string, unknown>
  const data = parseWatchTemplateData(ev.templateData)
  const fromJson = data.templateId
  if (typeof fromJson === "string" && fromJson.trim()) return fromJson.trim()
  const fromColumn = ev.templateId ?? ev.template_id
  if (typeof fromColumn === "string" && fromColumn.trim()) return fromColumn.trim()
  return ""
}
