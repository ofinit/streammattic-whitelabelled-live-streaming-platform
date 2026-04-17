import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getClientGalleryViewerAbsoluteUrl } from "@/lib/client-gallery-public-url"
import { isUuid } from "@/lib/client-gallery-utils"
import { buildOwnerAlbumWithUrls } from "@/lib/client-gallery-album-service"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return jsonError("Unauthorized", 401)

  const role = user.role as string
  if (role !== "studio" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }
  const uid = String(user.id)
  const entitled = await isClientGalleryEntitled(uid, role)
  if (!entitled) {
    return jsonError("Photo gallery add-on is not enabled for your account", 403)
  }

  const { id } = await props.params
  if (!isUuid(id)) {
    return jsonError("Invalid album id", 400)
  }

  const data = await buildOwnerAlbumWithUrls(id, uid)
  if (!data) {
    return jsonError("Not found", 404)
  }

  const viewerUrl = getClientGalleryViewerAbsoluteUrl(data.publicToken)

  return jsonOk({
    album: {
      id: data.id,
      title: data.title,
      publicToken: data.publicToken,
      viewerUrl,
      viewerPath: `/client-gallery/v/${data.publicToken}`,
      storageConfigured: data.storageConfigured,
      assets: data.assets,
    },
  })
}
