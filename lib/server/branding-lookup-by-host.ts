/**
 * Shared branding resolution by hostname (used by /api/branding/lookup and RootLayout)
 * so the first paint can match the studio white-label site without a client fetch flash.
 */
import { getDb, toCamel } from "@/lib/db"
import { resolvePlatformDisplayName } from "@/lib/platform-display-name"

export type BrandingLookupPayload =
  | { isWhiteLabel: true; branding: Record<string, unknown>; userId: string }
  | { isWhiteLabel: false; branding: Record<string, unknown> }

export async function getBrandingLookupByHost(hostname: string): Promise<BrandingLookupPayload> {
  const sql = getDb()
  const hostNorm = hostname.trim().toLowerCase()
  const wwwAlternate = hostNorm.startsWith("www.") ? hostNorm.slice(4) : `www.${hostNorm}`

  const domains = await sql`
    SELECT * FROM domains 
    WHERE verification_status IN ('verified', 'pending')
    AND (LOWER(domain) = ${hostNorm} OR LOWER(domain) = ${wwwAlternate})
  `

  if (domains.length > 0) {
    const userId = domains[0].user_id as string
    const branding = await sql`SELECT * FROM studio_branding WHERE user_id = ${userId}`
    if (branding.length > 0) {
      return {
        isWhiteLabel: true,
        branding: toCamel(branding[0] as Record<string, unknown>),
        userId,
      }
    }
  }

  const subdomainMatch = hostNorm.match(/^([^.]+)\.streamlivee\.com$/)
  if (subdomainMatch) {
    const slug = subdomainMatch[1]
    const brandingBySlug = await sql`
      SELECT * FROM studio_branding 
      WHERE LOWER(REPLACE(platform_name, ' ', '-')) = ${slug}
    `
    if (brandingBySlug.length > 0) {
      return {
        isWhiteLabel: true,
        branding: toCamel(brandingBySlug[0] as Record<string, unknown>),
        userId: brandingBySlug[0].user_id as string,
      }
    }
  }

  const platformSettings = await sql`SELECT key, value FROM platform_settings`
  const settings: Record<string, unknown> = {}
  platformSettings.forEach((row: { key: string; value: unknown }) => {
    settings[row.key] = row.value
  })

  return {
    isWhiteLabel: false,
    branding: {
      brandName: resolvePlatformDisplayName(settings.platform_name),
      themeColor: settings.primary_color || "#10b981",
      companyLogo: settings.platform_logo || "/icon.svg",
      supportEmail: settings.support_email || "support@streamlivee.com",
    },
  }
}
