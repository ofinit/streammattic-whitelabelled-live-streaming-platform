import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getDb } from "@/lib/db"
import { isClientGalleryS3Configured, presignPutObject } from "@/lib/s3-client-gallery"
import { isUuid, MAX_CLIENT_GALLERY_UPLOAD_BYTES, safeGalleryObjectFilename } from "@/lib/client-gallery-utils"

export const dynamic = "force-dynamic"

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
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

  if (!isClientGalleryS3Configured()) {
    return jsonError("Object storage is not configured (set CLIENT_GALLERY_S3_* env vars)", 503)
  }

  const { id: albumId } = await props.params
  if (!isUuid(albumId)) {
    return jsonError("Invalid album id", 400)
  }

  const sql = getDb()
  const rows = await sql`
    SELECT id, s3_prefix FROM client_gallery_albums WHERE id = ${albumId} AND user_id = ${uid} LIMIT 1
  `
  const row = rows[0] as { id?: string; s3_prefix?: string } | undefined
  if (!row?.id) {
    return jsonError("Not found", 404)
  }

  let filename = "image"
  let contentType = "application/octet-stream"
  let byteSize = 0
  try {
    const body = (await request.json()) as {
      filename?: unknown
      contentType?: unknown
      byteSize?: unknown
    }
    if (typeof body.filename === "string") {
      filename = safeGalleryObjectFilename(body.filename)
    }
    if (typeof body.contentType === "string" && body.contentType.length > 0 && body.contentType.length < 200) {
      contentType = body.contentType
    }
    if (typeof body.byteSize === "number" && Number.isFinite(body.byteSize) && body.byteSize >= 0) {
      byteSize = body.byteSize
    }
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  if (byteSize > MAX_CLIENT_GALLERY_UPLOAD_BYTES) {
    return jsonError(`File too large (max ${MAX_CLIENT_GALLERY_UPLOAD_BYTES} bytes)`, 400)
  }

  const prefix = String(row.s3_prefix)
  const objectKey = `${prefix}${crypto.randomUUID()}-${filename}`

  let presignedUrl: string
  try {
    presignedUrl = await presignPutObject(objectKey, contentType)
  } catch (e) {
    console.error("[client-gallery upload presign]", e)
    return jsonError("Could not create upload URL", 500)
  }

  return jsonOk({
    presignedUrl,
    key: objectKey,
    method: "PUT" as const,
    headers: { "Content-Type": contentType },
  })
}
