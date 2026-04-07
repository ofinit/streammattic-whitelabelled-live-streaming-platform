import type { ValidityTier } from "@/lib/types"

export type ParsedValidityExtensions = {
  defaultDays: number
  extendedTiers: ValidityTier[]
}

function fallbackValidityExtensions(): ParsedValidityExtensions {
  return {
    defaultDays: 30,
    extendedTiers: [
      { days: 60, creditCost: 1, enabled: true, label: "60 Days (+1 credit)" },
      { days: 90, creditCost: 2, enabled: true, label: "90 Days (+2 credits)" },
      { days: 180, creditCost: 4, enabled: true, label: "180 Days (+4 credits)" },
      { days: 365, creditCost: 8, enabled: true, label: "365 Days (+8 credits)" },
    ],
  }
}

/**
 * Normalize platform_settings `validity_extensions` (and legacy shapes) into tiers + default days.
 */
export function parseValidityExtensionsSetting(raw: unknown): ParsedValidityExtensions {
  const fallback = fallbackValidityExtensions()
  if (!raw || typeof raw !== "object") return fallback

  const o = raw as Record<string, unknown>
  const defaultDays =
    typeof o.defaultDays === "number" && o.defaultDays > 0 ? o.defaultDays : fallback.defaultDays

  let list: unknown[] = []
  if (Array.isArray(o.options)) list = o.options
  else if (Array.isArray(o.extensions)) list = o.extensions
  else if (Array.isArray(o.tiers)) list = o.tiers
  else if (Array.isArray(o.extendedTiers)) list = o.extendedTiers

  const tiers = list
    .map((item): ValidityTier | null => {
      if (!item || typeof item !== "object") return null
      const t = item as Record<string, unknown>
      const days = typeof t.days === "number" ? t.days : 0
      const creditCost = typeof t.creditCost === "number" ? t.creditCost : 0
      const enabled = t.enabled !== false
      const label =
        typeof t.label === "string" && t.label.trim()
          ? t.label.trim()
          : `${days} days (+${creditCost} credit${creditCost === 1 ? "" : "s"})`
      if (days <= 0) return null
      return { days, creditCost, enabled, label }
    })
    .filter((x): x is ValidityTier => x !== null)
    .sort((a, b) => (a?.days ?? 0) - (b?.days ?? 0))

  return {
    defaultDays,
    extendedTiers: tiers, // Explicitly allow empty array if tiers exist but list is empty
  }
}

function toTimestamp(value: unknown): number | null {
  if (value == null) return null
  if (typeof value === "string") {
    const n = new Date(value).getTime()
    return Number.isNaN(n) ? null : n
  }
  if (value instanceof Date) {
    const n = value.getTime()
    return Number.isNaN(n) ? null : n
  }
  return null
}

/** `datetime-local` value from an ISO-ish expiry string */
export function validityExpiryToDatetimeLocal(expiry: unknown): string {
  if (expiry == null) return ""
  if (typeof expiry === "string") return expiry.length >= 16 ? expiry.slice(0, 16) : ""
  if (expiry instanceof Date) return expiry.toISOString().slice(0, 16)
  return ""
}

/**
 * Map stored expiry + scheduled start to UI choice (admin tiers vs custom date).
 */
export function inferValidityChoiceFromEvent(
  event: { scheduledAt?: unknown; validityExpiresAt?: unknown } | null | undefined,
  settings: ParsedValidityExtensions,
): { choiceKey: string; expiresAt: string } {
  if (!event) return { choiceKey: "none", expiresAt: "" }

  const rawValidity = (event as Record<string, unknown>).validityExpiresAt
  const expMs = toTimestamp(rawValidity)
  if (expMs == null) return { choiceKey: "none", expiresAt: "" }

  const startMs = toTimestamp(event.scheduledAt)
  if (startMs != null) {
    const days = Math.round((expMs - startMs) / 86_400_000)
    if (days === settings.defaultDays) {
      return { choiceKey: "included", expiresAt: "" }
    }
    const tier = settings.extendedTiers.find((t: ValidityTier) => t.enabled && t.days === days)
    if (tier) {
      return { choiceKey: `tier:${tier.days}`, expiresAt: "" }
    }
  }

  return {
    choiceKey: "until",
    expiresAt: validityExpiryToDatetimeLocal(rawValidity),
  }
}
