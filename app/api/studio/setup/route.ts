import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withRole } from "@/lib/api-helpers"
import { invalidateCache } from "@/lib/redis"
import { encrypt } from "@/lib/encryption"

export const POST = withRole(["studio"], async (user, request) => {
  try {
    const body = await request.json()
    const { 
      companyData, 
      brandingData, 
      domainData, 
      paymentData 
    } = body

    const sql = getDb()
    const userId = user.id as string

    // 1. Update User Profile (Name)
    if (companyData.companyName) {
      await sql`UPDATE users SET name = ${companyData.companyName} WHERE id = ${userId}`
    }

    // 2. Update Studio Branding
    // We reuse the logic from /api/branding but consolidated here for the wizard
    await sql`
      INSERT INTO studio_branding (
        user_id, logo, favicon, primary_color, secondary_color, 
        platform_name, tagline, support_email, support_phone, address,
        preferred_gateway, updated_at
      )
      VALUES (
        ${userId}, 
        ${brandingData.logo || null}, 
        ${brandingData.favicon || null}, 
        ${brandingData.primaryColor || null}, 
        ${brandingData.secondaryColor || null}, 
        ${brandingData.platformName || null}, 
        ${companyData.tagline || null}, 
        ${companyData.email || null}, 
        ${companyData.phone || null}, 
        ${companyData.address || null},
        ${paymentData.gateway || null},
        NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        logo = COALESCE(${brandingData.logo ?? null}, studio_branding.logo),
        favicon = COALESCE(${brandingData.favicon ?? null}, studio_branding.favicon),
        primary_color = COALESCE(${brandingData.primaryColor ?? null}, studio_branding.primary_color),
        secondary_color = COALESCE(${brandingData.secondaryColor ?? null}, studio_branding.secondary_color),
        platform_name = COALESCE(${brandingData.platformName ?? null}, studio_branding.platform_name),
        tagline = COALESCE(${companyData.tagline ?? null}, studio_branding.tagline),
        support_email = COALESCE(${companyData.email ?? null}, studio_branding.support_email),
        support_phone = COALESCE(${companyData.phone ?? null}, studio_branding.support_phone),
        address = COALESCE(${companyData.address ?? null}, studio_branding.address),
        preferred_gateway = COALESCE(${paymentData.gateway ?? null}, studio_branding.preferred_gateway),
        updated_at = NOW()
    `

    // 3. Handle Domain
    if (domainData.customDomain && !domainData.skipDomain) {
      const domain = domainData.customDomain.trim().toLowerCase()
      const verificationToken = `streamlivee-verify-${Math.random().toString(36).substring(2, 34)}`
      
      await sql`
        INSERT INTO domains (user_id, domain, verification_token, verification_status, is_primary)
        VALUES (${userId}, ${domain}, ${verificationToken}, 'pending', true)
        ON CONFLICT (domain) DO UPDATE SET 
          user_id = ${userId},
          verification_token = EXCLUDED.verification_token,
          updated_at = NOW()
      `
    }

    // Invalidate branding cache
    await invalidateCache(`studio_branding:${userId}`)

    return jsonOk({ message: "Setup completed successfully" })
  } catch (err) {
    console.error("Studio Setup API Error:", err)
    return jsonError("Failed to complete setup")
  }
})
