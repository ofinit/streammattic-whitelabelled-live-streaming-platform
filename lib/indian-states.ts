/** Indian states and union territories — codes used in `users.billing_state` and billing profile. */

export type IndianStateCode = (typeof INDIAN_STATES_AND_UT)[number]["code"]

export const INDIAN_STATES_AND_UT = [
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CG", name: "Chhattisgarh" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OD", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TS", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UK", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "CH", name: "Chandigarh" },
  { code: "DH", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "PY", name: "Puducherry" },
] as const

const CODE_SET = new Set(INDIAN_STATES_AND_UT.map((s) => s.code))

export function isValidIndianStateCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string") return false
  return CODE_SET.has(code.trim().toUpperCase() as IndianStateCode)
}

export function getIndianStateName(code: string | null | undefined): string | null {
  if (!code) return null
  const row = INDIAN_STATES_AND_UT.find((s) => s.code === code.trim().toUpperCase())
  return row?.name ?? null
}

/** Normalize + strip +91 prefix; require 10 digits starting 6-9. */
export function normalizeIndianMobile(input: string): string | null {
  let d = input.trim().replace(/\s/g, "")
  if (d.startsWith("+91")) d = d.slice(3)
  if (d.startsWith("91") && d.length === 12) d = d.slice(2)
  if (!/^[6-9]\d{9}$/.test(d)) return null
  return d
}

/** Optional GSTIN: 15 chars, alphanumeric, basic pattern. */
export function isValidGstinFormat(gstin: string): boolean {
  const s = gstin.trim().toUpperCase()
  if (s.length !== 15) return false
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(s)
}

export type GstProfileType = "individual" | "business_registered" | "business_unregistered"
