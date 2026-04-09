import type { EventValiditySettings, ValidityTier } from "@/lib/types"

export type ParsedValidityExtensions = {
  defaultDays: number
  extendedTiers: ValidityTier[]
}

/** Total stream-type credits for validity duration (1 per default-day block, e.g. 30-day blocks). */
export function validityCreditsForDuration(validityDays: number, defaultDays: number): number {
  const d = Math.max(1, Math.floor(Number(validityDays)) || 1)
  const block = Math.max(1, Math.floor(Number(defaultDays)) || 1)
  return Math.ceil(d / block)
}

/** Extra credits beyond the first default-day block (for labels and admin “extension” column). */
export function validityExtensionCredits(totalDays: number, defaultDays: number): number {
  return Math.max(0, validityCreditsForDuration(totalDays, defaultDays) - 1)
}

/**
 * Tier / dropdown line: total stream-type credits for this validity length (validity only; extra event dates billed separately).
 */
export function formatValidityTierSelectLabel(totalDays: number, defaultDays: number): string {
  const total = validityCreditsForDuration(totalDays, defaultDays)
  return `${totalDays} Days (${total} credit${total === 1 ? "" : "s"} total)`
}

export function getDefaultEventValiditySettings(): EventValiditySettings {
  const f = fallbackValidityExtensions()
  return { defaultDays: f.defaultDays, extendedTiers: f.extendedTiers }
}

function fallbackValidityExtensions(): ParsedValidityExtensions {
  const defaultDays = 30
  const mk = (days: number): ValidityTier => {
    const ext = validityExtensionCredits(days, defaultDays)
    return {
      days,
      creditCost: ext,
      enabled: true,
      label: formatValidityTierSelectLabel(days, defaultDays),
    }
  }
  return {
    defaultDays,
    extendedTiers: [mk(60), mk(90), mk(180), mk(365)],
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
      const enabled = t.enabled !== false
      if (days <= 0) return null
      const creditCost = validityExtensionCredits(days, defaultDays)
      const label = formatValidityTierSelectLabel(days, defaultDays)
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
  if (!event) return { choiceKey: "included", expiresAt: "" }

  const rawValidity = (event as Record<string, unknown>).validityExpiresAt
  const expMs = toTimestamp(rawValidity)
  if (expMs == null) return { choiceKey: "included", expiresAt: "" }

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
