import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { scheduleClientGalleryFaceProcessing } from "@/lib/client-gallery-face-identity"
import { getDb } from "@/lib/db"
import { isUuid, MAX_CLIENT_GALLERY_UPLOAD_BYTES } from "@/lib/client-gallery-utils"

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

  const { id: albumId } = await props.params
  if (!isUuid(albumId)) {
    return jsonError("Invalid album id", 400)
  }

  const sql = getDb()
  const albumRows = await sql`
    SELECT id, s3_prefix FROM client_gallery_albums WHERE id = ${albumId} AND user_id = ${uid} LIMIT 1
  `
  const album = albumRows[0] as { id?: string; s3_prefix?: string } | undefined
  if (!album?.id) {
    return jsonError("Not found", 404)
  }

  const prefix = String(album.s3_prefix)

  let key = ""
  let contentType: string | null = null
  let byteSize: number | null = null
  try {
    const body = (await request.json()) as { key?: unknown; contentType?: unknown; byteSize?: unknown }
    if (typeof body.key === "string" && body.key.length > 0 && body.key.length < 2048) {
      key = body.key
    }
    if (typeof body.contentType === "string" && body.contentType.length < 200) {
      contentType = body.contentType
    }
    if (typeof body.byteSize === "number" && Number.isFinite(body.byteSize) && body.byteSize >= 0) {
      byteSize = Math.round(body.byteSize)
    }
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  if (!key.startsWith(prefix)) {
    return jsonError("Invalid object key for this album", 400)
  }

  if (byteSize != null && byteSize > MAX_CLIENT_GALLERY_UPLOAD_BYTES) {
    return jsonError("Invalid byte size", 400)
  }

  try {
    const inserted = await sql`
      INSERT INTO client_gallery_assets (album_id, s3_key, content_type, byte_size)
      VALUES (${albumId}, ${key}, ${contentType}, ${byteSize})
      RETURNING id, album_id, s3_key, content_type, byte_size, created_at
    `
    await sql`UPDATE client_gallery_albums SET updated_at = NOW() WHERE id = ${albumId}`
    const r = inserted[0] as Record<string, unknown>
    scheduleClientGalleryFaceProcessing(String(r.id))
    return jsonOk({
      asset: {
        id: String(r.id),
        albumId: String(r.album_id),
        s3Key: String(r.s3_key ?? ""),
        contentType: r.content_type != null ? String(r.content_type) : null,
        byteSize: r.byte_size,
        createdAt: r.created_at,
      },
    })
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === "23505") {
      return jsonError("This file was already registered", 409)
    }
    console.error("[client-gallery assets POST]", e)
    return jsonError("Could not save asset", 500)
  }
}
