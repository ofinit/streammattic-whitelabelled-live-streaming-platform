import { jsonError, jsonOk, withRole } from "@/lib/api-helpers"
import {
  assertPhotoGalleryAddonForSave,
  parsePhotoGalleryAddon,
  PHOTO_GALLERY_PLATFORM_SETTING_KEY,
} from "@/lib/photo-gallery-addon"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"

export const dynamic = "force-dynamic"

export const GET = withRole(["admin"], async () => {
  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  return jsonOk({ settings: parsePhotoGalleryAddon(raw) })
})

export const PUT = withRole(["admin"], async (_user, request: Request) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  let value: ReturnType<typeof assertPhotoGalleryAddonForSave>
  try {
    value = assertPhotoGalleryAddonForSave(body)
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Invalid payload", 400)
  }

  await setPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY, value)

  return jsonOk({ ok: true, settings: value })
})
