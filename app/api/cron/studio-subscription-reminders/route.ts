import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendStudioSubscriptionRenewalReminder } from "@/lib/email"
import {
  STUDIO_SUBSCRIPTION_REMINDER_THRESHOLDS,
  calendarDaysUntilSubscriptionEnd,
  isStudioSubscriptionPastDue,
} from "@/lib/studio-subscription-shared"

/**
 * Daily job: email studio users at 30, 15, 7, 3, 2, 1, and 0 days before subscription end.
 * Secure with Authorization: Bearer ${CRON_SECRET} or x-cron-secret header (Vercel Cron sends none by default—set CRON_SECRET in project and add header in vercel.json when supported, or call manually).
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
  const renewUrl = `${baseUrl}/studio/settings`

  const sql = getDb()
  const rows = await sql`
    SELECT id, email, name, studio_subscription_expires_at
    FROM users
    WHERE role = 'studio'
      AND studio_subscription_expires_at IS NOT NULL
  `

  let sent = 0
  for (const row of rows) {
    const expiresAt = row.studio_subscription_expires_at as string | Date
    if (!expiresAt) continue
    const iso = typeof expiresAt === "string" ? expiresAt : expiresAt.toISOString()
    if (isStudioSubscriptionPastDue(iso)) continue

    const daysLeft = calendarDaysUntilSubscriptionEnd(iso)
    if (!STUDIO_SUBSCRIPTION_REMINDER_THRESHOLDS.includes(daysLeft as (typeof STUDIO_SUBSCRIPTION_REMINDER_THRESHOLDS)[number])) {
      continue
    }

    const inserted = await sql`
      INSERT INTO studio_subscription_reminders (user_id, period_end_at, threshold_days)
      VALUES (${row.id as string}, ${iso}, ${daysLeft})
      ON CONFLICT (user_id, period_end_at, threshold_days) DO NOTHING
      RETURNING id
    `

    if (inserted.length === 0) continue

    const email = row.email as string
    const name = (row.name as string) || ""
    const okSend = await sendStudioSubscriptionRenewalReminder({
      toEmail: email,
      name,
      daysLeft,
      renewUrl,
    })
    if (okSend) sent++
  }

  return NextResponse.json({ ok: true, checked: rows.length, emailsSent: sent })
}
