import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withRole } from "@/lib/api-helpers"
import { invalidateCache } from "@/lib/redis"

export type StudioSetupDraft = {
  currentStep?: number
  companyData?: Record<string, unknown>
  brandingData?: Record<string, unknown>
  domainData?: Record<string, unknown>
  paymentData?: Record<string, unknown>
}

function mergeDraft(prev: Record<string, unknown> | null, patch: StudioSetupDraft): Record<string, unknown> {
  const base = { ...(prev || {}) }
  if (patch.currentStep !== undefined) base.currentStep = patch.currentStep
  if (patch.companyData) base.companyData = { ...((base.companyData as object) || {}), ...patch.companyData }
  if (patch.brandingData) base.brandingData = { ...((base.brandingData as object) || {}), ...patch.brandingData }
  if (patch.domainData) base.domainData = { ...((base.domainData as object) || {}), ...patch.domainData }
  if (patch.paymentData) base.paymentData = { ...((base.paymentData as object) || {}), ...patch.paymentData }
  return base
}

export const GET = withRole(["studio", "streamer", "admin"], async (user, request) => {
  try {
    const sql = getDb()
    const url = new URL(request.url)
    const searchUserId = url.searchParams.get("userId")
    const userId = (user.role === "admin" && searchUserId) ? searchUserId : (user.id as string)
    const rows = await sql`
      SELECT setup_wizard_draft, setup_completed_at, platform_name, tagline, support_email, support_phone, primary_color, secondary_color, logo, favicon
      FROM studio_branding
      WHERE user_id = ${userId}
      LIMIT 1
    `
    const userRows = await sql`
      SELECT name, email, phone FROM users WHERE id = ${userId} LIMIT 1
    `

    const userRow = userRows[0] as Record<string, unknown> | undefined
    const brandingRow = rows[0] as Record<string, unknown> | undefined

    const defaultCompanyData = {
      companyName: (brandingRow?.platform_name as string) || (userRow?.name as string) || "",
      tagline: (brandingRow?.tagline as string) || "",
      email: (brandingRow?.support_email as string) || (userRow?.email as string) || "",
      phoneLocal: (brandingRow?.support_phone as string) || (userRow?.phone as string) || "",
      phoneDialCode: "+91",
    }

    const defaultBrandingData = {
      platformName: (brandingRow?.platform_name as string) || (userRow?.name as string) || "",
      logo: (brandingRow?.logo as string) || "",
      favicon: (brandingRow?.favicon as string) || "",
      primaryColor: (brandingRow?.primary_color as string) || "#10b981",
      secondaryColor: (brandingRow?.secondary_color as string) || "#059669",
    }

    const draft = brandingRow?.setup_wizard_draft as Record<string, unknown> | null
    const at = brandingRow?.setup_completed_at
    const setupCompletedAt =
      at instanceof Date ? at.toISOString() : typeof at === "string" ? at : null

    return jsonOk({ draft: draft ?? null, setupCompletedAt, defaultCompanyData, defaultBrandingData })
  } catch (err) {
    console.error("Studio setup GET Error:", err)
    return jsonError("Failed to load setup draft", 500)
  }
})

export const PATCH = withRole(["studio", "streamer", "admin"], async (user, request) => {
  try {
    const body = (await request.json()) as StudioSetupDraft & { userId?: string }
    const sql = getDb()
    const url = new URL(request.url)
    const searchUserId = url.searchParams.get("userId")
    const userId = (user.role === "admin" && (body.userId || searchUserId))
      ? (body.userId || searchUserId)!
      : (user.id as string)

    const existingRows = await sql`
      SELECT setup_wizard_draft FROM studio_branding WHERE user_id = ${userId} LIMIT 1
    `
    const prev =
      existingRows.length > 0
        ? ((existingRows[0] as Record<string, unknown>).setup_wizard_draft as Record<string, unknown> | null)
        : null

    const merged = mergeDraft(prev, body)
    const draftJson = JSON.stringify(merged)

    await sql`
      INSERT INTO studio_branding (user_id, platform_name, setup_wizard_draft, updated_at)
      VALUES (${userId}, 'My Studio', ${draftJson}::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        setup_wizard_draft = ${draftJson}::jsonb,
        updated_at = NOW()
    `

    await invalidateCache(`studio_branding:${userId}`)
    return jsonOk({ ok: true })
  } catch (err) {
    console.error("Studio setup PATCH Error:", err)
    return jsonError("Failed to save setup draft", 500)
  }
})

export const POST = withRole(["studio", "streamer", "admin"], async (user, request) => {
  try {
    const body = await request.json()
    const { 
      companyData, 
      brandingData, 
      domainData, 
      paymentData,
      userId: bodyUserId
    } = body

    const sql = getDb()
    const url = new URL(request.url)
    const searchUserId = url.searchParams.get("userId")
    const userId = (user.role === "admin" && (bodyUserId || searchUserId))
      ? (bodyUserId || searchUserId)!
      : (user.id as string)

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
        preferred_gateway, selected_theme, updated_at
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
        ${(companyData as { address?: string | null }).address ?? null},
        ${paymentData.gateway || null},
        ${brandingData.selectedTheme || 'modern_emerald'},
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
        selected_theme = COALESCE(${brandingData.selectedTheme ?? null}, studio_branding.selected_theme),
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
          user_id = EXCLUDED.user_id,
          verification_token = EXCLUDED.verification_token,
          verification_status = 'pending',
          is_primary = EXCLUDED.is_primary
      `
    }

    await sql`
      UPDATE studio_branding
      SET setup_wizard_draft = NULL, setup_completed_at = NOW(), updated_at = NOW()
      WHERE user_id = ${userId}
    `

    // Invalidate branding cache
    await invalidateCache(`studio_branding:${userId}`)

    return jsonOk({ message: "Setup completed successfully" })
  } catch (err) {
    console.error("Studio Setup API Error:", err)
    const detail = err instanceof Error ? err.message : "Failed to complete setup"
    return jsonError(
      process.env.NODE_ENV === "development" ? detail : "Failed to complete setup",
      500,
    )
  }
})
