import { getDb } from "@/lib/db"
import { isStudioSubscriptionPastDue } from "@/lib/studio-subscription-shared"

export {
  STUDIO_SUBSCRIPTION_REMINDER_THRESHOLDS,
  calendarDaysUntilSubscriptionEnd,
  isStudioSubscriptionPastDue,
  shouldShowStudioRenewalDashboardAlert,
  studioSubscriptionExpiredForEvents,
} from "@/lib/studio-subscription-shared"
export type { StudioSubscriptionReminderDay } from "@/lib/studio-subscription-shared"

/** Streamer → Studio (first payment) or Studio renewal: +1 year from max(current expiry, now); role upgrade only if streamer. */
export async function applyStudioUpgradeOrRenewal(userId: string): Promise<void> {
  const sql = getDb()
  await sql`
    UPDATE users SET
      studio_subscription_expires_at =
        GREATEST(COALESCE(studio_subscription_expires_at, NOW()), NOW()) + INTERVAL '1 year',
      role = CASE WHEN role::text = 'streamer' THEN 'studio'::user_role ELSE role END,
      updated_at = NOW()
    WHERE id = ${userId}
  `
}

/** For use inside `pg` transactions (wallet checkout). */
export function applyStudioUpgradeOrRenewalSql(): string {
  return `UPDATE users SET
      studio_subscription_expires_at = GREATEST(COALESCE(studio_subscription_expires_at, NOW()), NOW()) + INTERVAL '1 year',
      role = CASE WHEN role::text = 'streamer' THEN 'studio'::user_role ELSE role END,
      updated_at = NOW()
    WHERE id = $1`
}

type SqlFn = ReturnType<typeof getDb>

/**
 * When `studio_subscription_expires_at` is in the past, the account must behave as Streamer.
 * Paid renewals use admin-configured Studio rates (`studio_annual_subscription`); complimentary/admin grants use the same field and rules.
 */
export async function downgradeExpiredStudioIfNeeded(
  sql: SqlFn,
  user: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  if (user.role !== "studio") return user
  const raw = user.studioSubscriptionExpiresAt
  if (raw == null || raw === "") return user
  const iso = typeof raw === "string" ? raw : (raw as Date).toISOString()
  if (!isStudioSubscriptionPastDue(iso)) return user
  const id = user.id as string
  await sql`
    UPDATE users
    SET role = 'streamer', updated_at = NOW()
    WHERE id = ${id} AND role = 'studio'
  `
  return { ...user, role: "streamer" }
}

export async function checkStudioSubscriptionActiveForEventManagement(
  sql: SqlFn,
  userId: string,
  userRole: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (userRole !== "studio") return { ok: true }
  const rows = await sql`
    SELECT studio_subscription_expires_at
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `
  const exp = rows[0]?.studio_subscription_expires_at as string | Date | null | undefined
  if (exp == null) {
    return {
      ok: false,
      message: "Studio subscription is not active. Renew your plan in Settings to create or edit events.",
    }
  }
  const iso = typeof exp === "string" ? exp : exp.toISOString()
  if (isStudioSubscriptionPastDue(iso)) {
    return {
      ok: false,
      message: "Your Studio subscription has expired. Renew in Settings → Studio subscription to manage events.",
    }
  }
  return { ok: true }
}
