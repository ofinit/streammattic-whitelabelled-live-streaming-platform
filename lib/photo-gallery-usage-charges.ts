import { getDb } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"
import { debitUserWalletPaisa } from "@/lib/photo-gallery-wallet"

/** Wallet idempotency for one debit per asset after face-identity processing. */
export const CLIENT_GALLERY_FACE_IDENTITY_REF_TYPE = "client_gallery_face_identity" as const

export async function maybeDebitAlbumCreatePaisa(
  userId: string,
  albumId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const p = parsePhotoGalleryAddon(raw).albumCreatePricePaisa
  if (!p || p <= 0) return { ok: true }
  return debitUserWalletPaisa({
    userId,
    amountPaisa: p,
    category: "photo_gallery_usage",
    description: "Client photo gallery — new album",
    referenceId: albumId,
    referenceType: "client_gallery_album",
  })
}

export async function maybeDebitUploadPaisa(userId: string, albumId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const p = parsePhotoGalleryAddon(raw).uploadPricePaisa
  if (!p || p <= 0) return { ok: true }
  return debitUserWalletPaisa({
    userId,
    amountPaisa: p,
    category: "photo_gallery_usage",
    description: "Client photo gallery — upload",
    referenceId: albumId,
    referenceType: "client_gallery_upload",
  })
}

export async function deleteAlbumByIdForUser(userId: string, albumId: string): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM client_gallery_albums WHERE id = ${albumId} AND user_id = ${userId}`
}

/**
 * Retail wallet debit for Rekognition face-identity processing (per image with at least one face stored).
 * Idempotent: same assetId never debited twice.
 */
export async function maybeDebitFaceRecognitionForAssetPaisa(
  userId: string,
  assetId: string,
): Promise<
  | { ok: true; skipped?: true }
  | { ok: true; balanceAfter: number; walletId: string }
  | { ok: false; error: string }
> {
  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const p = parsePhotoGalleryAddon(raw).faceIndexCreditPricePaisa
  if (!p || p <= 0) return { ok: true, skipped: true }

  const sql = getDb()
  const existing = await sql`
    SELECT id FROM wallet_transactions
    WHERE user_id = ${userId}
      AND reference_type = ${CLIENT_GALLERY_FACE_IDENTITY_REF_TYPE}
      AND reference_id = ${assetId}
    LIMIT 1
  `
  if (existing.length > 0) return { ok: true, skipped: true }

  return debitUserWalletPaisa({
    userId,
    amountPaisa: p,
    category: "photo_gallery_usage",
    description: "Client photo gallery — face recognition (per processed image)",
    referenceId: assetId,
    referenceType: CLIENT_GALLERY_FACE_IDENTITY_REF_TYPE,
  })
}
