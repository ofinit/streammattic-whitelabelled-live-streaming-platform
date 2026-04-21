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
 * Reads `templateId` or legacy `template_id` inside `events.template_data` JSON.
 * Some imports and older rows only set snake_case.
 */
export function templateIdFromTemplateDataRecord(data: Record<string, unknown> | null | undefined): string | null {
  if (!data || typeof data !== "object") return null
  const camel = data.templateId
  const snake = data.template_id
  if (typeof camel === "string" && camel.trim()) return camel.trim()
  if (typeof snake === "string" && snake.trim()) return snake.trim()
  return null
}

/**
 * Resolves the stream template id for watch chrome and Tier-C skins.
 * Prefer `templateData.templateId` (what the event form saves); fall back to DB columns.
 */
/**
 * Ensures `templateData` is a plain object on API payloads (JSONB is usually parsed;
 * some drivers/edge cases return a string).
 */
export function normalizeWatchEventTemplateFields(ev: Record<string, unknown>): void {
  const raw = ev.templateData ?? ev.template_data
  if (raw == null || raw === "") {
    ev.templateData = {}
    return
  }
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw) as unknown
      ev.templateData =
        p && typeof p === "object" && !Array.isArray(p) ? { ...(p as Record<string, unknown>) } : {}
    } catch {
      ev.templateData = {}
    }
    return
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    ev.templateData = { ...(raw as Record<string, unknown>) }
  } else {
    ev.templateData = {}
  }
}

export function resolveWatchTemplateId(event: unknown): string {
  if (!event || typeof event !== "object") return ""
  const ev = event as Record<string, unknown>
  const rawTd = ev.templateData ?? ev.template_data
  const data = parseWatchTemplateData(rawTd)
  const fromJson = templateIdFromTemplateDataRecord(data)
  if (fromJson) return fromJson
  const fromColumn = ev.templateId ?? ev.template_id
  if (typeof fromColumn === "string" && fromColumn.trim()) {
    const s = fromColumn.trim()
    // Skin map uses string slugs like tpl-wedding-the-heart. Ignore UUID `template_id` FK if present.
    if (s.startsWith("tpl-")) return s
  }
  return ""
}
