import { getCurrentUser } from "@/lib/auth"
import { jsonError, jsonOk } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getClientGalleryViewerAbsoluteUrl } from "@/lib/client-gallery-public-url"
import { isUuid } from "@/lib/client-gallery-utils"
import { buildOwnerAlbumWithUrls } from "@/lib/client-gallery-album-service"
import { isStorageConfiguredForUser } from "@/lib/client-gallery-storage"
import {
  generateGuestAlbumPin,
  parseAlbumPatchBody,
} from "@/lib/client-gallery-album-metadata"
import { getAlbumByIdForUser, isPgUndefinedColumnError } from "@/lib/client-gallery-album-service"
import { normalizeGalleryTemplateId } from "@/lib/client-gallery-templates"
import { getDb } from "@/lib/db"
import { deleteRekognitionCollectionForAlbum } from "@/lib/client-gallery-face-identity"
import { deleteAllObjectsUnderPrefixForOwner } from "@/lib/s3-client-gallery"

function clientGallerySchemaErrorMessage(e: unknown): string | null {
  const code = (e as { code?: string })?.code
  if (code === "42703") {
    return "Photo gallery album columns are missing (outdated schema). Apply scripts/ensure-client-gallery-album-metadata-schema.sql and scripts/ensure-client-gallery-album-analytics-pin-schema.sql on the server."
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
      guestViewCount: data.guestViewCount,
      lastGuestViewAt: data.lastGuestViewAt,
      guestPinRequired: data.guestPinRequired,
      guestPin: data.guestPin,
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
  await deleteRekognitionCollectionForAlbum(id)

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

  const parsed = parseAlbumPatchBody(bodyJson, normalizeGalleryTemplateId)
  if (!parsed.ok) {
    return jsonError(parsed.error, 400)
  }

  const current = await getAlbumByIdForUser(id, uid)
  if (!current) {
    return jsonError("Not found", 404)
  }

  const p = parsed.data
  let title = current.title
  if (p.title !== undefined) title = p.title
  let description = current.description
  if (p.description !== undefined) description = p.description
  let location = current.location
  if (p.location !== undefined) location = p.location
  let eventType = current.eventType
  if (p.eventType !== undefined) eventType = p.eventType
  let startsAt = current.startsAt
  if (p.startsAt !== undefined) startsAt = p.startsAt
  let endsAt = current.endsAt
  if (p.endsAt !== undefined) endsAt = p.endsAt
  let expiresAt = current.expiresAt
  if (p.expiresAt !== undefined) expiresAt = p.expiresAt
  let notes = current.notes
  if (p.notes !== undefined) notes = p.notes
  let galleryTemplateId = current.galleryTemplateId
  if (p.galleryTemplateId !== undefined) galleryTemplateId = p.galleryTemplateId

  let guestPinRequired = Boolean(current.guestPinRequired)
  let guestPin = current.guestPin ?? null

  if (p.guestPinRequired !== undefined) {
    guestPinRequired = p.guestPinRequired
    if (!guestPinRequired) {
      guestPin = null
    } else if (!guestPin || p.regenerateGuestPin) {
      guestPin = generateGuestAlbumPin()
    }
  } else if (p.regenerateGuestPin === true) {
    if (current.guestPinRequired) {
      guestPin = generateGuestAlbumPin()
    }
  }

  /** node-pg: never pass undefined as a bound parameter — use null for SQL NULL. */
  const tTitle = title
  const tDescription = description ?? null
  const tLocation = location ?? null
  const tEventType = eventType ?? null
  const tStartsAt = startsAt ?? null
  const tEndsAt = endsAt ?? null
  const tExpiresAt = expiresAt ?? null
  const tNotes = notes ?? null
  const tGuestPin = guestPin ?? null

  const sql = getDb()
  const pinFieldsInPatch = p.guestPinRequired !== undefined || p.regenerateGuestPin === true
  /** Toggle PIN / regenerate only — avoid rewriting all columns (timestamps can fail to round-trip on some DB rows). */
  const pinOnlyPatch =
    pinFieldsInPatch &&
    p.title === undefined &&
    p.description === undefined &&
    p.location === undefined &&
    p.eventType === undefined &&
    p.startsAt === undefined &&
    p.endsAt === undefined &&
    p.expiresAt === undefined &&
    p.notes === undefined &&
    p.galleryTemplateId === undefined

  type MetadataRow = { id?: string; gallery_template_id?: string; updated_at?: unknown }
  type FullRow = MetadataRow & {
    guest_pin_required?: boolean
    guest_pin?: string | null
  }

  const respondMetadataOk = (row: MetadataRow | undefined, pinRequired: boolean, pin: string | null) => {
    if (!row?.id) {
      return jsonError("Not found", 404)
    }
    return jsonOk({
      album: {
        id: String(row.id),
        title,
        description,
        location,
        eventType,
        startsAt,
        endsAt,
        expiresAt,
        notes,
        galleryTemplateId: String(row.gallery_template_id ?? galleryTemplateId),
        guestPinRequired: pinRequired,
        guestPin: pin,
        updatedAt: row.updated_at,
      },
    })
  }

  const respondFullOk = (row: FullRow | undefined) => {
    if (!row?.id) {
      return jsonError("Not found", 404)
    }
    return jsonOk({
      album: {
        id: String(row.id),
        title,
        description,
        location,
        eventType,
        startsAt,
        endsAt,
        expiresAt,
        notes,
        galleryTemplateId: String(row.gallery_template_id ?? galleryTemplateId),
        guestPinRequired: Boolean(row.guest_pin_required),
        guestPin: row.guest_pin != null ? String(row.guest_pin) : null,
        updatedAt: row.updated_at,
      },
    })
  }

  try {
    if (!pinFieldsInPatch) {
      const rows = await sql`
        UPDATE client_gallery_albums
        SET
          title = ${tTitle},
          description = ${tDescription},
          location = ${tLocation},
          event_type = ${tEventType},
          starts_at = ${tStartsAt},
          ends_at = ${tEndsAt},
          expires_at = ${tExpiresAt},
          notes = ${tNotes},
          gallery_template_id = ${galleryTemplateId},
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${uid}
        RETURNING id, gallery_template_id, updated_at
      `
      return respondMetadataOk(
        rows[0] as MetadataRow | undefined,
        Boolean(current.guestPinRequired),
        current.guestPin ?? null,
      )
    }

    if (pinOnlyPatch) {
      const rows = await sql`
        UPDATE client_gallery_albums
        SET
          guest_pin_required = ${guestPinRequired},
          guest_pin = ${tGuestPin},
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${uid}
        RETURNING
          id,
          gallery_template_id,
          guest_pin_required,
          guest_pin,
          updated_at
      `
      return respondFullOk(rows[0] as FullRow | undefined)
    }

    const rows = await sql`
      UPDATE client_gallery_albums
      SET
        title = ${tTitle},
        description = ${tDescription},
        location = ${tLocation},
        event_type = ${tEventType},
        starts_at = ${tStartsAt},
        ends_at = ${tEndsAt},
        expires_at = ${tExpiresAt},
        notes = ${tNotes},
        gallery_template_id = ${galleryTemplateId},
        guest_pin_required = ${guestPinRequired},
        guest_pin = ${tGuestPin},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${uid}
      RETURNING
        id,
        gallery_template_id,
        guest_pin_required,
        guest_pin,
        updated_at
    `
    return respondFullOk(rows[0] as FullRow | undefined)
  } catch (e) {
    if (isPgUndefinedColumnError(e) && pinFieldsInPatch) {
      const hint = clientGallerySchemaErrorMessage(e)
      return jsonError(hint ?? "Photo gallery columns are missing on the server database.", 503)
    }
    if (isPgUndefinedColumnError(e) && !pinFieldsInPatch) {
      try {
        const rows = await sql`
          UPDATE client_gallery_albums
          SET
            title = ${tTitle},
            gallery_template_id = ${galleryTemplateId},
            updated_at = NOW()
          WHERE id = ${id} AND user_id = ${uid}
          RETURNING id, gallery_template_id, updated_at
        `
        return respondMetadataOk(
          rows[0] as MetadataRow | undefined,
          Boolean(current.guestPinRequired),
          current.guestPin ?? null,
        )
      } catch (e2) {
        console.error("[client-gallery/albums PATCH] minimal metadata fallback", e2)
        const hint = clientGallerySchemaErrorMessage(e2)
        return jsonError(hint ?? "Could not update album", hint ? 503 : 500)
      }
    }
    const pg = e as { code?: string; message?: string; detail?: string }
    console.error("[client-gallery/albums PATCH]", pg.code, pg.message, pg.detail ?? "", e)
    const hint = clientGallerySchemaErrorMessage(e)
    if (hint) {
      return jsonError(hint, 503)
    }
    const msg = e instanceof Error ? e.message : "Unknown error"
    return jsonError(
      process.env.NODE_ENV === "development" ? `Could not update album: ${msg}` : "Could not update album",
      500,
    )
  }
}
