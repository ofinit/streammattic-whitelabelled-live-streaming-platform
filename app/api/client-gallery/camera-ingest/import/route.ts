import { jsonError, jsonOk } from "@/lib/api-helpers"
import { scheduleClientGalleryFaceProcessing } from "@/lib/client-gallery-face-identity"
import { MAX_CLIENT_GALLERY_UPLOAD_BYTES } from "@/lib/client-gallery-utils"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

function timingSafeEqualText(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function POST(request: Request) {
  const secret = process.env.CLIENT_GALLERY_CAMERA_INGEST_WEBHOOK_SECRET?.trim()
  if (!secret) return jsonError("Camera ingest webhook is not configured", 503)

  const provided = request.headers.get("x-client-gallery-camera-ingest-secret")?.trim() ?? ""
  if (!provided || !timingSafeEqualText(provided, secret)) {
    return jsonError("Unauthorized", 401)
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const username = typeof body.username === "string" ? body.username.trim() : ""
  const key = typeof body.key === "string" ? body.key.trim() : ""
  const contentType = typeof body.contentType === "string" ? body.contentType.trim().slice(0, 200) : null
  const byteSize =
    typeof body.byteSize === "number" && Number.isFinite(body.byteSize) && body.byteSize >= 0
      ? Math.round(body.byteSize)
      : null

  if (!username || username.length > 200) return jsonError("username is required", 400)
  if (!key || key.length > 2048) return jsonError("key is required", 400)
  if (byteSize != null && byteSize > MAX_CLIENT_GALLERY_UPLOAD_BYTES) {
    return jsonError("Invalid byte size", 400)
  }

  const sql = getDb()
  const credentialRows = await sql`
    SELECT id, user_id, album_id, upload_prefix
    FROM client_gallery_camera_ingest_credentials
    WHERE username = ${username}
      AND enabled = true
      AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1
  `
  const credential = credentialRows[0] as
    | { id?: string; user_id?: string; album_id?: string; upload_prefix?: string }
    | undefined

  if (!credential?.id || !credential.album_id || !credential.upload_prefix) {
    return jsonError("Camera upload access is inactive or expired", 403)
  }

  const uploadPrefix = String(credential.upload_prefix)
  if (!key.startsWith(uploadPrefix)) {
    return jsonError("Object key is outside this camera upload prefix", 400)
  }

  try {
    const inserted = await sql`
      INSERT INTO client_gallery_assets (album_id, s3_key, content_type, byte_size)
      VALUES (${credential.album_id}, ${key}, ${contentType}, ${byteSize})
      ON CONFLICT (album_id, s3_key) DO NOTHING
      RETURNING id, album_id, s3_key, content_type, byte_size, created_at
    `
    const wasInserted = inserted.length > 0
    const asset =
      (inserted[0] as Record<string, unknown> | undefined) ??
      (
        await sql`
          SELECT id, album_id, s3_key, content_type, byte_size, created_at
          FROM client_gallery_assets
          WHERE album_id = ${credential.album_id} AND s3_key = ${key}
          LIMIT 1
        `
      )[0]
    if (!asset?.id) return jsonError("Could not import uploaded photo", 500)
    await sql`
      UPDATE client_gallery_camera_ingest_credentials
      SET last_upload_at = NOW(),
          imported_asset_count = imported_asset_count + ${wasInserted ? 1 : 0},
          updated_at = NOW()
      WHERE id = ${credential.id}
    `
    await sql`UPDATE client_gallery_albums SET updated_at = NOW() WHERE id = ${credential.album_id}`
    if (asset.id) scheduleClientGalleryFaceProcessing(String(asset.id))

    return jsonOk({
      asset: {
        id: String(asset.id),
        albumId: String(asset.album_id),
        s3Key: String(asset.s3_key ?? ""),
        contentType: asset.content_type != null ? String(asset.content_type) : null,
        byteSize: asset.byte_size,
        createdAt: asset.created_at,
      },
    })
  } catch (e) {
    console.error("[client-gallery camera-ingest import POST]", e)
    const code = (e as { code?: string })?.code
    if (code === "42P01") {
      return jsonError(
        "Camera upload tables are missing. Apply scripts/ensure-client-gallery-camera-ingest-schema.sql on the server.",
        503,
      )
    }
    return jsonError("Could not import uploaded photo", 500)
  }
}

