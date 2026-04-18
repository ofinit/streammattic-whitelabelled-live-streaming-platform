import { jsonOk, withAuth } from "@/lib/api-helpers"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"
import { getPlatformSetting } from "@/lib/db-queries"
import { getClientGalleryAccessState } from "@/lib/photo-gallery-subscription"

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
      adminEnabled: false,
      optIn: false,
      subscriptionExpiresAt: null as string | null,
      accessReason: "not_streamer_or_studio" as const,
    })
  }

  const { active, reason, subscriptionExpiresAt, row } = await getClientGalleryAccessState(
    String(user.id),
    user.role as string,
  )

  return jsonOk({
    catalog,
    /** True when the user may use gallery APIs (active subscription). */
    entitled: active,
    eligible: catalog.listingEnabled === true,
    adminEnabled: row?.photoGalleryEnabled === true,
    optIn: row?.photoGalleryOptIn === true,
    subscriptionExpiresAt,
    accessReason: reason,
  })
})
