import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getClientGalleryViewerAbsoluteUrl } from "@/lib/client-gallery-public-url"
import { isUuid } from "@/lib/client-gallery-utils"
import { buildOwnerAlbumWithUrls } from "@/lib/client-gallery-album-service"
import { isStorageConfiguredForUser } from "@/lib/client-gallery-storage"
import { isValidGalleryTemplateId } from "@/lib/client-gallery-templates"
import { getDb } from "@/lib/db"
import { deleteAllObjectsUnderPrefixForOwner } from "@/lib/s3-client-gallery"

function clientGallerySchemaErrorMessage(e: unknown): string | null {
  const code = (e as { code?: string })?.code
  if (code === "42703") {
    return "Photo gallery album columns are missing (outdated schema). Apply scripts/ensure-client-gallery-album-metadata-schema.sql on the server."
  }
  return null
}

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

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
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

  let bodyJson: Record<string, unknown>
  try {
    bodyJson = (await request.json()) as Record<string, unknown>
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const raw = bodyJson.galleryTemplateId ?? bodyJson.gallery_template_id
  if (typeof raw !== "string" || !raw.trim()) {
    return jsonError("galleryTemplateId is required", 400)
  }
  const galleryTemplateId = raw.trim()
  if (!isValidGalleryTemplateId(galleryTemplateId)) {
    return jsonError("Invalid gallery template", 400)
  }

  const sql = getDb()
  try {
    const rows = await sql`
      UPDATE client_gallery_albums
      SET gallery_template_id = ${galleryTemplateId}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${uid}
      RETURNING id, gallery_template_id, updated_at
    `
    const row = rows[0] as { id?: string; gallery_template_id?: string; updated_at?: unknown } | undefined
    if (!row?.id) {
      return jsonError("Not found", 404)
    }
    return jsonOk({
      album: {
        id: String(row.id),
        galleryTemplateId: String(row.gallery_template_id ?? galleryTemplateId),
        updatedAt: row.updated_at,
      },
    })
  } catch (e) {
    console.error("[client-gallery/albums PATCH]", e)
    const hint = clientGallerySchemaErrorMessage(e)
    return jsonError(hint ?? "Could not update album", hint ? 503 : 500)
  }
}
