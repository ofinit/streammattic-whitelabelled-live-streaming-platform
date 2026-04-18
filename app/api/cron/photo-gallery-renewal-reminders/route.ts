import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { isPgUndefinedColumnError } from "@/lib/client-gallery-album-service"
import { parsePhotoGalleryAddon, PHOTO_GALLERY_PLATFORM_SETTING_KEY } from "@/lib/photo-gallery-addon"
import { getPlatformSetting } from "@/lib/db-queries"
import { sendPhotoGalleryRenewalReminder } from "@/lib/email"
import {
  calendarDaysAfterPhotoGalleryExpiry,
  calendarDaysUntilSubscriptionEnd,
  PHOTO_GALLERY_PRE_REMINDER_DAYS,
} from "@/lib/photo-gallery-reminder-helpers"

/**
 * Daily: email reminders for client photo gallery subscription (pre/post/long-tail schedule).
 * Secure with CRON_SECRET (same as other crons).
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

  const raw = await getPlatformSetting(PHOTO_GALLERY_PLATFORM_SETTING_KEY)
  const catalog = parsePhotoGalleryAddon(raw)
  if (catalog.listingEnabled !== true) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const productName = catalog.productName?.trim() || "Client photo gallery"
  const sql = getDb()

  let rows: Record<string, unknown>[]
  try {
    rows = await sql`
      SELECT
        u.id AS user_id,
        u.email,
        u.name,
        u.role,
        uae.photo_gallery_enabled,
        uae.photo_gallery_opt_in,
        uae.photo_gallery_subscription_expires_at
      FROM user_addon_entitlements uae
      INNER JOIN users u ON u.id = uae.user_id
      WHERE uae.photo_gallery_enabled = true
        AND uae.photo_gallery_opt_in = true
        AND (u.role = 'streamer' OR u.role = 'studio')
        AND uae.photo_gallery_subscription_expires_at IS NOT NULL
    `
  } catch (e) {
    if (isPgUndefinedColumnError(e)) {
      return NextResponse.json({ ok: false, error: "migration_required" }, { status: 503 })
    }
    throw e
  }

  let sent = 0

  for (const row of rows) {
    const email = row.email as string
    if (!email?.trim()) continue

    const role = String(row.role ?? "")
    const renewUrl = role === "studio" ? `${baseUrl}/studio/packages` : `${baseUrl}/streamer/packages`
    const name = String(row.name ?? "")
    const expRaw = row.photo_gallery_subscription_expires_at as string | Date
    const expIso = typeof expRaw === "string" ? expRaw : expRaw.toISOString()
    const expMs = new Date(expIso).getTime()
    if (Number.isNaN(expMs)) continue

    const nowMs = Date.now()
    const periodEndForDedup = expIso

    if (expMs > nowMs) {
      const daysLeft = calendarDaysUntilSubscriptionEnd(expIso)
      for (const d of PHOTO_GALLERY_PRE_REMINDER_DAYS) {
        if (daysLeft !== d) continue
        const reminderKey = `pre_${d}`
        const inserted = await sql`
          INSERT INTO photo_gallery_renewal_reminders (user_id, period_end_at, reminder_key)
          VALUES (${String(row.user_id)}, ${periodEndForDedup}::timestamptz, ${reminderKey})
          ON CONFLICT (user_id, period_end_at, reminder_key) DO NOTHING
          RETURNING id
        `
        if (inserted.length === 0) continue
        const okSend = await sendPhotoGalleryRenewalReminder({
          toEmail: email,
          name,
          productName,
          kind: "pre",
          daysLeft: d,
          renewUrl,
        })
        if (okSend) sent++
      }
      continue
    }

    const daysAfter = calendarDaysAfterPhotoGalleryExpiry(expIso)

    if (daysAfter >= 1 && daysAfter <= 7) {
      const reminderKey = `post_${daysAfter}`
      const inserted = await sql`
        INSERT INTO photo_gallery_renewal_reminders (user_id, period_end_at, reminder_key)
        VALUES (${String(row.user_id)}, ${periodEndForDedup}::timestamptz, ${reminderKey})
        ON CONFLICT (user_id, period_end_at, reminder_key) DO NOTHING
        RETURNING id
      `
      if (inserted.length === 0) continue
      const okSend = await sendPhotoGalleryRenewalReminder({
        toEmail: email,
        name,
        productName,
        kind: "post_week",
        daysOverdue: daysAfter,
        renewUrl,
      })
      if (okSend) sent++
      continue
    }

    if (daysAfter >= 8) {
      const now = new Date()
      const dom = now.getUTCDate()
      if (dom !== 1 && dom !== 15) continue
      const y = now.getUTCFullYear()
      const m = String(now.getUTCMonth() + 1).padStart(2, "0")
      const reminderKey = `long_${y}-${m}_d${dom}`
      const inserted = await sql`
        INSERT INTO photo_gallery_renewal_reminders (user_id, period_end_at, reminder_key)
        VALUES (${String(row.user_id)}, ${periodEndForDedup}::timestamptz, ${reminderKey})
        ON CONFLICT (user_id, period_end_at, reminder_key) DO NOTHING
        RETURNING id
      `
      if (inserted.length === 0) continue
      const okSend = await sendPhotoGalleryRenewalReminder({
        toEmail: email,
        name,
        productName,
        kind: "long_tail",
        renewUrl,
      })
      if (okSend) sent++
    }
  }

  return NextResponse.json({ ok: true, checked: rows.length, emailsSent: sent })
}
