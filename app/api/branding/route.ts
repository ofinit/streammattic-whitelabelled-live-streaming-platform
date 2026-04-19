import { getDb, toCamel } from "@/lib/db"
import { jsonOk, withAuth } from "@/lib/api-helpers"
import { withRedisCache, invalidateCache } from "@/lib/redis"
import { encrypt, decrypt } from "@/lib/encryption"
import { mapBrandingPutBody, normalizeBrandingRowForClient } from "@/lib/branding-api-map"

export const dynamic = "force-dynamic"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId") || user.id as string

  const branding = await withRedisCache(
    `studio_branding:${userId}`,
    3600, // 1 hour TTL
    async () => {
      const sql = getDb()
      const rows = await sql`SELECT * FROM studio_branding WHERE user_id = ${userId}`
      if (rows.length === 0) return null
      const branding = toCamel(rows[0] as Record<string, unknown>)
      if (branding.smtpPassword) {
        branding.smtpPassword = decrypt(branding.smtpPassword as string)
      }
      const merged = {
        ...branding,
        selectedTheme: rows[0].selected_theme || "modern_emerald",
      } as Record<string, unknown>
      return normalizeBrandingRowForClient(merged)
    }
  )

  return jsonOk({ branding })
})

export const PUT = withAuth(async (user, request) => {
  const bodyRaw = await request.json()
  const body = mapBrandingPutBody(bodyRaw as Record<string, unknown>)
  const sql = getDb()
  const userId = user.id as string
  const {
    companyLogo,
    favicon,
    primaryColor,
    secondaryColor,
    accentColor,
    customCss,
    platformName,
    tagline,
    supportEmail,
    socialLinks,
    metaTitle,
    metaDescription,
    googleAnalyticsId,
    aboutUs,
    termsConditions,
    privacyPolicy,
    refundPolicy,
    heroImage,
    aboutImage,
    address,
    phone,
    whatsapp,
    facebookUrl,
    instagramUrl,
    twitterUrl,
    youtubeUrl,
    linkedinUrl,
    companyLogoDark,
    preferredGateway,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassword,
    smtpFromEmail,
    smtpFromName,
    smtpSecure,
    selectedTheme,
    services,
    eventTypes,
    stats,
    testimonials,
    galleryImages,
    differentiators,
    ctaBannerTitle,
    ctaBannerSubtitle,
    ctaBannerButtonText,
    ctaBannerButtonUrl,
  } = body

  const rows = await sql`
    INSERT INTO studio_branding (
      user_id, logo, favicon, primary_color, secondary_color, accent_color, 
      custom_css, platform_name, tagline, support_email, social_links,
      meta_title, meta_description, google_analytics_id, about_us, 
      terms_conditions, privacy_policy, refund_policy, hero_image, about_image,
      address, support_phone, whatsapp, facebook_url, instagram_url, 
      twitter_url, youtube_url, linkedin_url, company_logo_dark, preferred_gateway,
      smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_email, smtp_from_name, smtp_secure,
      selected_theme, services, event_types, stats, testimonials, gallery_images,
      differentiators, cta_banner_title, cta_banner_subtitle, cta_banner_button_text, cta_banner_button_url
    )
    VALUES (
      ${userId}, ${companyLogo || null}, ${favicon || null}, ${primaryColor || null}, ${secondaryColor || null}, ${accentColor || null}, 
      ${customCss || null}, ${platformName || null}, ${tagline || null}, ${supportEmail || null}, ${JSON.stringify(socialLinks || {})},
      ${metaTitle || null}, ${metaDescription || null}, ${googleAnalyticsId || null}, ${aboutUs || null},
      ${termsConditions || null}, ${privacyPolicy || null}, ${refundPolicy || null}, ${heroImage || null}, ${aboutImage || null},
      ${address || null}, ${phone || null}, ${whatsapp || null}, ${facebookUrl || null}, ${instagramUrl || null},
      ${twitterUrl || null}, ${youtubeUrl || null}, ${linkedinUrl || null}, ${companyLogoDark || null}, ${preferredGateway || null},
      ${smtpHost || null}, ${smtpPort || null}, ${smtpUser || null}, ${encrypt(smtpPassword)}, ${smtpFromEmail || null}, ${smtpFromName || null}, ${smtpSecure ?? true},
      ${selectedTheme || 'modern_emerald'},
      ${JSON.stringify(services || [])}::jsonb, ${JSON.stringify(eventTypes || [])}::jsonb, ${JSON.stringify(stats || [])}::jsonb,
      ${JSON.stringify(testimonials || [])}::jsonb, ${JSON.stringify(galleryImages || [])}::jsonb, ${JSON.stringify(differentiators || [])}::jsonb,
      ${ctaBannerTitle || null}, ${ctaBannerSubtitle || null}, ${ctaBannerButtonText || null}, ${ctaBannerButtonUrl || null}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      logo = COALESCE(${companyLogo ?? null}, studio_branding.logo),
      favicon = COALESCE(${favicon ?? null}, studio_branding.favicon),
      primary_color = COALESCE(${primaryColor ?? null}, studio_branding.primary_color),
      secondary_color = COALESCE(${secondaryColor ?? null}, studio_branding.secondary_color),
      accent_color = COALESCE(${accentColor ?? null}, studio_branding.accent_color),
      custom_css = COALESCE(${customCss ?? null}, studio_branding.custom_css),
      platform_name = COALESCE(${platformName ?? null}, studio_branding.platform_name),
      tagline = COALESCE(${tagline ?? null}, studio_branding.tagline),
      support_email = COALESCE(${supportEmail ?? null}, studio_branding.support_email),
      social_links = COALESCE(${socialLinks ? JSON.stringify(socialLinks) : null}, studio_branding.social_links),
      meta_title = COALESCE(${metaTitle ?? null}, studio_branding.meta_title),
      meta_description = COALESCE(${metaDescription ?? null}, studio_branding.meta_description),
      google_analytics_id = COALESCE(${googleAnalyticsId ?? null}, studio_branding.google_analytics_id),
      about_us = COALESCE(${aboutUs ?? null}, studio_branding.about_us),
      terms_conditions = COALESCE(${termsConditions ?? null}, studio_branding.terms_conditions),
      privacy_policy = COALESCE(${privacyPolicy ?? null}, studio_branding.privacy_policy),
      refund_policy = COALESCE(${refundPolicy ?? null}, studio_branding.refund_policy),
      hero_image = COALESCE(${heroImage ?? null}, studio_branding.hero_image),
      about_image = COALESCE(${aboutImage ?? null}, studio_branding.about_image),
      address = COALESCE(${address ?? null}, studio_branding.address),
      support_phone = COALESCE(${phone ?? null}, studio_branding.support_phone),
      whatsapp = COALESCE(${whatsapp ?? null}, studio_branding.whatsapp),
      facebook_url = COALESCE(${facebookUrl ?? null}, studio_branding.facebook_url),
      instagram_url = COALESCE(${instagramUrl ?? null}, studio_branding.instagram_url),
      twitter_url = COALESCE(${twitterUrl ?? null}, studio_branding.twitter_url),
      youtube_url = COALESCE(${youtubeUrl ?? null}, studio_branding.youtube_url),
      linkedin_url = COALESCE(${linkedinUrl ?? null}, studio_branding.linkedin_url),
      company_logo_dark = COALESCE(${companyLogoDark ?? null}, studio_branding.company_logo_dark),
      preferred_gateway = COALESCE(${preferredGateway ?? null}, studio_branding.preferred_gateway),
      smtp_host = COALESCE(${smtpHost ?? null}, studio_branding.smtp_host),
      smtp_port = COALESCE(${smtpPort ?? null}, studio_branding.smtp_port),
      smtp_user = COALESCE(${smtpUser ?? null}, studio_branding.smtp_user),
      smtp_password = COALESCE(${encrypt(smtpPassword)}, studio_branding.smtp_password),
      smtp_from_email = COALESCE(${smtpFromEmail ?? null}, studio_branding.smtp_from_email),
      smtp_from_name = COALESCE(${smtpFromName ?? null}, studio_branding.smtp_from_name),
      smtp_secure = COALESCE(${smtpSecure ?? null}, studio_branding.smtp_secure),
      selected_theme = COALESCE(${selectedTheme ?? null}, studio_branding.selected_theme),
      services = COALESCE(${JSON.stringify(services || [])}::jsonb, studio_branding.services),
      event_types = COALESCE(${JSON.stringify(eventTypes || [])}::jsonb, studio_branding.event_types),
      stats = COALESCE(${JSON.stringify(stats || [])}::jsonb, studio_branding.stats),
      testimonials = COALESCE(${JSON.stringify(testimonials || [])}::jsonb, studio_branding.testimonials),
      gallery_images = COALESCE(${JSON.stringify(galleryImages || [])}::jsonb, studio_branding.gallery_images),
      differentiators = COALESCE(${JSON.stringify(differentiators || [])}::jsonb, studio_branding.differentiators),
      cta_banner_title = COALESCE(${ctaBannerTitle ?? null}, studio_branding.cta_banner_title),
      cta_banner_subtitle = COALESCE(${ctaBannerSubtitle ?? null}, studio_branding.cta_banner_subtitle),
      cta_banner_button_text = COALESCE(${ctaBannerButtonText ?? null}, studio_branding.cta_banner_button_text),
      cta_banner_button_url = COALESCE(${ctaBannerButtonUrl ?? null}, studio_branding.cta_banner_button_url),
      updated_at = NOW()
    RETURNING *
  `

  await invalidateCache(`studio_branding:${userId}`)

  const saved = toCamel(rows[0] as Record<string, unknown>) as Record<string, unknown>
  if (saved.smtpPassword) {
    saved.smtpPassword = decrypt(saved.smtpPassword as string)
  }
  return jsonOk({
    branding: normalizeBrandingRowForClient({
      ...saved,
      selectedTheme: rows[0].selected_theme || "modern_emerald",
    }),
  })
})
