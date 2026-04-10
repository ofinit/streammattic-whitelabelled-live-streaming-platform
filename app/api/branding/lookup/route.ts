import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError } from "@/lib/api-helpers"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hostname =
    searchParams.get("hostname") || searchParams.get("w") || searchParams.get("host")

  if (!hostname) {
    return jsonError("Hostname required")
  }

  const sql = getDb()
  const hostNorm = hostname.trim().toLowerCase()

  // 1. Try to find by custom domain (table is `domains`, not studio_domains)
  const domains = await sql`
    SELECT * FROM domains 
    WHERE LOWER(domain) = ${hostNorm} AND verification_status = 'verified'
  `
  
  if (domains.length > 0) {
    const userId = domains[0].user_id
    const branding = await sql`SELECT * FROM studio_branding WHERE user_id = ${userId}`
    if (branding.length > 0) {
      return jsonOk({ 
        isWhiteLabel: true,
        branding: toCamel(branding[0] as Record<string, unknown>),
        userId
      })
    }
  }

  // 2. Try to find by subdomain {slug}.streamlivee.com
  const subdomainMatch = hostNorm.match(/^([^.]+)\.streamlivee\.com$/)
  if (subdomainMatch) {
    const slug = subdomainMatch[1]
    // In our simplified model, the slug is stored in platform_name (slugified) or we might need a slug field.
    // Let's assume we have a slug field in studio_branding if we want proper lookups,
    // OR we just search by a platform_name derivative.
    // For now, let's search for a studio with that slug in their branding.
    
    const brandingBySlug = await sql`
      SELECT * FROM studio_branding 
      WHERE LOWER(REPLACE(platform_name, ' ', '-')) = ${slug}
    `
    
    if (brandingBySlug.length > 0) {
      return jsonOk({
        isWhiteLabel: true,
        branding: toCamel(brandingBySlug[0] as Record<string, unknown>),
        userId: brandingBySlug[0].user_id
      })
    }
  }

  // 3. Fallback to platform settings
  const platformSettings = await sql`SELECT key, value FROM platform_settings`
  const settings: Record<string, any> = {}
  platformSettings.forEach(row => {
    settings[row.key] = row.value
  })

  return jsonOk({
    isWhiteLabel: false,
    branding: {
      brandName: settings.platform_name || "StreamLivee",
      themeColor: settings.primary_color || "#10b981",
      companyLogo: settings.platform_logo || "/placeholder.svg?height=40&width=200",
      supportEmail: settings.support_email || "support@streamlivee.com",
    }
  })
}
