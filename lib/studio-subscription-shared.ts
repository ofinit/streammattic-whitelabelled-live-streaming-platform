/** Shared (client-safe) helpers for Studio annual subscription / renewal UX. */

export const STUDIO_SUBSCRIPTION_REMINDER_THRESHOLDS = [30, 15, 7, 3, 2, 1, 0] as const
export type StudioSubscriptionReminderDay = (typeof STUDIO_SUBSCRIPTION_REMINDER_THRESHOLDS)[number]

export function calendarDaysUntilSubscriptionEnd(isoExpires: string): number {
  const end = new Date(isoExpires)
  const start = new Date()
  const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.round((utcDay(end) - utcDay(start)) / 86400000)
}

export function isStudioSubscriptionPastDue(expiresAtIso: string | null | undefined): boolean {
  if (expiresAtIso == null || expiresAtIso === "") return true
  const t = new Date(expiresAtIso).getTime()
  if (Number.isNaN(t)) return true
  return Date.now() > t
}

/** Dashboard banner: from 30 days before through expiry instant (calendar-based window). */
export function shouldShowStudioRenewalDashboardAlert(expiresAtIso: string | null | undefined): boolean {
  if (expiresAtIso == null || expiresAtIso === "") return false
  if (isStudioSubscriptionPastDue(expiresAtIso)) return false
  const d = calendarDaysUntilSubscriptionEnd(expiresAtIso)
  return d >= 0 && d <= 30
}

export function studioSubscriptionExpiredForEvents(expiresAtIso: string | null | undefined): boolean {
  return isStudioSubscriptionPastDue(expiresAtIso)
}
