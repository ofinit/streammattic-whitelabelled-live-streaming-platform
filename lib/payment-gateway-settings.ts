import { getPlatformSetting } from "@/lib/db-queries"

export type PaymentGatewayFlags = {
  razorpay: boolean
  instamojo: boolean
}

const DEFAULT_FLAGS: PaymentGatewayFlags = { razorpay: true, instamojo: true }

/**
 * Reads platform_settings.payment_gateways JSON.
 * Each gateway is enabled unless explicitly `{ enabled: false }`.
 * Missing setting or malformed JSON → both enabled (backward compatible).
 */
export function parsePaymentGateways(raw: unknown): PaymentGatewayFlags {
  if (raw == null) return { ...DEFAULT_FLAGS }

  let obj: Record<string, unknown>
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>
    } catch {
      return { ...DEFAULT_FLAGS }
    }
  } else if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    obj = raw as Record<string, unknown>
  } else {
    return { ...DEFAULT_FLAGS }
  }

  const gate = (key: "razorpay" | "instamojo"): boolean => {
    const v = obj[key]
    if (v == null || typeof v !== "object" || Array.isArray(v)) return true
    const enabled = (v as Record<string, unknown>).enabled
    if (enabled === false) return false
    return true
  }

  return {
    razorpay: gate("razorpay"),
    instamojo: gate("instamojo"),
  }
}

export async function getPaymentGatewayFlags(): Promise<PaymentGatewayFlags> {
  const raw = await getPlatformSetting("payment_gateways")
  return parsePaymentGateways(raw)
}
