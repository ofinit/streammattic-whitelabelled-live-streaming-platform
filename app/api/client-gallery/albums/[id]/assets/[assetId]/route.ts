import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { isStorageConfiguredForUser } from "@/lib/client-gallery-storage"
import { getDb } from "@/lib/db"
import { isUuid } from "@/lib/client-gallery-utils"
import { deleteRekognitionFacesForAsset } from "@/lib/client-gallery-face-identity"
import { deleteObjectForOwner } from "@/lib/s3-client-gallery"

export const dynamic = "force-dynamic"

export async function DELETE(_request: Request, props: { params: Promise<{ id: string; assetId: string }> }) {
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

  const { id: albumId, assetId } = await props.params
  if (!isUuid(albumId) || !isUuid(assetId)) {
    return jsonError("Invalid id", 400)
  }

  const sql = getDb()
  const rows = await sql`
    SELECT a.id, a.s3_key
    FROM client_gallery_assets a
    INNER JOIN client_gallery_albums g ON g.id = a.album_id
    WHERE a.id = ${assetId} AND a.album_id = ${albumId} AND g.user_id = ${uid}
    LIMIT 1
  `
  const asset = rows[0] as { id?: string; s3_key?: string } | undefined
  if (!asset?.id) {
    return jsonError("Not found", 404)
  }

  const key = String(asset.s3_key ?? "")
  if (key.length === 0) {
    return jsonError("Invalid asset", 400)
  }

  await deleteRekognitionFacesForAsset(albumId, assetId)

  if (await isStorageConfiguredForUser(uid)) {
    try {
      try {
        const thumbRows = await sql`
          SELECT thumb_s3_key FROM client_gallery_face_instances
          WHERE album_id = ${albumId} AND asset_id = ${assetId} AND thumb_s3_key IS NOT NULL
        `
        for (const tr of thumbRows) {
          const tk = (tr as { thumb_s3_key?: string }).thumb_s3_key
          if (tk) {
            try {
              await deleteObjectForOwner(uid, tk)
            } catch {
              /* best-effort */
            }
          }
        }
      } catch (te) {
        if ((te as { code?: string })?.code !== "42P01") throw te
      }
      await deleteObjectForOwner(uid, key)
    } catch (e) {
      console.error("[client-gallery asset DELETE] S3", e)
      const msg = e instanceof Error ? e.message : "Storage delete failed"
      return jsonError(`Could not delete file from your bucket: ${msg}`, 502)
    }
  }

  await sql`DELETE FROM client_gallery_assets WHERE id = ${assetId} AND album_id = ${albumId}`
  await sql`UPDATE client_gallery_albums SET updated_at = NOW() WHERE id = ${albumId}`

  return jsonOk({ ok: true })
}
