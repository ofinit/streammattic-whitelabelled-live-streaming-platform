import type { Domain, Studio, Branding } from "./types"
import { mockDomains, mockStudios } from "./mock-data"

export interface DomainLookupResult {
  found: boolean
  studio: Studio | null
  domain: Domain | null
  branding: Branding | null
}

// Lookup studio by custom domain
export function lookupByDomain(hostname: string): DomainLookupResult {
  const domain = mockDomains.find((d) => d.domain === hostname && d.verificationStatus === "verified")

  if (!domain) {
    return { found: false, studio: null, domain: null, branding: null }
  }

  const studio = mockStudios.find((r) => r.id === domain.userId)
  if (!studio) {
    return { found: false, studio: null, domain, branding: null }
  }

  const branding: Branding = {
    id: studio.branding.id,
    userId: studio.id,
    brandName: studio.branding.platformName,
    companyLogo: studio.branding.logo,
    themeColor: studio.branding.primaryColor,
    accentColor: studio.branding.secondaryColor,
    email: studio.branding.supportEmail,
    phone: studio.branding.supportPhone,
    termsConditions: studio.branding.termsUrl,
    privacyPolicy: studio.branding.privacyUrl,
    hasGatewayConfig: false,
    createdAt: studio.createdAt,
    updatedAt: studio.updatedAt,
  }

  return { found: true, studio, domain, branding }
}

// Lookup studio by subdomain
export function lookupBySubdomain(hostname: string): DomainLookupResult {
  const match = hostname.match(/^([^.]+)\.streammattic\.com$/)
  if (!match) {
    return { found: false, studio: null, domain: null, branding: null }
  }

  const slug = match[1]
  const studio = mockStudios.find((r) => r.branding.platformName.toLowerCase().replace(/\s+/g, "-") === slug)

  if (!studio) {
    return { found: false, studio: null, domain: null, branding: null }
  }

  const branding: Branding = {
    id: studio.branding.id,
    userId: studio.id,
    brandName: studio.branding.platformName,
    companyLogo: studio.branding.logo,
    themeColor: studio.branding.primaryColor,
    accentColor: studio.branding.secondaryColor,
    email: studio.branding.supportEmail,
    phone: studio.branding.supportPhone,
    termsConditions: studio.branding.termsUrl,
    privacyPolicy: studio.branding.privacyUrl,
    hasGatewayConfig: false,
    createdAt: studio.createdAt,
    updatedAt: studio.updatedAt,
  }

  return { found: true, studio, domain: null, branding }
}

// Get all domains for a studio
export function getStudioDomains(studioId: string): Domain[] {
  return mockDomains.filter((d) => d.userId === studioId)
}

// Get primary domain for a studio
export function getPrimaryDomain(studioId: string): Domain | null {
  return mockDomains.find((d) => d.userId === studioId && d.isPrimary) || null
}

// Generate event URL based on domain settings
export function getEventUrl(eventId: string, studioId?: string): string {
  if (!studioId) {
    return `/watch/${eventId}`
  }

  const primaryDomain = getPrimaryDomain(studioId)
  if (primaryDomain && primaryDomain.verificationStatus === "verified") {
    return `https://${primaryDomain.domain}/watch/${eventId}`
  }

  // Fallback to subdomain
  const studio = mockStudios.find((r) => r.id === studioId)
  if (studio) {
    const slug = studio.branding.platformName.toLowerCase().replace(/\s+/g, "-")
    return `https://${slug}.streammattic.com/watch/${eventId}`
  }

  return `/watch/${eventId}`
}
