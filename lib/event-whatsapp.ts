/**
 * Floating WhatsApp button on event watch pages.
 *
 * Per-event config lives in `events.template_data.whatsapp`. When an event has no number of its own,
 * the watch page falls back to the owner's number (studio branding WhatsApp → support phone → account phone),
 * so existing events get the button without being edited. `enabled: false` hides it for that event.
 */

export type EventWhatsAppConfig = {
  enabled?: boolean
  /** Dialing code digits without "+", e.g. "91" */
  countryCode?: string
  /** Local number as entered (non-digits are ignored) */
  number?: string
}

export const DEFAULT_WHATSAPP_COUNTRY_CODE = "91"

export const WHATSAPP_COUNTRY_CODES: { code: string; label: string }[] = [
  { code: "91", label: "India" },
  { code: "1", label: "USA / Canada" },
  { code: "44", label: "United Kingdom" },
  { code: "971", label: "UAE" },
  { code: "966", label: "Saudi Arabia" },
  { code: "974", label: "Qatar" },
  { code: "965", label: "Kuwait" },
  { code: "968", label: "Oman" },
  { code: "973", label: "Bahrain" },
  { code: "65", label: "Singapore" },
  { code: "60", label: "Malaysia" },
  { code: "61", label: "Australia" },
  { code: "64", label: "New Zealand" },
  { code: "977", label: "Nepal" },
  { code: "94", label: "Sri Lanka" },
  { code: "880", label: "Bangladesh" },
  { code: "49", label: "Germany" },
  { code: "33", label: "France" },
  { code: "27", label: "South Africa" },
  { code: "254", label: "Kenya" },
]

const KNOWN_CODES_LONGEST_FIRST = WHATSAPP_COUNTRY_CODES.map((c) => c.code).sort((a, b) => b.length - a.length)

function digitsOnly(v: unknown): string {
  return typeof v === "string" ? v.replace(/\D/g, "") : ""
}

export function parseEventWhatsAppConfig(raw: unknown): EventWhatsAppConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const r = raw as Record<string, unknown>
  const out: EventWhatsAppConfig = {}
  if (typeof r.enabled === "boolean") out.enabled = r.enabled
  if (typeof r.countryCode === "string" && digitsOnly(r.countryCode)) out.countryCode = digitsOnly(r.countryCode)
  if (typeof r.number === "string") out.number = r.number
  return out
}

/** Split a free-form stored phone ("+91 98765 43210", "09876543210", "9876543210") into code + local number. */
export function splitPhoneNumber(raw: string | null | undefined): { countryCode: string; number: string } {
  const trimmed = (raw ?? "").trim()
  let digits = digitsOnly(trimmed)
  const hasIntlPrefix = trimmed.startsWith("+") || digits.startsWith("00")
  if (digits.startsWith("00")) digits = digits.slice(2)

  if (!hasIntlPrefix) {
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1)
    if (digits.length <= 10) return { countryCode: DEFAULT_WHATSAPP_COUNTRY_CODE, number: digits }
  }
  for (const code of KNOWN_CODES_LONGEST_FIRST) {
    if (digits.startsWith(code) && digits.length - code.length >= 6) {
      return { countryCode: code, number: digits.slice(code.length) }
    }
  }
  return { countryCode: DEFAULT_WHATSAPP_COUNTRY_CODE, number: digits }
}

/** Full international number for wa.me (digits only), or null when it is not plausible. */
export function toWhatsAppDigits(countryCode: string | undefined, number: string | undefined): string | null {
  const cc = digitsOnly(countryCode) || DEFAULT_WHATSAPP_COUNTRY_CODE
  const local = digitsOnly(number).replace(/^0+/, "")
  if (!local) return null
  const full = cc + local
  return full.length >= 8 && full.length <= 15 ? full : null
}

/** Validation message for the event form, or null when the number is usable (or left empty). */
export function whatsAppNumberError(countryCode: string | undefined, number: string | undefined): string | null {
  if (!digitsOnly(number)) return null
  return toWhatsAppDigits(countryCode, number) ? null : "Enter a valid WhatsApp number"
}

/** Number the watch page should use: the event's own number, else the owner's default; null hides the button. */
export function resolveEventWhatsAppDigits(eventConfigRaw: unknown, ownerRawPhone: string | null | undefined): string | null {
  const cfg = parseEventWhatsAppConfig(eventConfigRaw)
  if (cfg.enabled === false) return null
  if (digitsOnly(cfg.number)) return toWhatsAppDigits(cfg.countryCode, cfg.number)
  if (!ownerRawPhone) return null
  const owner = splitPhoneNumber(ownerRawPhone)
  return toWhatsAppDigits(owner.countryCode, owner.number)
}

export function buildEventWhatsAppLink(digits: string, eventTitle: string, eventUrl: string): string {
  const title = eventTitle.trim()
  const message = title
    ? `Hi! I'm reaching out about "${title}".\n${eventUrl}`
    : `Hi! I'm reaching out about your event.\n${eventUrl}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/** Owner's best contact number (studio branding WhatsApp → support phone → account phone), raw as stored. */
export async function getOwnerWhatsAppRaw(
  sql: (text: string, params: unknown[]) => Promise<Record<string, unknown>[]>,
  userId: string,
): Promise<string | null> {
  const rows = await sql(
    `SELECT COALESCE(NULLIF(TRIM(sb.whatsapp), ''), NULLIF(TRIM(sb.support_phone), ''), NULLIF(TRIM(u.phone), '')) AS raw
     FROM users u LEFT JOIN studio_branding sb ON sb.user_id = u.id
     WHERE u.id = $1`,
    [userId],
  )
  const raw = rows[0]?.raw
  return typeof raw === "string" && raw.trim() ? raw.trim() : null
}
