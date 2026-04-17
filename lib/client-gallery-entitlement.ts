import { getDb } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"

/**
 * Same rules as GET /api/photo-gallery-addon/status: listed in Packages + admin enabled per user.
 */
export async function isClientGalleryEntitled(userId: string, role: string): Promise<boolean> {
  if (role !== "studio" && role !== "streamer") return false
  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const catalog = parsePhotoGalleryAddon(raw)
  if (catalog.listingEnabled !== true) return false
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT photo_gallery_enabled FROM user_addon_entitlements WHERE user_id = ${userId} LIMIT 1
    `
    const row = rows[0] as { photo_gallery_enabled?: boolean } | undefined
    return row?.photo_gallery_enabled === true
  } catch {
    return false
  }
}
