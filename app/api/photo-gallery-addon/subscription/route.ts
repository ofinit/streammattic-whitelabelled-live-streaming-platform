import { getDb } from "@/lib/db"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"
import { isPgUndefinedColumnError } from "@/lib/client-gallery-album-service"
import { fetchPhotoGalleryEntitlementRow, addMonthsFromNow } from "@/lib/photo-gallery-subscription"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"
import { getPlatformSetting } from "@/lib/db-queries"
import { debitUserWalletPaisa } from "@/lib/photo-gallery-wallet"

export const dynamic = "force-dynamic"

const FAR_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000

/**
 * Opt in / out of client photo gallery subscription (wallet debit on opt-in when monthly price > 0).
 */
export const PATCH = withAuth(async (user, request: Request) => {
  const role = user.role as string
  if (role !== "studio" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }
  const uid = String(user.id)

  let body: { optIn?: unknown }
  try {
    body = (await request.json()) as { optIn?: unknown }
  } catch {
    return jsonError("Invalid JSON body", 400)
  }
  if (typeof body.optIn !== "boolean") {
    return jsonError("optIn boolean required", 400)
  }

  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const catalog = parsePhotoGalleryAddon(raw)
  if (catalog.listingEnabled !== true) {
    return jsonError("Photo gallery add-on is not available", 403)
  }

  const row = await fetchPhotoGalleryEntitlementRow(uid)
  if (!row?.photoGalleryEnabled) {
    return jsonError(
      "Your administrator must enable this add-on for your account before you can subscribe.",
      403,
    )
  }

  const monthly = catalog.monthlyPricePaisa

  if (body.optIn) {
    const exp = row.photoGallerySubscriptionExpiresAt
    if (row.photoGalleryOptIn && exp) {
      const t = new Date(exp).getTime()
      if (!Number.isNaN(t) && t > Date.now()) {
        return jsonOk({
          ok: true,
          optIn: true,
          subscriptionExpiresAt: exp,
          alreadyActive: true,
        })
      }
    }
  }

  const sql = getDb()

  if (!body.optIn) {
    try {
      await sql`
        UPDATE user_addon_entitlements
        SET
          photo_gallery_opt_in = false,
          updated_at = NOW()
        WHERE user_id = ${uid}
      `
    } catch (e) {
      if (isPgUndefinedColumnError(e)) {
        return jsonError("Database migration required: run scripts/ensure-photo-gallery-subscription-schema.sql", 503)
      }
      throw e
    }
    return jsonOk({ ok: true, optIn: false })
  }

  let expiresAt: Date
  if (monthly <= 0) {
    expiresAt = new Date(Date.now() + FAR_YEARS_MS)
  } else {
    const debit = await debitUserWalletPaisa({
      userId: uid,
      amountPaisa: monthly,
      category: "photo_gallery_subscription",
      description: `${catalog.productName || "Client photo gallery"} — monthly subscription`,
      referenceType: "photo_gallery_subscription",
    })
    if (!debit.ok) {
      return jsonError(
        debit.error === "Insufficient wallet balance"
          ? "Insufficient wallet balance. Add funds under Billing & Wallet, then try again."
          : debit.error,
        402,
      )
    }
    expiresAt = addMonthsFromNow(1)
  }

  try {
    await sql`
      UPDATE user_addon_entitlements
      SET
        photo_gallery_opt_in = true,
        photo_gallery_subscription_expires_at = ${expiresAt.toISOString()}::timestamptz,
        photo_gallery_billing_period_start = NOW(),
        updated_at = NOW()
      WHERE user_id = ${uid}
    `
  } catch (e) {
    if (isPgUndefinedColumnError(e)) {
      return jsonError("Database migration required: run scripts/ensure-photo-gallery-subscription-schema.sql", 503)
    }
    throw e
  }

  return jsonOk({
    ok: true,
    optIn: true,
    subscriptionExpiresAt: expiresAt.toISOString(),
  })
})
