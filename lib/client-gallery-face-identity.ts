/**
 * Face recognition (identity) for client gallery albums using AWS Rekognition.
 * Opt-in: set CLIENT_GALLERY_FACE_RECOGNITION=1 and platform AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION).
 * Image bytes are read from the owner’s BYOS bucket; Rekognition API calls use the platform AWS account.
 */

import {
  CreateCollectionCommand,
  DeleteCollectionCommand,
  DeleteFacesCommand,
  IndexFacesCommand,
  RekognitionClient,
  ResourceAlreadyExistsException,
  SearchFacesCommand,
} from "@aws-sdk/client-rekognition"
import sharp from "sharp"
import { getDb } from "@/lib/db"
import { maybeDebitFaceRecognitionForAssetPaisa } from "@/lib/photo-gallery-usage-charges"
import { getObjectBufferForOwner, presignGetObjectForOwner, putObjectBufferForOwner } from "@/lib/s3-client-gallery"

const MATCH_THRESHOLD = 88

function rekognitionRegion(): string {
  return (
    process.env.AWS_REKOGNITION_REGION?.trim() ||
    process.env.AWS_REGION?.trim() ||
    process.env.AWS_DEFAULT_REGION?.trim() ||
    "us-east-1"
  )
}

function rekognitionClient(): RekognitionClient | null {
  if (process.env.CLIENT_GALLERY_FACE_RECOGNITION !== "1") {
    return null
  }
  return new RekognitionClient({ region: rekognitionRegion() })
}

export function isClientGalleryFaceRecognitionEnabled(): boolean {
  return process.env.CLIENT_GALLERY_FACE_RECOGNITION === "1"
}

export function collectionIdForAlbum(albumId: string): string {
  return `streamlivee-cg-${albumId.replace(/[^a-zA-Z0-9_.\-]/g, "")}`.slice(0, 255)
}

function isRasterImageContentType(ct: string | null): boolean {
  if (!ct) return false
  const t = ct.toLowerCase().split(";")[0]?.trim() ?? ""
  return t === "image/jpeg" || t === "image/png" || t === "image/webp" || t === "image/gif"
}

async function ensureCollection(client: RekognitionClient, collectionId: string): Promise<void> {
  try {
    await client.send(new CreateCollectionCommand({ CollectionId: collectionId }))
  } catch (e) {
    if (e instanceof ResourceAlreadyExistsException) return
    throw e
  }
}

/**
 * Fire-and-forget after a new asset row is created.
 */
export function scheduleClientGalleryFaceProcessing(assetId: string): void {
  if (!isClientGalleryFaceRecognitionEnabled()) return
  void processClientGalleryAssetFaces(assetId).catch((err) => {
    console.error("[client-gallery face-identity] process failed", assetId, err)
  })
}

export async function processClientGalleryAssetFaces(assetId: string): Promise<void> {
  const client = rekognitionClient()
  if (!client) return

  const sql = getDb()
  let albumId = ""
  let ownerId = ""
  let s3Key = ""
  let contentType: string | null = null

  try {
    const rows = await sql`
      SELECT a.id, a.album_id, a.s3_key, a.content_type, g.user_id AS owner_id
      FROM client_gallery_assets a
      INNER JOIN client_gallery_albums g ON g.id = a.album_id
      WHERE a.id = ${assetId}
      LIMIT 1
    `
    const row = rows[0] as
      | { id?: string; album_id?: string; s3_key?: string; content_type?: string | null; owner_id?: string }
      | undefined
    if (!row?.id) return
    albumId = String(row.album_id ?? "")
    ownerId = String(row.owner_id ?? "")
    s3Key = String(row.s3_key ?? "")
    contentType = row.content_type != null ? String(row.content_type) : null
  } catch (e) {
    const code = (e as { code?: string })?.code
    if (code === "42P01") return
    throw e
  }

  if (!isRasterImageContentType(contentType)) {
    return
  }

  let imageBuffer: Buffer
  try {
    imageBuffer = await getObjectBufferForOwner(ownerId, s3Key)
  } catch (e) {
    console.error("[client-gallery face-identity] getObject", assetId, e)
    return
  }

  const collectionId = collectionIdForAlbum(albumId)
  await ensureCollection(client, collectionId)

  let indexOut
  try {
    indexOut = await client.send(
      new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: imageBuffer },
        ExternalImageId: assetId,
        MaxFaces: 15,
        QualityFilter: "AUTO",
      }),
    )
  } catch (e) {
    console.error("[client-gallery face-identity] IndexFaces", assetId, e)
    return
  }

  const records = indexOut.FaceRecords ?? []
  if (records.length === 0) return

  const meta = await sharp(imageBuffer).metadata()
  const imgW = meta.width ?? 0
  const imgH = meta.height ?? 0

  for (const fr of records) {
    const face = fr.Face
    const rekFaceId = face?.FaceId
    const bbox = face?.BoundingBox
    if (!rekFaceId || !bbox || bbox.Left == null || bbox.Top == null || !bbox.Width || !bbox.Height) {
      continue
    }

    let personId: string | null = null
    try {
      const search = await client.send(
        new SearchFacesCommand({
          CollectionId: collectionId,
          FaceId: rekFaceId,
          FaceMatchThreshold: MATCH_THRESHOLD,
          MaxFaces: 40,
        }),
      )
      const matches = search.FaceMatches ?? []
      for (const m of matches) {
        const otherId = m.Face?.FaceId
        if (!otherId || otherId === rekFaceId) continue
        const found = await sql`
          SELECT person_identity_id
          FROM client_gallery_face_instances
          WHERE rekognition_face_id = ${otherId} AND album_id = ${albumId}
          LIMIT 1
        `
        const pid = (found[0] as { person_identity_id?: string } | undefined)?.person_identity_id
        if (pid) {
          personId = String(pid)
          break
        }
      }
    } catch (e) {
      console.error("[client-gallery face-identity] SearchFaces", rekFaceId, e)
    }

    if (!personId) {
      const ins = await sql`
        INSERT INTO client_gallery_person_identities (album_id)
        VALUES (${albumId})
        RETURNING id
      `
      personId = String((ins[0] as { id: string }).id)
    }

    const faceRow = await sql`
      INSERT INTO client_gallery_face_instances (
        album_id,
        asset_id,
        person_identity_id,
        rekognition_face_id,
        bbox_left,
        bbox_top,
        bbox_width,
        bbox_height
      )
      VALUES (
        ${albumId},
        ${assetId},
        ${personId},
        ${rekFaceId},
        ${bbox.Left},
        ${bbox.Top},
        ${bbox.Width},
        ${bbox.Height}
      )
      RETURNING id
    `
    const faceInstanceId = String((faceRow[0] as { id: string }).id)

    if (imgW > 0 && imgH > 0) {
      const pad = 0.05
      const l = Math.max(0, bbox.Left - pad * bbox.Width)
      const t = Math.max(0, bbox.Top - pad * bbox.Height)
      const w = Math.min(1 - l, bbox.Width * (1 + 2 * pad))
      const h = Math.min(1 - t, bbox.Height * (1 + 2 * pad))
      const leftPx = Math.floor(l * imgW)
      const topPx = Math.floor(t * imgH)
      const wPx = Math.min(imgW - leftPx, Math.ceil(w * imgW))
      const hPx = Math.min(imgH - topPx, Math.ceil(h * imgH))
      if (wPx > 8 && hPx > 8) {
        try {
          const thumbBuf = await sharp(imageBuffer)
            .extract({ left: leftPx, top: topPx, width: wPx, height: hPx })
            .resize(128, 128, { fit: "cover" })
            .jpeg({ quality: 82 })
            .toBuffer()
          const albumPrefix = s3Key.includes("/") ? s3Key.slice(0, s3Key.lastIndexOf("/") + 1) : ""
          const thumbKey = `${albumPrefix}face-thumbs/${faceInstanceId}.jpg`
          await putObjectBufferForOwner(ownerId, thumbKey, thumbBuf, "image/jpeg")
          await sql`
            UPDATE client_gallery_face_instances
            SET thumb_s3_key = ${thumbKey}
            WHERE id = ${faceInstanceId}
          `
        } catch (e) {
          console.error("[client-gallery face-identity] thumb", faceInstanceId, e)
        }
      }
    }
  }

  if (records.length > 0) {
    const debit = await maybeDebitFaceRecognitionForAssetPaisa(ownerId, assetId)
    if (!debit.ok) {
      console.error("[client-gallery face-identity] wallet debit failed", assetId, debit.error)
    }
  }
}

export async function deleteRekognitionFacesForAsset(albumId: string, assetId: string): Promise<void> {
  const client = rekognitionClient()
  if (!client) return

  const sql = getDb()
  let rows: { rekognition_face_id: string | null }[]
  try {
    rows = await sql`
      SELECT rekognition_face_id FROM client_gallery_face_instances
      WHERE album_id = ${albumId} AND asset_id = ${assetId} AND rekognition_face_id IS NOT NULL
    `
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") return
    throw e
  }

  const ids = rows.map((r) => r.rekognition_face_id).filter((x): x is string => Boolean(x))
  if (ids.length === 0) return

  const collectionId = collectionIdForAlbum(albumId)
  try {
    await client.send(
      new DeleteFacesCommand({
        CollectionId: collectionId,
        FaceIds: ids,
      }),
    )
  } catch (e) {
    console.error("[client-gallery face-identity] DeleteFaces asset", assetId, e)
  }
}

export async function deleteRekognitionCollectionForAlbum(albumId: string): Promise<void> {
  const client = rekognitionClient()
  if (!client) return
  const collectionId = collectionIdForAlbum(albumId)
  try {
    await client.send(new DeleteCollectionCommand({ CollectionId: collectionId }))
  } catch (e) {
    const name = (e as { name?: string })?.name
    if (name === "ResourceNotFoundException") return
    console.error("[client-gallery face-identity] DeleteCollection", albumId, e)
  }
}

export type PublicPersonIdentity = {
  id: string
  thumbUrl: string | null
  assetIds: string[]
}

export async function loadPersonIdentitiesForPublicAlbum(
  albumId: string,
  ownerUserId: string,
): Promise<PublicPersonIdentity[]> {
  const sql = getDb()
  try {
    const rows = await sql`
      SELECT fi.person_identity_id, fi.asset_id, fi.thumb_s3_key
      FROM client_gallery_face_instances fi
      WHERE fi.album_id = ${albumId}
      ORDER BY fi.person_identity_id, fi.created_at ASC
    `
    const byPerson = new Map<string, { assetIds: Set<string>; thumbKey: string | null }>()
    for (const r of rows) {
      const o = r as {
        person_identity_id?: string
        asset_id?: string
        thumb_s3_key?: string | null
      }
      const pid = String(o.person_identity_id ?? "")
      const aid = String(o.asset_id ?? "")
      if (!byPerson.has(pid)) {
        byPerson.set(pid, { assetIds: new Set(), thumbKey: null })
      }
      const entry = byPerson.get(pid)!
      entry.assetIds.add(aid)
      if (!entry.thumbKey && o.thumb_s3_key) {
        entry.thumbKey = String(o.thumb_s3_key)
      }
    }

    const result: PublicPersonIdentity[] = []
    for (const [personId, v] of byPerson) {
      let thumbUrl: string | null = null
      if (v.thumbKey) {
        try {
          thumbUrl = await presignGetObjectForOwner(ownerUserId, v.thumbKey, 3600)
        } catch {
          thumbUrl = null
        }
      }
      result.push({
        id: personId,
        thumbUrl,
        assetIds: [...v.assetIds],
      })
    }
    return result
  } catch (e) {
    if ((e as { code?: string })?.code === "42P01") {
      return []
    }
    throw e
  }
}
