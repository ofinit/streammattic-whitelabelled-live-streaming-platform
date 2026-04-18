import { getDb } from "@/lib/db"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getClientGalleryViewerAbsoluteUrl } from "@/lib/client-gallery-public-url"
import { parseAlbumCreateBody } from "@/lib/client-gallery-album-metadata"
import { normalizeGalleryTemplateId } from "@/lib/client-gallery-templates"
import { albumTitleToS3FolderSegment, newPublicGalleryToken } from "@/lib/client-gallery-utils"
import { listAlbumsForUser } from "@/lib/client-gallery-album-service"

export const dynamic = "force-dynamic"

/** Postgres schema errors — migrations not applied */
function clientGallerySchemaErrorMessage(e: unknown): string | null {
  const code = (e as { code?: string })?.code
  if (code === "42P01") {
    return "Photo gallery tables are missing. On the server, run: psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-albums-schema.sql (or your usual migration process)."
  }
  if (code === "42703") {
    return "Photo gallery album columns are missing (outdated schema). On the server, run: psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-album-metadata-schema.sql (or your usual migration process)."
  }
  return null
}

export const GET = withAuth(async (user) => {
  const role = user.role as string
  if (role !== "studio" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }
  const uid = String(user.id)
  const entitled = await isClientGalleryEntitled(uid, role)
  if (!entitled) {
    return jsonError("Photo gallery add-on is not enabled for your account", 403)
  }
  try {
    const albums = await listAlbumsForUser(uid)
    return jsonOk({ albums })
  } catch (e) {
    console.error("[client-gallery/albums GET]", e)
    const hint = clientGallerySchemaErrorMessage(e)
    return jsonError(hint ?? "Could not load albums", hint ? 503 : 500)
  }
})

export const POST = withAuth(async (user, request: Request) => {
  const role = user.role as string
  if (role !== "studio" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }
  const uid = String(user.id)
  const entitled = await isClientGalleryEntitled(uid, role)
  if (!entitled) {
    return jsonError("Photo gallery add-on is not enabled for your account", 403)
  }

  let bodyJson: Record<string, unknown>
  try {
    bodyJson = (await request.json()) as Record<string, unknown>
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const parsed = parseAlbumCreateBody(bodyJson, normalizeGalleryTemplateId)
  if (!parsed.ok) {
    return jsonError(parsed.error, 400)
  }
  const meta = parsed.data

  const sql = getDb()
  const albumId = crypto.randomUUID()
  const folderSegment = albumTitleToS3FolderSegment(meta.title, albumId)
  const s3Prefix = `cg/${uid}/${folderSegment}/`

  let lastErr: unknown
  for (let attempt = 0; attempt < 6; attempt++) {
    const publicToken = newPublicGalleryToken()
    try {
      const rows = await sql`
        INSERT INTO client_gallery_albums (
          id, user_id, title, public_token, s3_prefix,
          description, location, event_type, starts_at, ends_at, expires_at, notes, gallery_template_id
        )
        VALUES (
          ${albumId},
          ${uid},
          ${meta.title},
          ${publicToken},
          ${s3Prefix},
          ${meta.description},
          ${meta.location},
          ${meta.eventType},
          ${meta.startsAt},
          ${meta.endsAt},
          ${meta.expiresAt},
          ${meta.notes},
          ${meta.galleryTemplateId}
        )
        RETURNING
          id, user_id, title, public_token, s3_prefix,
          description, location, event_type, starts_at, ends_at, expires_at, notes, gallery_template_id,
          created_at, updated_at
      `
      const row = rows[0] as Record<string, unknown>
      const viewerUrl = getClientGalleryViewerAbsoluteUrl(publicToken)
      return jsonOk({
        album: {
          id: String(row.id),
          userId: String(row.user_id),
          title: String(row.title ?? ""),
          publicToken,
          s3Prefix: String(row.s3_prefix ?? ""),
          description: row.description != null ? String(row.description) : null,
          location: row.location != null ? String(row.location) : null,
          eventType: row.event_type != null ? String(row.event_type) : null,
          startsAt: row.starts_at != null ? String(row.starts_at) : null,
          endsAt: row.ends_at != null ? String(row.ends_at) : null,
          expiresAt: row.expires_at != null ? String(row.expires_at) : null,
          notes: row.notes != null ? String(row.notes) : null,
          galleryTemplateId: String(row.gallery_template_id ?? meta.galleryTemplateId),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        viewerUrl,
        viewerPath: `/client-gallery/v/${publicToken}`,
      })
    } catch (e) {
      lastErr = e
      const code = (e as { code?: string })?.code
      if (code === "23505") continue
      if (code === "42703") {
        try {
          console.warn(
            "[client-gallery/albums POST] metadata columns missing; using legacy insert. Apply scripts/ensure-client-gallery-album-metadata-schema.sql so details persist in the database.",
          )
          const rows = await sql`
            INSERT INTO client_gallery_albums (id, user_id, title, public_token, s3_prefix)
            VALUES (${albumId}, ${uid}, ${meta.title}, ${publicToken}, ${s3Prefix})
            RETURNING id, user_id, title, public_token, s3_prefix, created_at, updated_at
          `
          const row = rows[0] as Record<string, unknown>
          const viewerUrl = getClientGalleryViewerAbsoluteUrl(publicToken)
          return jsonOk({
            album: {
              id: String(row.id),
              userId: String(row.user_id),
              title: String(row.title ?? ""),
              publicToken,
              s3Prefix: String(row.s3_prefix ?? ""),
              description: meta.description,
              location: meta.location,
              eventType: meta.eventType,
              startsAt: meta.startsAt,
              endsAt: meta.endsAt,
              expiresAt: meta.expiresAt,
              notes: meta.notes,
              galleryTemplateId: meta.galleryTemplateId,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            },
            viewerUrl,
            viewerPath: `/client-gallery/v/${publicToken}`,
          })
        } catch (e2) {
          lastErr = e2
          const code2 = (e2 as { code?: string })?.code
          if (code2 === "23505") continue
          console.error("[client-gallery/albums POST] legacy insert", e2)
          const hint = clientGallerySchemaErrorMessage(e2)
          return jsonError(hint ?? "Could not create album", hint ? 503 : 500)
        }
      }
      console.error("[client-gallery/albums POST]", e)
      const hint = clientGallerySchemaErrorMessage(e)
      return jsonError(hint ?? "Could not create album", hint ? 503 : 500)
    }
  }
  console.error("[client-gallery/albums POST] token collision", lastErr)
  return jsonError("Could not create album (retry)", 500)
})
