import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId") || user.id as string
  const sql = getDb()

  const rows = await sql`SELECT * FROM studio_branding WHERE user_id = ${userId}`
  if (rows.length === 0) return jsonOk({ branding: null })
  return jsonOk({ branding: toCamel(rows[0] as Record<string, unknown>) })
})

export const PUT = withAuth(async (user, request) => {
  const body = await request.json()
  const sql = getDb()
  const userId = user.id as string
  const { logoUrl, faviconUrl, primaryColor, secondaryColor, accentColor, customCss, platformName, tagline, supportEmail, socialLinks } = body

  const rows = await sql`
    INSERT INTO studio_branding (user_id, logo_url, favicon_url, primary_color, secondary_color, accent_color, custom_css, platform_name, tagline, support_email, social_links)
    VALUES (${userId}, ${logoUrl || null}, ${faviconUrl || null}, ${primaryColor || null}, ${secondaryColor || null}, ${accentColor || null}, ${customCss || null}, ${platformName || null}, ${tagline || null}, ${supportEmail || null}, ${JSON.stringify(socialLinks || {})})
    ON CONFLICT (user_id) DO UPDATE SET
      logo_url = COALESCE(${logoUrl ?? null}, studio_branding.logo_url),
      favicon_url = COALESCE(${faviconUrl ?? null}, studio_branding.favicon_url),
      primary_color = COALESCE(${primaryColor ?? null}, studio_branding.primary_color),
      secondary_color = COALESCE(${secondaryColor ?? null}, studio_branding.secondary_color),
      accent_color = COALESCE(${accentColor ?? null}, studio_branding.accent_color),
      custom_css = COALESCE(${customCss ?? null}, studio_branding.custom_css),
      platform_name = COALESCE(${platformName ?? null}, studio_branding.platform_name),
      tagline = COALESCE(${tagline ?? null}, studio_branding.tagline),
      support_email = COALESCE(${supportEmail ?? null}, studio_branding.support_email),
      social_links = COALESCE(${socialLinks ? JSON.stringify(socialLinks) : null}, studio_branding.social_links),
      updated_at = NOW()
    RETURNING *
  `

  return jsonOk({ branding: toCamel(rows[0] as Record<string, unknown>) })
})
