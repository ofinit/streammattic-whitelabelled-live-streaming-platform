import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"

/** Shape returned by GET /api/watch (after JSON); keeps metadata logic in sync with watch UI. */
export type WatchEventMetaPayload = {
  title?: string
  subtitle?: string
  description?: string
  scheduledAt?: string
  timezone?: string
  status?: string
  heroImageUrl?: string
  thumbnail?: string
  templateId?: string
  templateData?: unknown
  studioName?: string
  eventDates?: Array<{
    scheduledAt?: string
    timezone?: string
    label?: string
    sortOrder?: number
  }>
}

function parseWatchTemplateData(raw: unknown): Record<string, unknown> {
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

function toAbsoluteAssetUrl(base: string, url: string): string {
  const b = base.replace(/\/$/, "")
  const u = url.trim()
  if (!u) return b
  if (/^https?:\/\//i.test(u)) return u
  return `${b}${u.startsWith("/") ? u : `/${u}`}`
}

function formatOneDate(iso: string, timeZone: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "Date TBA"
  const tz = timeZone && timeZone !== "UTC" ? timeZone : undefined
  const dateStr = d.toLocaleDateString("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const timeStr = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
  const tzShort = tz
    ? new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortGeneric" })
        .formatToParts(d)
        .find((p) => p.type === "timeZoneName")?.value ?? tz
    : "UTC"
  const iana = timeZone && timeZone !== "UTC" ? ` · ${timeZone}` : ""
  return `${dateStr} · ${timeStr} ${tzShort}${iana}`
}

/**
 * Single line for document title: mirrors primary schedule line on the watch page.
 */
/** Visible event name: wedding couple from templateData, else DB title (matches watch UI). */
export function buildWatchDisplayName(ev: WatchEventMetaPayload): string {
  const td = parseWatchTemplateData(ev.templateData)
  const bride = typeof td.brideName === "string" ? td.brideName.trim() : ""
  const groom = typeof td.groomName === "string" ? td.groomName.trim() : ""
  if (bride || groom) {
    const couple = [bride, groom].filter(Boolean).join(" & ")
    if (couple) return couple.replace(/\s+/g, " ")
  }
  const tid = ev.templateId?.trim()
  if (tid === "tpl-corporate-tech-forward") {
    const company = typeof td.companyName === "string" ? td.companyName.trim() : ""
    if (company) return company.replace(/\s+/g, " ")
  }
  return (ev.title?.trim() || "Live Event").replace(/\s+/g, " ")
}

export function formatWatchScheduleForMeta(ev: WatchEventMetaPayload): string {
  const tzMain = ev.timezone?.trim() || "UTC"

  if (ev.scheduledAt) {
    return formatOneDate(ev.scheduledAt, tzMain)
  }

  const dates = [...(ev.eventDates ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const first = dates[0]
  if (first?.scheduledAt) {
    const tz = first.timezone?.trim() || tzMain
    return formatOneDate(first.scheduledAt, tz)
  }

  if (ev.status === "live") return "Live now"
  return "Date & time TBA"
}

export function buildWatchDocumentTitle(ev: WatchEventMetaPayload): string {
  const name = buildWatchDisplayName(ev)
  const when = formatWatchScheduleForMeta(ev)
  return `${name} ~ ${when}`
}

/**
 * Rich OG/Twitter body: subtitle, description, schedule + IANA TZ, studio.
 */
export function buildWatchShareDescription(ev: WatchEventMetaPayload, scheduleLine: string): string {
  const parts: string[] = []
  const sub = ev.subtitle?.trim()
  if (sub) parts.push(sub)

  const desc = ev.description?.trim()
  if (desc) {
    parts.push(desc.replace(/\s+/g, " ").slice(0, 400))
  }

  parts.push(`When: ${scheduleLine}`)
  const tz = ev.timezone?.trim()
  if (tz && tz !== "UTC") {
    parts.push(`Timezone: ${tz}`)
  }

  const studio = ev.studioName?.trim()
  if (studio) parts.push(`Presented by ${studio}`)

  return parts.join("\n\n").slice(0, 600)
}

/**
 * Same priority as watch hero backdrop: uploaded hero → wedding couple photo → template default → thumbnail.
 */
export function resolveWatchOgImageUrl(baseUrl: string, ev: WatchEventMetaPayload): string | undefined {
  const td = parseWatchTemplateData(ev.templateData)
  const couplePhoto = typeof td.couplePhoto === "string" ? td.couplePhoto.trim() : ""
  const hero = typeof ev.heroImageUrl === "string" ? ev.heroImageUrl.trim() : ""
  const thumb = typeof ev.thumbnail === "string" ? ev.thumbnail.trim() : ""
  const tmpl = (ev.templateId?.trim() || "tpl-default") || "tpl-default"

  const raw = hero || couplePhoto || getDefaultTemplateHeroBackdropUrl(tmpl) || thumb || ""
  if (!raw) return undefined
  return toAbsoluteAssetUrl(baseUrl, raw)
}
