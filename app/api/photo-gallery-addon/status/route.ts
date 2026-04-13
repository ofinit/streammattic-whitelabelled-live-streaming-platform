import { getDb } from "@/lib/db"
import { jsonOk, withAuth } from "@/lib/api-helpers"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"
import { getPlatformSetting } from "@/lib/db-queries"

export const dynamic = "force-dynamic"

/**
 * Studio / streamer: catalog pricing + entitlement for the client photo gallery add-on.
 */
export const GET = withAuth(async (user) => {
  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const catalog = parsePhotoGalleryAddon(raw)

  if (user.role !== "studio" && user.role !== "streamer") {
    return jsonOk({
      catalog,
      entitled: false,
      eligible: catalog.listingEnabled === true,
    })
  }

  let entitled = false
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT photo_gallery_enabled FROM user_addon_entitlements WHERE user_id = ${user.id} LIMIT 1
    `
    const row = rows[0] as { photo_gallery_enabled?: boolean } | undefined
    entitled = row?.photo_gallery_enabled === true
  } catch (e) {
    console.warn("[photo-gallery-addon/status] entitlements lookup failed (run DB migration?)", e)
  }

  return jsonOk({
    catalog,
    entitled,
    eligible: catalog.listingEnabled === true,
  })
})
