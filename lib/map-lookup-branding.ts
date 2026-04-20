/**
 * Maps GET /api/branding/lookup payloads (camelCase studio_branding row) to Branding.
 */
import type {
  Branding,
  BrandingDifferentiator,
  BrandingEventType,
  BrandingGalleryImage,
  BrandingService,
  BrandingStat,
  BrandingTestimonial,
} from "@/lib/types"
import { resolvePlatformDisplayName } from "@/lib/platform-display-name"

const defaultBrandingBase = (): Pick<Branding, "hasGatewayConfig" | "createdAt" | "updatedAt"> => ({
  hasGatewayConfig: false,
  createdAt: new Date(),
  updatedAt: new Date(),
})

function parseJsonArray<T>(v: unknown): T[] | undefined {
  if (Array.isArray(v)) return v as T[]
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v) as unknown
      return Array.isArray(p) ? (p as T[]) : undefined
    } catch {
      return undefined
    }
  }
  return undefined
}

/** Normalize services from JSONB: missing `enabled` means on; ensure required fields for UI */
function mapServicesFromRow(raw: unknown): BrandingService[] | undefined {
  const arr = parseJsonArray<BrandingService>(raw)
  if (arr == null) return undefined
  if (arr.length === 0) return []
  return arr.map((s, i) => ({
    id: typeof s.id === "string" && s.id.trim() ? s.id : `svc-${i}`,
    title: typeof s.title === "string" ? s.title : "Service",
    description: typeof s.description === "string" ? s.description : "",
    icon: typeof s.icon === "string" && s.icon ? s.icon : "Camera",
    enabled: s.enabled === false ? false : true,
  }))
}

/** Studio row from lookup (toCamel) + userId from domains join */
export function studioLookupRowToBranding(raw: Record<string, unknown>, userId: string): Branding {
  const id = typeof raw.id === "string" ? raw.id : userId
  const brandName = resolvePlatformDisplayName(
    raw.platformName ?? raw.brandName,
    "Studio",
  )
  const base = defaultBrandingBase()
  return {
    ...base,
    id,
    userId,
    brandName,
    companyLogo: (raw.logo || raw.companyLogo) as string | undefined,
    companyLogoDark: raw.companyLogoDark as string | undefined,
    favicon: raw.favicon as string | undefined,
    themeColor: (raw.primaryColor || raw.themeColor || "#10b981") as string,
    accentColor: (raw.secondaryColor || raw.accentColor || "#059669") as string,
    email: (raw.supportEmail || raw.email) as string | undefined,
    phone: (raw.supportPhone || raw.phone) as string | undefined,
    whatsapp: raw.whatsapp as string | undefined,
    address: raw.address as string | undefined,
    facebookUrl: raw.facebookUrl as string | undefined,
    instagramUrl: raw.instagramUrl as string | undefined,
    twitterUrl: raw.twitterUrl as string | undefined,
    youtubeUrl: raw.youtubeUrl as string | undefined,
    linkedinUrl: raw.linkedinUrl as string | undefined,
    metaTitle: raw.metaTitle as string | undefined,
    metaDescription: raw.metaDescription as string | undefined,
    googleAnalyticsId: raw.googleAnalyticsId as string | undefined,
    aboutUs: raw.aboutUs as string | undefined,
    termsConditions: raw.termsConditions as string | undefined,
    privacyPolicy: raw.privacyPolicy as string | undefined,
    refundPolicy: raw.refundPolicy as string | undefined,
    heroImage: raw.heroImage as string | undefined,
    aboutImage: raw.aboutImage as string | undefined,
    services: mapServicesFromRow(raw.services),
    eventTypes: parseJsonArray<BrandingEventType>(raw.eventTypes),
    stats: parseJsonArray<BrandingStat>(raw.stats),
    testimonials: parseJsonArray<BrandingTestimonial>(raw.testimonials),
    galleryImages: parseJsonArray<BrandingGalleryImage>(raw.galleryImages),
    differentiators: parseJsonArray<BrandingDifferentiator>(raw.differentiators),
    ctaBannerTitle: raw.ctaBannerTitle as string | undefined,
    ctaBannerSubtitle: raw.ctaBannerSubtitle as string | undefined,
    ctaBannerButtonText: raw.ctaBannerButtonText as string | undefined,
    ctaBannerButtonUrl: raw.ctaBannerButtonUrl as string | undefined,
    selectedTheme: raw.selectedTheme as Branding["selectedTheme"],
    preferredGateway: raw.preferredGateway as Branding["preferredGateway"],
    hasGatewayConfig: Boolean(raw.preferredGateway),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt : new Date(),
  }
}

/** Platform fallback from lookup when isWhiteLabel is false */
export function platformLookupBrandingToBranding(raw: Record<string, unknown>): Branding {
  const base = defaultBrandingBase()
  return {
    id: "platform",
    userId: "platform",
    brandName: resolvePlatformDisplayName(raw.brandName ?? raw.platformName, "StreamLivee"),
    companyLogo: raw.companyLogo as string | undefined,
    themeColor: (raw.themeColor || "#10b981") as string,
    accentColor: (raw.accentColor || "#059669") as string,
    email: (raw.supportEmail || raw.email) as string | undefined,
    metaTitle: (raw.metaTitle as string) || "StreamLivee - White-Label Live Streaming Platform",
    metaDescription:
      (raw.metaDescription as string) || "Multi-tenant live streaming platform for studios and content creators",
    hasGatewayConfig: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
