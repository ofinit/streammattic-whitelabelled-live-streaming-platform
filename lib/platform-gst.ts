import { getPlatformSetting } from "@/lib/db-queries"
import type { GSTConfiguration } from "@/lib/types"

/** Stored under platform_settings key `platform_gst` */
export type PlatformGSTSettings = {
  gstEnabled: boolean
  gstPercentage: number
  gstNumber: string
  panNumber: string
  businessName: string
  businessAddress: string
  city: string
  state: string
  pincode: string
  /** Minimum amount user can request to wallet (rupees, e.g. 500) */
  minRechargeRupees: number
}

const DEFAULTS: PlatformGSTSettings = {
  gstEnabled: true,
  gstPercentage: 18,
  gstNumber: "",
  panNumber: "",
  businessName: "StreamLivee Platform Pvt Ltd",
  businessAddress: "",
  city: "",
  state: "",
  pincode: "",
  minRechargeRupees: 500,
}

export function parsePlatformGSTSettings(raw: unknown): PlatformGSTSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULTS }
  }
  const o = raw as Record<string, unknown>
  const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d)
  const str = (v: unknown, d: string) => (typeof v === "string" ? v : d)
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d)

  return {
    gstEnabled: bool(o.gstEnabled ?? o.enabled, DEFAULTS.gstEnabled),
    gstPercentage: num(o.gstPercentage ?? o.percentage, DEFAULTS.gstPercentage),
    gstNumber: str(o.gstNumber ?? o.gstin, DEFAULTS.gstNumber),
    panNumber: str(o.panNumber, DEFAULTS.panNumber),
    businessName: str(o.businessName ?? o.companyName, DEFAULTS.businessName),
    businessAddress: str(o.businessAddress, DEFAULTS.businessAddress),
    city: str(o.city, DEFAULTS.city),
    state: str(o.state, DEFAULTS.state),
    pincode: str(o.pincode, DEFAULTS.pincode),
    minRechargeRupees: Math.max(1, Math.round(num(o.minRechargeRupees, DEFAULTS.minRechargeRupees))),
  }
}

export async function getPlatformGSTSettings(): Promise<PlatformGSTSettings> {
  const raw = await getPlatformSetting("platform_gst")
  return parsePlatformGSTSettings(raw)
}

/** Satisfies `calculatePriceBreakdown` from gst-service */
export function toGSTCalculationConfig(settings: PlatformGSTSettings): GSTConfiguration | null {
  if (!settings.gstEnabled) return null
  const now = new Date()
  return {
    id: "platform",
    entityId: "platform",
    entityType: "admin",
    gstEnabled: true,
    gstPercentage: settings.gstPercentage,
    gstNumber: settings.gstNumber || undefined,
    panNumber: settings.panNumber || undefined,
    businessName: settings.businessName,
    businessAddress: settings.businessAddress,
    city: settings.city,
    state: settings.state,
    pincode: settings.pincode,
    createdAt: now,
    updatedAt: now,
  }
}
