import { getDb, toCamel } from "@/lib/db"
import { normalizeGalleryTemplateId } from "@/lib/client-gallery-templates"
import { verifyGalleryUnlockCookie } from "@/lib/client-gallery-unlock-cookie"
import { isStorageConfiguredForUser } from "@/lib/client-gallery-storage"
import { presignGetObjectForOwner } from "@/lib/s3-client-gallery"

/** Postgres undefined_column — e.g. metadata migration not applied yet */
function isPgUndefinedColumnError(e: unknown): boolean {
  return (e as { code?: string })?.code === "42703"
}

export type AlbumRow = {
  id: string
  userId: string
  title: string
  publicToken: string
  s3Prefix: string
  description: string | null
  location: string | null
  eventType: string | null
  startsAt: string | null
  endsAt: string | null
  expiresAt: string | null
  notes: string | null
  galleryTemplateId: string
  guestViewCount: number
  lastGuestViewAt: string | null
  guestPinRequired: boolean
  guestPin: string | null
  createdAt: string
  updatedAt: string
  assetCount?: number
}

export type AssetRow = {
  id: string
  albumId: string
  s3Key: string
  contentType: string | null
  byteSize: string | number | null
  createdAt: string
}

function mapAlbumRow(o: Record<string, unknown>, assetCount?: number): AlbumRow {
  const gvc = o.guestViewCount
  return {
    id: String(o.id),
    userId: String(o.userId),
    title: String(o.title ?? ""),
    publicToken: String(o.publicToken ?? ""),
    s3Prefix: String(o.s3Prefix ?? ""),
    description: o.description != null ? String(o.description) : null,
    location: o.location != null ? String(o.location) : null,
    eventType: o.eventType != null ? String(o.eventType) : null,
    startsAt: o.startsAt != null ? String(o.startsAt) : null,
    endsAt: o.endsAt != null ? String(o.endsAt) : null,
    expiresAt: o.expiresAt != null ? String(o.expiresAt) : null,
    notes: o.notes != null ? String(o.notes) : null,
    galleryTemplateId: normalizeGalleryTemplateId(
      o.galleryTemplateId != null ? String(o.galleryTemplateId) : null,
    ),
    guestViewCount: typeof gvc === "number" ? gvc : Number(gvc ?? 0),
    lastGuestViewAt: o.lastGuestViewAt != null ? String(o.lastGuestViewAt) : null,
    guestPinRequired: Boolean(o.guestPinRequired),
    guestPin: o.guestPin != null ? String(o.guestPin) : null,
    createdAt: o.createdAt != null ? String(o.createdAt) : "",
    updatedAt: o.updatedAt != null ? String(o.updatedAt) : "",
    assetCount,
  }
}

async function listAlbumsForUserLegacy(userId: string): Promise<AlbumRow[]> {
  const sql = getDb()
  const rows = await sql`
    SELECT
      a.id,
      a.user_id,
      a.title,
      a.public_token,
      a.s3_prefix,
      a.created_at,
      a.updated_at,
      COALESCE(c.cnt, 0)::int AS asset_count
    FROM client_gallery_albums a
    LEFT JOIN (
      SELECT album_id, COUNT(*)::int AS cnt
      FROM client_gallery_assets
      GROUP BY album_id
    ) c ON c.album_id = a.id
    WHERE a.user_id = ${userId}
    ORDER BY a.updated_at DESC
  `
  return rows.map((r) => {
    const o = toCamel(r) as Record<string, unknown>
    const ac = typeof o.assetCount === "number" ? o.assetCount : Number(o.assetCount ?? 0)
    return mapAlbumRow(o, ac)
  })
}

export async function listAlbumsForUser(userId: string): Promise<AlbumRow[]> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT
        a.id,
        a.user_id,
        a.title,
        a.public_token,
        a.s3_prefix,
        a.description,
        a.location,
        a.event_type,
        a.starts_at,
        a.ends_at,
        a.expires_at,
        a.notes,
        a.gallery_template_id,
        a.guest_view_count,
        a.last_guest_view_at,
        a.guest_pin_required,
        a.guest_pin,
        a.created_at,
        a.updated_at,
        COALESCE(c.cnt, 0)::int AS asset_count
      FROM client_gallery_albums a
      LEFT JOIN (
        SELECT album_id, COUNT(*)::int AS cnt
        FROM client_gallery_assets
        GROUP BY album_id
      ) c ON c.album_id = a.id
      WHERE a.user_id = ${userId}
      ORDER BY a.updated_at DESC
    `
    return rows.map((r) => {
      const o = toCamel(r) as Record<string, unknown>
      const ac = typeof o.assetCount === "number" ? o.assetCount : Number(o.assetCount ?? 0)
      return mapAlbumRow(o, ac)
    })
  } catch (e) {
    if (!isPgUndefinedColumnError(e)) throw e
    try {
      const rows = await sql`
        SELECT
          a.id,
          a.user_id,
          a.title,
          a.public_token,
          a.s3_prefix,
          a.description,
          a.location,
          a.event_type,
          a.starts_at,
          a.ends_at,
          a.expires_at,
          a.notes,
          a.gallery_template_id,
          a.created_at,
          a.updated_at,
          COALESCE(c.cnt, 0)::int AS asset_count
        FROM client_gallery_albums a
        LEFT JOIN (
          SELECT album_id, COUNT(*)::int AS cnt
          FROM client_gallery_assets
          GROUP BY album_id
        ) c ON c.album_id = a.id
        WHERE a.user_id = ${userId}
        ORDER BY a.updated_at DESC
      `
      return rows.map((r) => {
        const o = toCamel(r) as Record<string, unknown>
        const ac = typeof o.assetCount === "number" ? o.assetCount : Number(o.assetCount ?? 0)
        return mapAlbumRow(o, ac)
      })
    } catch (e2) {
      if (!isPgUndefinedColumnError(e2)) throw e2
      console.warn(
        "[client-gallery] listAlbumsForUser: metadata columns missing; using legacy query. Apply scripts/ensure-client-gallery-album-metadata-schema.sql when possible.",
      )
      return listAlbumsForUserLegacy(userId)
    }
  }
}

export async function getAlbumByIdForUser(
  albumId: string,
  userId: string,
): Promise<(AlbumRow & { assets: AssetRow[] }) | null> {
  const sql = getDb()
  let raw: Record<string, unknown> | undefined
  try {
    const rows = await sql`
      SELECT
        id,
        user_id,
        title,
        public_token,
        s3_prefix,
        description,
        location,
        event_type,
        starts_at,
        ends_at,
        expires_at,
        notes,
        gallery_template_id,
        guest_view_count,
        last_guest_view_at,
        guest_pin_required,
        guest_pin,
        created_at,
        updated_at
      FROM client_gallery_albums
      WHERE id = ${albumId} AND user_id = ${userId}
      LIMIT 1
    `
    raw = rows[0]
  } catch (e) {
    if (!isPgUndefinedColumnError(e)) throw e
    try {
      const rows = await sql`
        SELECT
          id,
          user_id,
          title,
          public_token,
          s3_prefix,
          description,
          location,
          event_type,
          starts_at,
          ends_at,
          expires_at,
          notes,
          gallery_template_id,
          created_at,
          updated_at
        FROM client_gallery_albums
        WHERE id = ${albumId} AND user_id = ${userId}
        LIMIT 1
      `
      raw = rows[0]
    } catch (e2) {
      if (!isPgUndefinedColumnError(e2)) throw e2
      console.warn(
        "[client-gallery] getAlbumByIdForUser: metadata columns missing; using legacy query. Apply scripts/ensure-client-gallery-album-metadata-schema.sql when possible.",
      )
      const rows = await sql`
        SELECT id, user_id, title, public_token, s3_prefix, created_at, updated_at
        FROM client_gallery_albums
        WHERE id = ${albumId} AND user_id = ${userId}
        LIMIT 1
      `
      raw = rows[0]
    }
  }
  if (!raw) return null
  const album = toCamel(raw) as Record<string, unknown>
  const assetsRows = await sql`
    SELECT id, album_id, s3_key, content_type, byte_size, created_at
    FROM client_gallery_assets
    WHERE album_id = ${albumId}
    ORDER BY created_at ASC
  `
  const assets: AssetRow[] = assetsRows.map((ar) => {
    const o = toCamel(ar) as Record<string, unknown>
    return {
      id: String(o.id),
      albumId: String(o.albumId),
      s3Key: String(o.s3Key ?? ""),
      contentType: o.contentType != null ? String(o.contentType) : null,
      byteSize: o.byteSize,
      createdAt: o.createdAt != null ? String(o.createdAt) : "",
    }
  })
  return {
    ...mapAlbumRow(album),
    assets,
  }
}

export type PublicAlbumPayload = {
  title: string
  storageConfigured: boolean
  galleryTemplateId: string
  description: string | null
  location: string | null
  eventType: string | null
  startsAt: string | null
  endsAt: string | null
  expired: boolean
  /** True when a guest PIN is required and the browser has not unlocked this album yet. */
  locked?: boolean
  images: { id: string; url: string; contentType: string | null }[]
}

type PublicAlbumDbRow = {
  id?: string
  title?: string
  user_id?: string
  description?: string | null
  location?: string | null
  event_type?: string | null
  starts_at?: string | null
  ends_at?: string | null
  expires_at?: string | null
  gallery_template_id?: string | null
  guest_pin_required?: boolean
  guest_pin?: string | null
}

export async function recordGuestAlbumView(publicToken: string): Promise<boolean> {
  const sql = getDb()
  try {
    const rows = await sql`
      UPDATE client_gallery_albums
      SET
        guest_view_count = guest_view_count + 1,
        last_guest_view_at = NOW()
      WHERE public_token = ${publicToken}
        AND (expires_at IS NULL OR expires_at > NOW())
      RETURNING id
    `
    return rows.length > 0
  } catch (e) {
    if (isPgUndefinedColumnError(e)) return false
    throw e
  }
}

export async function buildPublicAlbumPayload(
  publicToken: string,
  unlockCookie?: string | null,
): Promise<PublicAlbumPayload | null> {
  const sql = getDb()
  let album: PublicAlbumDbRow | undefined

  try {
    const rows = await sql`
      SELECT
        id,
        title,
        user_id,
        description,
        location,
        event_type,
        starts_at,
        ends_at,
        expires_at,
        gallery_template_id,
        guest_pin_required,
        guest_pin
      FROM client_gallery_albums
      WHERE public_token = ${publicToken}
      LIMIT 1
    `
    album = rows[0] as PublicAlbumDbRow | undefined
  } catch (e) {
    if (!isPgUndefinedColumnError(e)) throw e
    try {
      const rows = await sql`
        SELECT
          id,
          title,
          user_id,
          description,
          location,
          event_type,
          starts_at,
          ends_at,
          expires_at,
          gallery_template_id
        FROM client_gallery_albums
        WHERE public_token = ${publicToken}
        LIMIT 1
      `
      album = rows[0] as PublicAlbumDbRow | undefined
    } catch (e2) {
      if (!isPgUndefinedColumnError(e2)) throw e2
      console.warn(
        "[client-gallery] buildPublicAlbumPayload: metadata columns missing; using legacy query. Apply scripts/ensure-client-gallery-album-metadata-schema.sql when possible.",
      )
      const rows = await sql`
        SELECT id, title, user_id
        FROM client_gallery_albums
        WHERE public_token = ${publicToken}
        LIMIT 1
      `
      album = rows[0] as PublicAlbumDbRow | undefined
    }
  }

  if (!album?.id) return null

  const title = String(album.title ?? "Album")
  const ownerId = String(album.user_id ?? "")
  const galleryTemplateId = normalizeGalleryTemplateId(album.gallery_template_id)
  const description = album.description != null ? String(album.description) : null
  const location = album.location != null ? String(album.location) : null
  const eventType = album.event_type != null ? String(album.event_type) : null
  const startsAt = album.starts_at != null ? String(album.starts_at) : null
  const endsAt = album.ends_at != null ? String(album.ends_at) : null

  let expired = false
  if (album.expires_at) {
    const exp = new Date(String(album.expires_at))
    if (!Number.isNaN(exp.getTime()) && Date.now() > exp.getTime()) {
      expired = true
    }
  }

  const pinRequired = Boolean(album.guest_pin_required)
  if (pinRequired && !expired && !verifyGalleryUnlockCookie(unlockCookie ?? undefined, publicToken)) {
    return {
      title,
      storageConfigured: true,
      galleryTemplateId,
      description,
      location,
      eventType,
      startsAt,
      endsAt,
      expired: false,
      locked: true,
      images: [],
    }
  }

  if (!ownerId || !(await isStorageConfiguredForUser(ownerId))) {
    return {
      title,
      storageConfigured: false,
      galleryTemplateId,
      description,
      location,
      eventType,
      startsAt,
      endsAt,
      expired,
      images: [],
    }
  }

  if (expired) {
    return {
      title,
      storageConfigured: true,
      galleryTemplateId,
      description,
      location,
      eventType,
      startsAt,
      endsAt,
      expired: true,
      images: [],
    }
  }

  const assets = await sql`
    SELECT id, s3_key, content_type FROM client_gallery_assets
    WHERE album_id = ${album.id}
    ORDER BY created_at ASC
  `

  const images: { id: string; url: string; contentType: string | null }[] = []
  for (const a of assets) {
    const id = String(a.id)
    const key = String(a.s3_key ?? "")
    const contentType = a.content_type != null ? String(a.content_type) : null
    let url: string
    try {
      url = await presignGetObjectForOwner(ownerId, key, 3600)
    } catch {
      continue
    }
    images.push({ id, url, contentType })
  }
  return {
    title,
    storageConfigured: true,
    galleryTemplateId,
    description,
    location,
    eventType,
    startsAt,
    endsAt,
    expired: false,
    images,
  }
}

export async function buildOwnerAlbumWithUrls(albumId: string, userId: string) {
  const data = await getAlbumByIdForUser(albumId, userId)
  if (!data) return null
  const { assets: rawAssets, ...albumMeta } = data
  const mapNoUrl = () =>
    rawAssets.map((a) => ({
      id: a.id,
      s3Key: a.s3Key,
      contentType: a.contentType,
      byteSize: a.byteSize,
      createdAt: a.createdAt,
      url: null as string | null,
    }))

  if (!(await isStorageConfiguredForUser(albumMeta.userId))) {
    return {
      ...albumMeta,
      storageConfigured: false as const,
      assets: mapNoUrl(),
    }
  }

  const assets: {
    id: string
    s3Key: string
    contentType: string | null
    byteSize: string | number | null
    createdAt: string
    url: string | null
  }[] = []
  for (const asset of rawAssets) {
    const url = await presignGetObjectForOwner(albumMeta.userId, asset.s3Key, 3600)
    assets.push({
      id: asset.id,
      s3Key: asset.s3Key,
      contentType: asset.contentType,
      byteSize: asset.byteSize,
      createdAt: asset.createdAt,
      url,
    })
  }
  return { ...albumMeta, storageConfigured: true as const, assets }
}
