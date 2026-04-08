import { getDb } from "@/lib/db"
import { parseValidityExtensionsSetting } from "@/lib/validity-extensions"

/**
 * Stream type mapping: form values → DB enum values / internal keys
 */
export const STREAM_TYPE_MAP: Record<string, string> = {
  rtmp: "rtmp",
  youtube_api: "youtube_api",
  youtube: "youtube_embed",
  youtube_embed: "youtube_embed",
  embedded: "third_party",
  third_party: "third_party",
}

/**
 * Map DB stream type to credit column name in user_credits table
 */
export function getCreditColumn(dbStreamType: string): string {
  if (dbStreamType === "rtmp") return "rtmp"
  if (dbStreamType === "youtube_api") return "youtube_api"
  if (dbStreamType === "youtube_embed") return "youtube_embed"
  return "third_party"
}

export type CreditNeedInput = {
  streamType: string | null
  scheduledAt: string | null
  additionalDates?: { scheduledAt: string }[]
  validityDays?: number
}

/**
 * Calculate total credits required based on policy:
 * 1 base credit (if stream type selected) + extra calendar dates + validity tier cost
 */
export async function calculateTotalCreditsRequired(input: CreditNeedInput) {
  const { streamType, scheduledAt, additionalDates, validityDays } = input

  if (!streamType) return 0

  const baseCost = 1

  let extraDatesCost = 0
  if (Array.isArray(additionalDates) && additionalDates.length > 0) {
    const primaryDatePart = scheduledAt ? scheduledAt.slice(0, 10) : null
    const billableDates = additionalDates.filter(
      (d) => d.scheduledAt && d.scheduledAt.slice(0, 10) !== primaryDatePart,
    )
    extraDatesCost = billableDates.length
  }

  let validityTierCost = 0
  if (typeof validityDays === "number" && validityDays > 0) {
    const sql = getDb()
    const settingsRow = await sql`SELECT value FROM platform_settings WHERE key = 'validity_extensions'`
    const settings = parseValidityExtensionsSetting(settingsRow[0]?.value)
    const tier = settings.extendedTiers.find((t) => t.days === validityDays)
    if (tier && tier.enabled) {
      validityTierCost = tier.creditCost
    }
  }

  return baseCost + extraDatesCost + validityTierCost
}

/**
 * Admin bypass: only when the admin is acting on their own account (target user = session user)
 * and the request host is the master domain (or local dev hosts).
 */
export function shouldBypassCredits(
  user: { role?: string; id?: string },
  targetUserId: string,
  host: string,
): boolean {
  const isMasterDomain =
    host.includes("streamlivee.com") ||
    host.includes("localhost") ||
    host === "127.0.0.1"

  return user.role === "admin" && user.id === targetUserId && isMasterDomain
}

/** @deprecated Use shouldBypassCredits — same behavior */
export const isEligibleForAdminBypass = shouldBypassCredits

/**
 * Incremental credits when moving from one billed state to another (e.g. event edit).
 */
export async function computeIncrementalCreditsRequired(
  previous: CreditNeedInput,
  next: CreditNeedInput,
): Promise<number> {
  const prevTotal = await calculateTotalCreditsRequired(previous)
  const nextTotal = await calculateTotalCreditsRequired(next)
  return Math.max(0, nextTotal - prevTotal)
}

/**
 * Map `event_dates` rows to the shape expected by {@link calculateTotalCreditsRequired}.
 */
export function eventDateRowsToCreditAdditionalDates(
  rows: { scheduled_at: unknown }[],
): { scheduledAt: string }[] {
  const out: { scheduledAt: string }[] = []
  for (const r of rows) {
    const v = r.scheduled_at
    const s =
      v instanceof Date ? v.toISOString() : typeof v === "string" ? v : ""
    if (s) out.push({ scheduledAt: s })
  }
  return out
}

/**
 * Infer `validityDays` for billing from stored event fields (matches UI tier / default days).
 */
export async function inferValidityDaysForBilling(
  primaryStart: string | null,
  validityExpiresAt: string | null,
  eventCreatedAt?: string | null,
): Promise<number | undefined> {
  const sql = getDb()
  const settingsRow = await sql`SELECT value FROM platform_settings WHERE key = 'validity_extensions'`
  const settings = parseValidityExtensionsSetting(settingsRow[0]?.value)

  if (!validityExpiresAt) {
    return settings.defaultDays
  }

  const startMs = primaryStart
    ? new Date(primaryStart).getTime()
    : eventCreatedAt
      ? new Date(eventCreatedAt).getTime()
      : null
  if (startMs == null || Number.isNaN(startMs)) {
    return settings.defaultDays
  }

  const expMs = new Date(validityExpiresAt).getTime()
  if (Number.isNaN(expMs)) {
    return settings.defaultDays
  }

  const days = Math.round((expMs - startMs) / 86_400_000)
  if (days === settings.defaultDays) return settings.defaultDays

  const tier = settings.extendedTiers.find((t) => t.enabled && t.days === days)
  if (tier) return tier.days

  return undefined
}
