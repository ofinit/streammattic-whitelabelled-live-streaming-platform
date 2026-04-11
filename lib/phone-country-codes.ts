/**
 * Common dial codes for support-phone UI (studio setup, etc.).
 * Sorted by dial length descending in {@link parseStoredPhone} for prefix matching.
 */
export type PhoneDialOption = { iso: string; name: string; dial: string }

/** Unicode regional-indicator flag emoji from ISO 3166-1 alpha-2 (e.g. IN → 🇮🇳). */
export function flagEmojiFromIso(iso: string): string {
  const code = iso.trim().toUpperCase()
  if (code.length !== 2 || !/^[A-Z]{2}$/.test(code)) return ""
  const base = 0x1f1e6
  const a = "A".charCodeAt(0)
  return String.fromCodePoint(base + (code.charCodeAt(0) - a), base + (code.charCodeAt(1) - a))
}

export const PHONE_DIAL_OPTIONS: PhoneDialOption[] = [
  { iso: "IN", name: "India", dial: "+91" },
  { iso: "US", name: "United States / Canada", dial: "+1" },
  { iso: "GB", name: "United Kingdom", dial: "+44" },
  { iso: "AU", name: "Australia", dial: "+61" },
  { iso: "DE", name: "Germany", dial: "+49" },
  { iso: "FR", name: "France", dial: "+33" },
  { iso: "SG", name: "Singapore", dial: "+65" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971" },
  { iso: "SA", name: "Saudi Arabia", dial: "+966" },
  { iso: "JP", name: "Japan", dial: "+81" },
  { iso: "BR", name: "Brazil", dial: "+55" },
  { iso: "MX", name: "Mexico", dial: "+52" },
  { iso: "ZA", name: "South Africa", dial: "+27" },
  { iso: "NZ", name: "New Zealand", dial: "+64" },
]

const BY_DIAL_LONGEST_FIRST = [...PHONE_DIAL_OPTIONS].sort((a, b) => b.dial.length - a.dial.length)

/** Full support string stored in DB / invoices, e.g. "+91 8322772776" */
export function composeInternationalPhone(dialCode: string, local: string): string {
  const dial = dialCode.trim().startsWith("+") ? dialCode.trim() : `+${dialCode.trim()}`
  const digits = local.replace(/\D/g, "")
  if (!digits) return ""
  return `${dial} ${digits}`
}

/** Split a stored phone into dial + local digits; defaults India (+91). */
export function parseStoredPhone(stored: string): { dial: string; local: string } {
  const s = stored.trim().replace(/\s+/g, " ")
  if (!s) return { dial: "+91", local: "" }
  if (!s.startsWith("+")) {
    return { dial: "+91", local: s.replace(/\D/g, "") }
  }
  const compact = s.replace(/\s/g, "")
  for (const o of BY_DIAL_LONGEST_FIRST) {
    const d = o.dial
    if (compact.startsWith(d)) {
      const rest = compact.slice(d.length).replace(/\D/g, "")
      return { dial: d, local: rest }
    }
  }
  const digitsOnly = compact.slice(1).replace(/\D/g, "")
  return { dial: "+91", local: digitsOnly }
}
