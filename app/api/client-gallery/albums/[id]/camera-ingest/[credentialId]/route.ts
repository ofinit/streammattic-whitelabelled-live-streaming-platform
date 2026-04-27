import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import {
  cameraIngestRowToApi,
  generateCameraIngestPassword,
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

type Params = { params: Promise<{ id: string; credentialId: string }> }

async function requireOwnerCredential(albumId: string, credentialId: string) {
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
  if (!isUuid(albumId) || !isUuid(credentialId)) {
    return { error: jsonError("Invalid camera upload access id", 400) }
  }

  const sql = getDb()
  const rows = await sql`
    SELECT c.id
    FROM client_gallery_camera_ingest_credentials c
    INNER JOIN client_gallery_albums a ON a.id = c.album_id
    WHERE c.id = ${credentialId}
      AND c.album_id = ${albumId}
      AND c.user_id = ${uid}
      AND a.user_id = ${uid}
    LIMIT 1
  `
  if (!rows[0]?.id) {
    return { error: jsonError("Not found", 404) }
  }

  return { uid }
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

export async function PATCH(request: Request, props: Params) {
  const { id, credentialId } = await props.params
  const owner = await requireOwnerCredential(id, credentialId)
  if ("error" in owner) return owner.error

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const label = body.label === undefined ? undefined : normalizeCameraIngestLabel(body.label)
  const expiresAt = body.expiresAt === undefined ? undefined : parseOptionalExpiry(body.expiresAt)
  const expiresAtTouched = body.expiresAt !== undefined
  const expiresAtValue = expiresAt ?? null
  const enabled = typeof body.enabled === "boolean" ? body.enabled : undefined

  if (label === undefined && expiresAt === undefined && enabled === undefined) {
    return jsonError("Nothing to update", 400)
  }

  try {
    const sql = getDb()
    const rows = await sql`
      UPDATE client_gallery_camera_ingest_credentials
      SET
        label = COALESCE(${label ?? null}, label),
        expires_at = CASE WHEN ${expiresAtTouched} THEN ${expiresAtValue}::timestamptz ELSE expires_at END,
        enabled = COALESCE(${enabled ?? null}, enabled),
        updated_at = NOW()
      WHERE id = ${credentialId} AND album_id = ${id} AND user_id = ${owner.uid}
      RETURNING
        id, label, username, upload_prefix, enabled, expires_at, gateway_user_id,
        last_upload_at, imported_asset_count, created_at, updated_at
    `
    if (!rows[0]?.id) return jsonError("Not found", 404)
    return jsonOk({
      gateway: await getGatewayConfigForOwner(owner.uid),
      credential: cameraIngestRowToApi(rows[0]),
    })
  } catch (e) {
    console.error("[client-gallery camera-ingest PATCH]", e)
    const hint = cameraIngestSchemaMessage(e)
    return jsonError(hint ?? "Could not update camera upload access", hint ? 503 : 500)
  }
}

export async function POST(_request: Request, props: Params) {
  const { id, credentialId } = await props.params
  const owner = await requireOwnerCredential(id, credentialId)
  if ("error" in owner) return owner.error

  const password = generateCameraIngestPassword()
  const passwordHash = hashCameraIngestPassword(password)

  try {
    const sql = getDb()
    const rows = await sql`
      UPDATE client_gallery_camera_ingest_credentials
      SET password_hash = ${passwordHash}, enabled = true, updated_at = NOW()
      WHERE id = ${credentialId} AND album_id = ${id} AND user_id = ${owner.uid}
      RETURNING
        id, label, username, upload_prefix, enabled, expires_at, gateway_user_id,
        last_upload_at, imported_asset_count, created_at, updated_at
    `
    if (!rows[0]?.id) return jsonError("Not found", 404)
    return jsonOk({
      gateway: await getGatewayConfigForOwner(owner.uid),
      credential: cameraIngestRowToApi(rows[0]),
      oneTimePassword: password,
    })
  } catch (e) {
    console.error("[client-gallery camera-ingest reset POST]", e)
    const hint = cameraIngestSchemaMessage(e)
    return jsonError(hint ?? "Could not reset camera upload password", hint ? 503 : 500)
  }
}

