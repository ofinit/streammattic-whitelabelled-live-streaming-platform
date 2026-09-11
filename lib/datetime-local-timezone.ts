type DateTimeParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function parseDatetimeLocal(value: string): DateTimeParts | null {
  const match = value
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null

  const [, year, month, day, hour, minute, second = "00"] = match
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  }
}

function zonedParts(date: Date, timeZone: string): DateTimeParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
  const parts = fmt.formatToParts(date)
  const p = Object.fromEntries(parts.filter((x) => x.type !== "literal").map((x) => [x.type, x.value]))

  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
  }
}

function partsAsUtcMs(parts: DateTimeParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
}

/** Convert a `datetime-local` wall-clock value in an IANA timezone to a UTC ISO timestamp. */
export function datetimeLocalToUtcIso(localDt: string, timeZone: string): string {
  const target = parseDatetimeLocal(localDt)
  if (!target) return new Date(localDt).toISOString()

  const targetMs = partsAsUtcMs(target)
  let utcMs = targetMs

  // Iterating handles month/year boundaries and DST offset changes without depending on local system timezone.
  for (let i = 0; i < 3; i++) {
    const actualMs = partsAsUtcMs(zonedParts(new Date(utcMs), timeZone))
    const deltaMs = targetMs - actualMs
    utcMs += deltaMs
    if (deltaMs === 0) break
  }

  return new Date(utcMs).toISOString()
}

/** Convert a UTC/ISO timestamp into the value expected by a `datetime-local` input. */
export function utcIsoToDatetimeLocal(utcIso: string, timeZone: string): string {
  const raw = String(utcIso || "").trim()
  if (!raw) return ""

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw.length >= 16 ? raw.slice(0, 16) : ""
  }

  const parts = zonedParts(parsed, timeZone)
  const year = String(parts.year).padStart(4, "0")
  const month = String(parts.month).padStart(2, "0")
  const day = String(parts.day).padStart(2, "0")
  const hour = String(parts.hour).padStart(2, "0")
  const minute = String(parts.minute).padStart(2, "0")

  return `${year}-${month}-${day}T${hour}:${minute}`
}

/**
 * Safely parse scheduled time into epoch ms irrespective of visitor browser timezone.
 * If scheduledAt is an ISO string with timezone (e.g. ends with Z or offset), parses as UTC.
 * If scheduledAt lacks timezone information, interprets it in the event's configured timezone.
 */
export function resolveScheduledEpochMs(scheduledAt: unknown, eventTimezone?: string): number | null {
  if (!scheduledAt) return null
  if (scheduledAt instanceof Date) {
    const t = scheduledAt.getTime()
    return Number.isNaN(t) ? null : t
  }
  if (typeof scheduledAt === "number") {
    return Number.isNaN(scheduledAt) ? null : scheduledAt
  }
  const str = String(scheduledAt).trim()
  if (!str) return null

  // Has explicit timezone: Z or +HH:mm or -HH:mm
  if (/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(str)) {
    const ms = new Date(str).getTime()
    if (!Number.isNaN(ms)) return ms
  }

  // Without timezone: e.g. "2026-09-15T22:53:00" or "2026-09-15 22:53:00"
  const normalized = str.replace(" ", "T")
  if (eventTimezone && eventTimezone.trim()) {
    try {
      const utcIso = datetimeLocalToUtcIso(normalized, eventTimezone.trim())
      const ms = new Date(utcIso).getTime()
      if (!Number.isNaN(ms)) return ms
    } catch {
      // fallback
    }
  }

  // Treat as UTC by appending Z if missing
  const withZ = normalized.endsWith("Z") ? normalized : `${normalized}Z`
  const msZ = new Date(withZ).getTime()
  if (!Number.isNaN(msZ)) return msZ

  const fallback = new Date(str).getTime()
  return Number.isNaN(fallback) ? null : fallback
}

