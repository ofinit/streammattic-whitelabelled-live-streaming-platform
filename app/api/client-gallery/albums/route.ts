import { getDb } from "@/lib/db"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import { isClientGalleryEntitled } from "@/lib/client-gallery-entitlement"
import { getClientGalleryViewerAbsoluteUrl } from "@/lib/client-gallery-public-url"
import { albumTitleToS3FolderSegment, newPublicGalleryToken } from "@/lib/client-gallery-utils"
import { listAlbumsForUser } from "@/lib/client-gallery-album-service"

export const dynamic = "force-dynamic"

/** Postgres undefined_table — migration not applied */
function missingGalleryTablesMessage(e: unknown): string | null {
  const code = (e as { code?: string })?.code
  if (code === "42P01") {
    return "Photo gallery tables are missing. On the server, run: psql \"$DATABASE_URL\" -v ON_ERROR_STOP=1 -f scripts/ensure-client-gallery-albums-schema.sql (or your usual migration process)."
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
    const hint = missingGalleryTablesMessage(e)
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

  let title = "Untitled album"
  try {
    const body = (await request.json()) as { title?: unknown }
    if (typeof body.title === "string") {
      const t = body.title.trim().slice(0, 200)
      if (t.length > 0) title = t
    }
  } catch {
    /* default title */
  }

  const sql = getDb()
  const albumId = crypto.randomUUID()
  const folderSegment = albumTitleToS3FolderSegment(title, albumId)
  const s3Prefix = `cg/${uid}/${folderSegment}/`

  let lastErr: unknown
  for (let attempt = 0; attempt < 6; attempt++) {
    const publicToken = newPublicGalleryToken()
    try {
      const rows = await sql`
        INSERT INTO client_gallery_albums (id, user_id, title, public_token, s3_prefix)
        VALUES (${albumId}, ${uid}, ${title}, ${publicToken}, ${s3Prefix})
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
      console.error("[client-gallery/albums POST]", e)
      const hint = missingGalleryTablesMessage(e)
      return jsonError(hint ?? "Could not create album", hint ? 503 : 500)
    }
  }
  console.error("[client-gallery/albums POST] token collision", lastErr)
  return jsonError("Could not create album (retry)", 500)
})
