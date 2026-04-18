import { getDb } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"
import { isPgUndefinedColumnError } from "@/lib/client-gallery-album-service"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"

export type PhotoGalleryEntitlementRow = {
  photoGalleryEnabled: boolean
  photoGalleryOptIn: boolean
  photoGallerySubscriptionExpiresAt: string | null
  photoGalleryBillingPeriodStart: string | null
}

export type ClientGalleryAccessReason =
  | "ok"
  | "not_streamer_or_studio"
  | "catalog_off"
  | "admin_disabled"
  | "not_opted_in"
  | "subscription_expired"
  | "no_entitlement_row"

export async function fetchPhotoGalleryEntitlementRow(userId: string): Promise<PhotoGalleryEntitlementRow | null> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT
        photo_gallery_enabled,
        photo_gallery_opt_in,
        photo_gallery_subscription_expires_at,
        photo_gallery_billing_period_start
      FROM user_addon_entitlements
      WHERE user_id = ${userId}
      LIMIT 1
    `
    const r = rows[0] as Record<string, unknown> | undefined
    if (!r) return null
    return mapEntitlementRow(r)
  } catch (e) {
    if (!isPgUndefinedColumnError(e)) throw e
    try {
      const rows = await sql`
        SELECT photo_gallery_enabled
        FROM user_addon_entitlements
        WHERE user_id = ${userId}
        LIMIT 1
      `
      const r = rows[0] as Record<string, unknown> | undefined
      if (!r) return null
      return {
        photoGalleryEnabled: r.photo_gallery_enabled === true,
        photoGalleryOptIn: false,
        photoGallerySubscriptionExpiresAt: null,
        photoGalleryBillingPeriodStart: null,
      }
    } catch {
      return null
    }
  }
}

function mapEntitlementRow(r: Record<string, unknown>): PhotoGalleryEntitlementRow {
  return {
    photoGalleryEnabled: r.photo_gallery_enabled === true,
    photoGalleryOptIn: r.photo_gallery_opt_in === true,
    photoGallerySubscriptionExpiresAt:
      r.photo_gallery_subscription_expires_at != null ? String(r.photo_gallery_subscription_expires_at) : null,
    photoGalleryBillingPeriodStart:
      r.photo_gallery_billing_period_start != null ? String(r.photo_gallery_billing_period_start) : null,
  }
}

export function resolveClientGalleryAccess(args: {
  role: string
  catalogListingEnabled: boolean
  row: PhotoGalleryEntitlementRow | null
}): { active: boolean; reason: ClientGalleryAccessReason; subscriptionExpiresAt: string | null } {
  const { role, catalogListingEnabled, row } = args
  if (role !== "studio" && role !== "streamer") {
    return { active: false, reason: "not_streamer_or_studio", subscriptionExpiresAt: null }
  }
  if (!catalogListingEnabled) {
    return { active: false, reason: "catalog_off", subscriptionExpiresAt: null }
  }
  if (!row || !row.photoGalleryEnabled) {
    return { active: false, reason: row ? "admin_disabled" : "no_entitlement_row", subscriptionExpiresAt: null }
  }
  if (!row.photoGalleryOptIn) {
    return { active: false, reason: "not_opted_in", subscriptionExpiresAt: row.photoGallerySubscriptionExpiresAt }
  }
  const exp = row.photoGallerySubscriptionExpiresAt
  if (!exp) {
    return { active: false, reason: "subscription_expired", subscriptionExpiresAt: null }
  }
  const t = new Date(exp).getTime()
  if (Number.isNaN(t) || t <= Date.now()) {
    return { active: false, reason: "subscription_expired", subscriptionExpiresAt: exp }
  }
  return { active: true, reason: "ok", subscriptionExpiresAt: exp }
}

export async function getCatalogListingEnabled(): Promise<boolean> {
  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const catalog = parsePhotoGalleryAddon(raw)
  return catalog.listingEnabled === true
}

export async function getClientGalleryAccessState(
  userId: string,
  role: string,
): Promise<{
  active: boolean
  reason: ClientGalleryAccessReason
  subscriptionExpiresAt: string | null
  row: PhotoGalleryEntitlementRow | null
}> {
  const catalogListingEnabled = await getCatalogListingEnabled()
  const row = await fetchPhotoGalleryEntitlementRow(userId)
  const { active, reason, subscriptionExpiresAt } = resolveClientGalleryAccess({
    role,
    catalogListingEnabled,
    row,
  })
  return { active, reason, subscriptionExpiresAt, row }
}

export function addMonthsFromNow(months: number): Date {
  const n = new Date()
  n.setUTCMonth(n.getUTCMonth() + months)
  return n
}
