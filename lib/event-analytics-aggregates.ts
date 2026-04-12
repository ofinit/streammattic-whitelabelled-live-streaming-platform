import { UAParser } from "ua-parser-js"

export type NamedCountPct = { name: string; count: number; pct: number }

/** Parse grouped user_agent rows into device / browser / OS buckets. */
export function aggregateUserAgentBuckets(
  rows: { user_agent: string | null; c: bigint | number }[],
  totalSessions: number,
): { devices: NamedCountPct[]; browsers: NamedCountPct[]; oses: NamedCountPct[] } {
  const devices = new Map<string, number>()
  const browsers = new Map<string, number>()
  const oses = new Map<string, number>()
  const parser = new UAParser()

  for (const row of rows) {
    const n = Number(row.c)
    const uaStr = typeof row.user_agent === "string" ? row.user_agent.trim() : ""
    parser.setUA(uaStr || "Mozilla/5.0")
    const r = parser.getResult()
    const dtype = r.device.type
    const deviceLabel =
      dtype === "mobile" ? "Mobile" : dtype === "tablet" ? "Tablet" : "Desktop"
    const browserName = r.browser.name || "Unknown"
    const osName = r.os.name || "Unknown"
    devices.set(deviceLabel, (devices.get(deviceLabel) || 0) + n)
    browsers.set(browserName, (browsers.get(browserName) || 0) + n)
    oses.set(osName, (oses.get(osName) || 0) + n)
  }

  const toArr = (m: Map<string, number>, limit = 12): NamedCountPct[] => {
    const arr = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)
    return arr.map(([name, count]) => ({
      name,
      count,
      pct: totalSessions > 0 ? Math.round((count / totalSessions) * 1000) / 10 : 0,
    }))
  }

  return {
    devices: toArr(devices),
    browsers: toArr(browsers),
    oses: toArr(oses),
  }
}

export function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) {
    if (current === 0) return 0
    return null
  }
  return Math.round(((current - previous) / previous) * 1000) / 10
}

/** One row per calendar day (UTC) for the rolling window of `dayCount` days starting at `sinceIso`. */
export function fillDailyGaps(
  rows: { day: string; sessions: number; uniqueVisitors: number }[],
  sinceIso: string,
  dayCount: number,
): { day: string; sessions: number; uniqueVisitors: number }[] {
  const map = new Map(rows.map((r) => [r.day, r]))
  const out: { day: string; sessions: number; uniqueVisitors: number }[] = []
  const start = new Date(sinceIso)
  const cur0 = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(cur0)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    out.push(map.get(key) ?? { day: key, sessions: 0, uniqueVisitors: 0 })
  }
  return out
}

/** Regional indicator flag emoji from ISO 3166-1 alpha-2 (e.g. IN → 🇮🇳). */
export function countryCodeToFlagEmoji(code: string): string {
  if (!code || code === "unknown" || code.length !== 2) return ""
  const c = code.toUpperCase()
  if (!/^[A-Z]{2}$/.test(c)) return ""
  return String.fromCodePoint(127397 + c.charCodeAt(0), 127397 + c.charCodeAt(1))
}
