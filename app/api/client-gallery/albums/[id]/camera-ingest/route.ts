import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import {
  cameraIngestRowToApi,
  generateCameraIngestPassword,
  generateCameraIngestUsername,
  getCameraIngestGatewayConfig,
  hashCameraIngestPassword,
  normalizeCameraIngestLabel,
  parseOptionalExpiry,
} from "@/lib/client-gallery-camera-ingest"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { isUuid } from "@/lib/client-gallery-utils"
import { getDb } from "@/lib/db"
import { getCameraIngestHostnameForDomain } from "@/lib/platform-dns"

export const dynamic = "force-dynamic"

type Params = { params: Promise<{ id: string }> }

async function requireOwnerAlbum(albumId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: jsonError("Unauthorized", 401) }

  const role = user.role as string
  if (role !== "studio" && role !== "streamer") {
    return { error: jsonError("Forbidden", 403) }
  }

  const uid = String(user.id)
  const entitled = await isClientGalleryEntitled(uid, role)
  if (!entitled) {
    return { error: jsonError("Photo gallery add-on is not enabled for your account", 403) }
  }
  if (!isUuid(albumId)) {
    return { error: jsonError("Invalid album id", 400) }
  }

  const sql = getDb()
  const rows = await sql`
    SELECT id, user_id, s3_prefix
    FROM client_gallery_albums
    WHERE id = ${albumId} AND user_id = ${uid}
    LIMIT 1
  `
  const album = rows[0] as { id?: string; user_id?: string; s3_prefix?: string } | undefined
  if (!album?.id) {
    return { error: jsonError("Not found", 404) }
  }

  return {
    uid,
    album: {
      id: String(album.id),
      s3Prefix: String(album.s3_prefix ?? ""),
    },
  }
}

function cameraIngestSchemaMessage(e: unknown): string | null {
  return (e as { code?: string })?.code === "42P01"
    ? "Camera upload tables are missing. On the server, run: psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-camera-ingest-schema.sql"
    : null
}

async function getGatewayConfigForOwner(userId: string) {
  const config = getCameraIngestGatewayConfig()
  const sql = getDb()
  const rows = await sql`
    SELECT domain
    FROM domains
    WHERE user_id = ${userId}
      AND is_primary = true
      AND verification_status IN ('pending', 'verified')
    ORDER BY CASE WHEN verification_status = 'verified' THEN 0 ELSE 1 END, created_at DESC
    LIMIT 1
  `.catch(() => [])
  const domain = rows[0]?.domain
  if (typeof domain === "string" && domain.trim()) {
    return {
      ...config,
      host: getCameraIngestHostnameForDomain(domain),
      fallbackHost: config.host,
    }
  }
  return config
}

export async function GET(_request: Request, props: Params) {
  const { id } = await props.params
  const owner = await requireOwnerAlbum(id)
  if ("error" in owner) return owner.error

  try {
    const sql = getDb()
    const rows = await sql`
      SELECT
        id, label, username, upload_prefix, enabled, expires_at, gateway_user_id,
        last_upload_at, imported_asset_count, created_at, updated_at
      FROM client_gallery_camera_ingest_credentials
      WHERE album_id = ${owner.album.id} AND user_id = ${owner.uid}
      ORDER BY created_at DESC
    `
    return jsonOk({
      gateway: await getGatewayConfigForOwner(owner.uid),
      credentials: rows.map(cameraIngestRowToApi),
    })
  } catch (e) {
    console.error("[client-gallery camera-ingest GET]", e)
    const hint = cameraIngestSchemaMessage(e)
    return jsonError(hint ?? "Could not load camera upload access", hint ? 503 : 500)
  }
}

export async function POST(request: Request, props: Params) {
  const { id } = await props.params
  const owner = await requireOwnerAlbum(id)
  if ("error" in owner) return owner.error

  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    // Empty body is allowed; defaults are enough to create a credential.
  }

  const label = normalizeCameraIngestLabel(body.label)
  const expiresAt = parseOptionalExpiry(body.expiresAt)
  const sql = getDb()
  const credentialId = globalThis.crypto.randomUUID()
  const uploadPrefix = `${owner.album.s3Prefix.replace(/\/?$/, "/")}incoming/${credentialId}/`
  const password = generateCameraIngestPassword()
  const passwordHash = hashCameraIngestPassword(password)

  let lastErr: unknown
  for (let attempt = 0; attempt < 6; attempt++) {
    const username = generateCameraIngestUsername(owner.uid, owner.album.id)
    try {
      const rows = await sql`
        INSERT INTO client_gallery_camera_ingest_credentials (
          id, user_id, album_id, label, username, password_hash, upload_prefix, expires_at
        )
        VALUES (
          ${credentialId},
          ${owner.uid},
          ${owner.album.id},
          ${label},
          ${username},
          ${passwordHash},
          ${uploadPrefix},
          ${expiresAt}
        )
        RETURNING
          id, label, username, upload_prefix, enabled, expires_at, gateway_user_id,
          last_upload_at, imported_asset_count, created_at, updated_at
      `
      if (!rows[0]?.id) return jsonError("Could not create camera upload access", 500)
      return jsonOk(
        {
          gateway: await getGatewayConfigForOwner(owner.uid),
          credential: cameraIngestRowToApi(rows[0]),
          oneTimePassword: password,
        },
        201,
      )
    } catch (e) {
      lastErr = e
      if ((e as { code?: string })?.code === "23505") continue
      const hint = cameraIngestSchemaMessage(e)
      console.error("[client-gallery camera-ingest POST]", e)
      return jsonError(hint ?? "Could not create camera upload access", hint ? 503 : 500)
    }
  }

  console.error("[client-gallery camera-ingest POST] username collision", lastErr)
  return jsonError("Could not create camera upload access. Please try again.", 500)
}

