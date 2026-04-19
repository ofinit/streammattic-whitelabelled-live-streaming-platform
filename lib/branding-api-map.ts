/**
 * Maps camelCase `studio_branding` rows to the client `Branding` shape used by BrandingForm
 * (`brandName`, `themeColor`, `companyLogo`, `email`, `phone`, …).
 */

export function normalizeBrandingRowForClient(raw: Record<string, unknown>): Record<string, unknown> {
  const platformName = raw.platformName
  const primaryColor = raw.primaryColor
  const secondaryColor = raw.secondaryColor
  const accentFromDb = raw.accentColor
  const logo = raw.logo
  const supportEmail = raw.supportEmail
  const supportPhone = raw.supportPhone

  const brandName =
    (typeof raw.brandName === "string" && raw.brandName) ||
    (typeof platformName === "string" && platformName) ||
    ""

  const themeColor =
    (typeof raw.themeColor === "string" && raw.themeColor) ||
    (typeof primaryColor === "string" && primaryColor) ||
    "#10b981"

  const accentColor =
    (typeof secondaryColor === "string" && secondaryColor) ||
    (typeof raw.accentColor === "string" && raw.accentColor) ||
    (typeof accentFromDb === "string" && accentFromDb) ||
    "#059669"

  const companyLogo =
    (typeof raw.companyLogo === "string" && raw.companyLogo) ||
    (typeof logo === "string" && logo) ||
    undefined

  const email =
    (typeof raw.email === "string" && raw.email) ||
    (typeof supportEmail === "string" && supportEmail) ||
    undefined

  const phone =
    (typeof raw.phone === "string" && raw.phone) ||
    (typeof supportPhone === "string" && supportPhone) ||
    undefined

  return {
    ...raw,
    brandName,
    themeColor,
    accentColor,
    companyLogo,
    email,
    phone,
  }
}

/** Request body from BrandingForm uses UI names; map to DB/API field names for PUT. */
export function mapBrandingPutBody(body: Record<string, unknown>): {
  companyLogo: unknown
  favicon: unknown
  primaryColor: unknown
  secondaryColor: unknown
  accentColor: unknown
  customCss: unknown
  platformName: unknown
  tagline: unknown
  supportEmail: unknown
  socialLinks: unknown
  metaTitle: unknown
  metaDescription: unknown
  googleAnalyticsId: unknown
  aboutUs: unknown
  termsConditions: unknown
  privacyPolicy: unknown
  refundPolicy: unknown
  heroImage: unknown
  aboutImage: unknown
  address: unknown
  phone: unknown
  whatsapp: unknown
  facebookUrl: unknown
  instagramUrl: unknown
  twitterUrl: unknown
  youtubeUrl: unknown
  linkedinUrl: unknown
  companyLogoDark: unknown
  preferredGateway: unknown
  smtpHost: unknown
  smtpPort: unknown
  smtpUser: unknown
  smtpPassword: unknown
  smtpFromEmail: unknown
  smtpFromName: unknown
  smtpSecure: unknown
  selectedTheme: unknown
} {
  const companyLogo = body.companyLogo ?? body.logo
  const primaryColor = body.primaryColor ?? body.themeColor
  const secondaryColor = body.secondaryColor ?? body.accentColor
  const accentColor = body.accentColor ?? body.secondaryColor
  const platformName = body.platformName ?? body.brandName
  const supportEmail = body.supportEmail ?? body.email
  const phone = body.phone ?? body.supportPhone

  return {
    companyLogo,
    favicon: body.favicon,
    primaryColor,
    secondaryColor,
    accentColor,
    customCss: body.customCss,
    platformName,
    tagline: body.tagline,
    supportEmail,
    socialLinks: body.socialLinks,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    googleAnalyticsId: body.googleAnalyticsId,
    aboutUs: body.aboutUs,
    termsConditions: body.termsConditions,
    privacyPolicy: body.privacyPolicy,
    refundPolicy: body.refundPolicy,
    heroImage: body.heroImage,
    aboutImage: body.aboutImage,
    address: body.address,
    phone,
    whatsapp: body.whatsapp,
    facebookUrl: body.facebookUrl,
    instagramUrl: body.instagramUrl,
    twitterUrl: body.twitterUrl,
    youtubeUrl: body.youtubeUrl,
    linkedinUrl: body.linkedinUrl,
    companyLogoDark: body.companyLogoDark,
    preferredGateway: body.preferredGateway,
    smtpHost: body.smtpHost,
    smtpPort: body.smtpPort,
    smtpUser: body.smtpUser,
    smtpPassword: body.smtpPassword,
    smtpFromEmail: body.smtpFromEmail,
    smtpFromName: body.smtpFromName,
    smtpSecure: body.smtpSecure,
    selectedTheme: body.selectedTheme,
  }
}
