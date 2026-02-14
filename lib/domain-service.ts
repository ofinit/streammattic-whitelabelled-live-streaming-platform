import type { Domain, Reseller, Branding } from "./types"
import { mockDomains, mockResellers } from "./mock-data"

export interface DomainLookupResult {
  found: boolean
  reseller: Reseller | null
  domain: Domain | null
  branding: Branding | null
}

// Lookup reseller by custom domain
export function lookupByDomain(hostname: string): DomainLookupResult {
  const domain = mockDomains.find((d) => d.domain === hostname && d.verificationStatus === "verified")

  if (!domain) {
    return { found: false, reseller: null, domain: null, branding: null }
  }

  const reseller = mockResellers.find((r) => r.id === domain.userId)
  if (!reseller) {
    return { found: false, reseller: null, domain, branding: null }
  }

  const branding: Branding = {
    id: reseller.branding.id,
    userId: reseller.id,
    brandName: reseller.branding.platformName,
    companyLogo: reseller.branding.logo,
    themeColor: reseller.branding.primaryColor,
    accentColor: reseller.branding.secondaryColor,
    email: reseller.branding.supportEmail,
    phone: reseller.branding.supportPhone,
    termsConditions: reseller.branding.termsUrl,
    privacyPolicy: reseller.branding.privacyUrl,
    hasGatewayConfig: false,
    createdAt: reseller.createdAt,
    updatedAt: reseller.updatedAt,
  }

  return { found: true, reseller, domain, branding }
}

// Lookup reseller by subdomain
export function lookupBySubdomain(hostname: string): DomainLookupResult {
  const match = hostname.match(/^([^.]+)\.streammattic\.com$/)
  if (!match) {
    return { found: false, reseller: null, domain: null, branding: null }
  }

  const slug = match[1]
  const reseller = mockResellers.find((r) => r.branding.platformName.toLowerCase().replace(/\s+/g, "-") === slug)

  if (!reseller) {
    return { found: false, reseller: null, domain: null, branding: null }
  }

  const branding: Branding = {
    id: reseller.branding.id,
    userId: reseller.id,
    brandName: reseller.branding.platformName,
    companyLogo: reseller.branding.logo,
    themeColor: reseller.branding.primaryColor,
    accentColor: reseller.branding.secondaryColor,
    email: reseller.branding.supportEmail,
    phone: reseller.branding.supportPhone,
    termsConditions: reseller.branding.termsUrl,
    privacyPolicy: reseller.branding.privacyUrl,
    hasGatewayConfig: false,
    createdAt: reseller.createdAt,
    updatedAt: reseller.updatedAt,
  }

  return { found: true, reseller, domain: null, branding }
}

// Get all domains for a reseller
export function getResellerDomains(resellerId: string): Domain[] {
  return mockDomains.filter((d) => d.userId === resellerId)
}

// Get primary domain for a reseller
export function getPrimaryDomain(resellerId: string): Domain | null {
  return mockDomains.find((d) => d.userId === resellerId && d.isPrimary) || null
}

// Generate event URL based on domain settings
export function getEventUrl(eventId: string, resellerId?: string): string {
  if (!resellerId) {
    return `/watch/${eventId}`
  }

  const primaryDomain = getPrimaryDomain(resellerId)
  if (primaryDomain && primaryDomain.verificationStatus === "verified") {
    return `https://${primaryDomain.domain}/watch/${eventId}`
  }

  // Fallback to subdomain
  const reseller = mockResellers.find((r) => r.id === resellerId)
  if (reseller) {
    const slug = reseller.branding.platformName.toLowerCase().replace(/\s+/g, "-")
    return `https://${slug}.streammattic.com/watch/${eventId}`
  }

  return `/watch/${eventId}`
}
