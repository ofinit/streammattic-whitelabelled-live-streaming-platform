import { getDb, toCamel } from "@/lib/db"
import { isClientGalleryS3Configured, presignGetObject } from "@/lib/s3-client-gallery"

export type AlbumRow = {
  id: string
  userId: string
  title: string
  publicToken: string
  s3Prefix: string
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

export async function listAlbumsForUser(userId: string): Promise<AlbumRow[]> {
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
    return {
      id: String(o.id),
      userId: String(o.userId),
      title: String(o.title ?? ""),
      publicToken: String(o.publicToken ?? ""),
      s3Prefix: String(o.s3Prefix ?? ""),
      createdAt: o.createdAt != null ? String(o.createdAt) : "",
      updatedAt: o.updatedAt != null ? String(o.updatedAt) : "",
      assetCount: typeof o.assetCount === "number" ? o.assetCount : Number(o.assetCount ?? 0),
    }
  })
}

export async function getAlbumByIdForUser(
  albumId: string,
  userId: string,
): Promise<(AlbumRow & { assets: AssetRow[] }) | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, user_id, title, public_token, s3_prefix, created_at, updated_at
    FROM client_gallery_albums
    WHERE id = ${albumId} AND user_id = ${userId}
    LIMIT 1
  `
  const raw = rows[0]
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
    id: String(album.id),
    userId: String(album.userId),
    title: String(album.title ?? ""),
    publicToken: String(album.publicToken ?? ""),
    s3Prefix: String(album.s3Prefix ?? ""),
    createdAt: album.createdAt != null ? String(album.createdAt) : "",
    updatedAt: album.updatedAt != null ? String(album.updatedAt) : "",
    assets,
  }
}

export type PublicAlbumPayload = {
  title: string
  storageConfigured: boolean
  images: { id: string; url: string; contentType: string | null }[]
}

export async function buildPublicAlbumPayload(publicToken: string): Promise<PublicAlbumPayload | null> {
  const sql = getDb()
  const rows = await sql`
    SELECT id, title FROM client_gallery_albums WHERE public_token = ${publicToken} LIMIT 1
  `
  const album = rows[0] as { id?: string; title?: string } | undefined
  if (!album?.id) return null

  const title = String(album.title ?? "Album")
  if (!isClientGalleryS3Configured()) {
    return { title, storageConfigured: false, images: [] }
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
    const url = await presignGetObject(key, 3600)
    images.push({ id, url, contentType })
  }
  return { title, storageConfigured: true, images }
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

  if (!isClientGalleryS3Configured()) {
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
    const url = await presignGetObject(asset.s3Key, 3600)
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
