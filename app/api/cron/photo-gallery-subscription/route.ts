import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { isPgUndefinedColumnError } from "@/lib/client-gallery-album-service"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"
import { getPlatformSetting } from "@/lib/db-queries"
import { debitUserWalletPaisa } from "@/lib/photo-gallery-wallet"
import { addMonthsFromNow } from "@/lib/photo-gallery-subscription"
import { sendPhotoGalleryPaymentFailedEmail } from "@/lib/email"

const FAR_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000

/**
 * Daily: renew client photo gallery subscriptions from wallet; disable on insufficient funds.
 * Secure with Authorization: Bearer ${CRON_SECRET} or x-cron-secret.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  const headerSecret = request.headers.get("x-cron-secret")
  const ok =
    (secret && auth === `Bearer ${secret}`) ||
    (secret && headerSecret === secret) ||
    (!secret && process.env.NODE_ENV !== "production")

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://streamlivee.com").replace(/\/$/, "")
  const renewUrl = `${baseUrl}/streamer/packages`

  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const catalog = parsePhotoGalleryAddon(raw)
  if (catalog.listingEnabled !== true) {
    return NextResponse.json({ ok: true, skipped: true, reason: "catalog_off" })
  }

  const sql = getDb()
  let rows: Record<string, unknown>[]
  try {
    rows = await sql`
      SELECT
        uae.user_id,
        u.email,
        u.name,
        u.role,
        uae.photo_gallery_opt_in,
        uae.photo_gallery_subscription_expires_at
      FROM user_addon_entitlements uae
      INNER JOIN users u ON u.id = uae.user_id
      WHERE uae.photo_gallery_enabled = true
        AND uae.photo_gallery_opt_in = true
        AND (u.role = 'streamer' OR u.role = 'studio')
    `
  } catch (e) {
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json({ ok: false, error: "migration_required" }, { status: 503 })
    }
    throw e
  }

  let renewed = 0
  let failed = 0
  const monthly = catalog.monthlyPricePaisa
  const productName = catalog.productName?.trim() || "Client photo gallery"

  for (const row of rows) {
    const userId = String(row.user_id)
    const email = String(row.email ?? "")
    const name = String(row.name ?? "")
    const expRaw = row.photo_gallery_subscription_expires_at as string | Date | null | undefined

    if (monthly <= 0) {
      if (!expRaw || new Date(expRaw as string | Date).getTime() <= Date.now()) {
        const far = new Date(Date.now() + FAR_YEARS_MS)
        try {
          await sql`
            UPDATE user_addon_entitlements
            SET
              photo_gallery_subscription_expires_at = ${far.toISOString()}::timestamptz,
              updated_at = NOW()
            WHERE user_id = ${userId}
          `
          renewed++
        } catch (err) {
          console.error("[cron photo-gallery-subscription] free tier extend", err)
        }
      }
      continue
    }

    const exp = expRaw ? new Date(expRaw as string | Date).getTime() : 0
    if (!expRaw || Number.isNaN(exp) || exp > Date.now()) {
      continue
    }

    const debit = await debitUserWalletPaisa({
      userId,
      amountPaisa: monthly,
      category: "photo_gallery_subscription",
      description: `${productName} — monthly renewal`,
      referenceType: "photo_gallery_subscription",
    })

    if (!debit.ok) {
      failed++
      try {
        await sql`
          UPDATE user_addon_entitlements
          SET
            photo_gallery_opt_in = false,
            updated_at = NOW()
          WHERE user_id = ${userId}
        `
      } catch (err) {
        console.error("[cron photo-gallery-subscription] opt-out on fail", err)
      }
      if (email) {
        const pkgUrl = row.role === "studio" ? `${baseUrl}/studio/packages` : renewUrl
        await sendPhotoGalleryPaymentFailedEmail({
          toEmail: email,
          name,
          productName,
          renewUrl: pkgUrl,
        })
      }
      continue
    }

    const next = addMonthsFromNow(1)
    await sql`
      UPDATE user_addon_entitlements
      SET
        photo_gallery_subscription_expires_at = ${next.toISOString()}::timestamptz,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `
    renewed++
  }

  return NextResponse.json({ ok: true, checked: rows.length, renewed, failed })
}
