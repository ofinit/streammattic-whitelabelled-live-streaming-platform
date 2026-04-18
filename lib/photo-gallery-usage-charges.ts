import { getDb } from "@/lib/db"
import { getPlatformSetting } from "@/lib/db-queries"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"
import { debitUserWalletPaisa } from "@/lib/photo-gallery-wallet"

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
