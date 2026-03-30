/** Inclusive YYYY-MM-DD in UTC. */
export function parseInclusiveDateRange(fromStr: string, toStr: string): { from: Date; to: Date } | null {
  const from = new Date(`${fromStr}T00:00:00.000Z`)
  const to = new Date(`${toStr}T23:59:59.999Z`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null
  return { from, to }
}

/** Calendar month in UTC (YYYY-MM). */
export function parseMonthUtc(ym: string): { from: Date; to: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim())
  if (!m) return null
  const y = Number.parseInt(m[1], 10)
  const monthIndex = Number.parseInt(m[2], 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return null
  const from = new Date(Date.UTC(y, monthIndex, 1, 0, 0, 0, 0))
  const to = new Date(Date.UTC(y, monthIndex + 1, 0, 23, 59, 59, 999))
  return { from, to }
}
