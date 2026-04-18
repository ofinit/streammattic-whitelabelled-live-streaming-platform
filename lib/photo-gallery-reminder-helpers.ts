import { calendarDaysUntilSubscriptionEnd } from "@/lib/studio-subscription-shared"

/** Days after expiry (1 = first calendar day after expiry date). */
export function calendarDaysAfterPhotoGalleryExpiry(expiresIso: string): number {
  const end = new Date(expiresIso)
  const start = new Date()
  const utcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.round((utcDay(start) - utcDay(end)) / 86400000)
}

export const PHOTO_GALLERY_PRE_REMINDER_DAYS = [7, 3, 1, 0] as const

export { calendarDaysUntilSubscriptionEnd }
