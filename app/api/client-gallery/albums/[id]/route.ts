import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getClientGalleryViewerAbsoluteUrl } from "@/lib/client-gallery-public-url"
import { isUuid } from "@/lib/client-gallery-utils"
import { buildOwnerAlbumWithUrls } from "@/lib/client-gallery-album-service"
import { isStorageConfiguredForUser } from "@/lib/client-gallery-storage"
import { getDb } from "@/lib/db"
import { deleteAllObjectsUnderPrefixForOwner } from "@/lib/s3-client-gallery"

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
      s3Prefix: data.s3Prefix,
      viewerUrl,
      viewerPath: `/client-gallery/v/${data.publicToken}`,
      storageConfigured: data.storageConfigured,
      description: data.description,
      location: data.location,
      eventType: data.eventType,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      expiresAt: data.expiresAt,
      notes: data.notes,
      galleryTemplateId: data.galleryTemplateId,
      assets: data.assets,
    },
  })
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
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

  const sql = getDb()
  const rows = await sql`
    SELECT id, s3_prefix FROM client_gallery_albums WHERE id = ${id} AND user_id = ${uid} LIMIT 1
  `
  const row = rows[0] as { id?: string; s3_prefix?: string } | undefined
  if (!row?.id) {
    return jsonError("Not found", 404)
  }

  const prefix = String(row.s3_prefix ?? "")
  if (await isStorageConfiguredForUser(uid)) {
    try {
      await deleteAllObjectsUnderPrefixForOwner(uid, prefix)
    } catch (e) {
      console.error("[client-gallery album DELETE] S3 delete", e)
      const msg = e instanceof Error ? e.message : "Storage delete failed"
      return jsonError(`Could not delete files from your bucket: ${msg}`, 502)
    }
  }

  await sql`DELETE FROM client_gallery_albums WHERE id = ${id} AND user_id = ${uid}`
  return jsonOk({ ok: true })
}
