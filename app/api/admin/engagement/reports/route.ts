import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"
import {
  ADMIN_ENGAGEMENT_CAMPAIGNS,
  ADMIN_ENGAGEMENT_SEGMENT_LABELS,
  classifyAdminUserEngagement,
  type AdminEngagementSegment,
} from "@/lib/admin-user-engagement"
import { ensureAdminUserEngagementSchema } from "@/lib/admin-user-engagement-schema"

const SEGMENT_ORDER: AdminEngagementSegment[] = [
  "new_never_activated",
  "tried_once_stopped",
  "value_user_at_risk",
  "payment_blocked",
  "feature_unaware",
  "active",
]

function clampDays(value: string | null): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 30
  return Math.min(365, Math.max(1, Math.floor(parsed)))
}

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    const { searchParams } = new URL(req.url)
    const days = clampDays(searchParams.get("days"))
    const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const sql = getDb()
    await ensureAdminUserEngagementSchema()

    const [logRows, recentRows, followUpRows, userRows] = await Promise.all([
      sql`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'sent')::int AS sent,
          COUNT(*) FILTER (WHERE status = 'failed')::int AS failed,
          COUNT(*) FILTER (WHERE status = 'logged')::int AS logged,
          COUNT(*) FILTER (WHERE channel = 'email')::int AS email,
          COUNT(*) FILTER (WHERE channel = 'whatsapp')::int AS whatsapp,
          COUNT(*) FILTER (WHERE channel = 'call')::int AS call,
          COUNT(*) FILTER (WHERE channel = 'note')::int AS note
        FROM admin_user_engagement_logs
        WHERE created_at >= ${sinceIso}
      `,
      sql`
        SELECT
          l.id,
          l.user_id,
          l.campaign_type,
          l.channel,
          l.status,
          l.note,
          l.follow_up_at,
          l.created_at,
          u.name,
          u.email,
          u.role::text AS role
        FROM admin_user_engagement_logs l
        JOIN users u ON u.id = l.user_id
        WHERE l.created_at >= ${sinceIso}
        ORDER BY l.created_at DESC
        LIMIT 25
      `,
      sql`
        SELECT
          l.id,
          l.user_id,
          l.campaign_type,
          l.channel,
          l.note,
          l.follow_up_at,
          l.created_at,
          u.name,
          u.email,
          u.role::text AS role
        FROM admin_user_engagement_logs l
        JOIN users u ON u.id = l.user_id
        WHERE l.follow_up_at IS NOT NULL
          AND l.follow_up_at <= NOW() + INTERVAL '7 days'
        ORDER BY l.follow_up_at ASC
        LIMIT 25
      `,
      sql`
        SELECT
          u.id,
          u.name,
          u.email,
          u.role::text AS role,
          u.created_at,
          u.last_login_at,
          u.studio_subscription_expires_at,
          COALESCE(w.balance, 0) AS wallet_balance,
          COALESCE(uc.rtmp, 0) AS credits_rtmp,
          COALESCE(uc.youtube_api, 0) AS credits_youtube_api,
          COALESCE(uc.youtube_embed, 0) AS credits_youtube_embed,
          COALESCE(uc.third_party, 0) AS credits_third_party,
          COALESCE(uae.photo_gallery_enabled, false) AS photo_gallery_enabled,
          COALESCE(es.total_events, 0) AS engagement_total_events,
          COALESCE(es.completed_events, 0) AS engagement_completed_events,
          es.last_event_at AS engagement_last_event_at,
          es.last_live_at AS engagement_last_live_at,
          eng.last_contacted_at AS engagement_last_contacted_at,
          eng.last_campaign_type AS engagement_last_campaign_type,
          eng.follow_up_at AS engagement_follow_up_at,
          eng.note AS engagement_note,
          conv.first_contacted_at AS first_contacted_at,
          conv.relogin_after_contact AS relogin_after_contact,
          conv.events_after_contact AS events_after_contact,
          conv.wallet_txns_after_contact AS wallet_txns_after_contact,
          conv.orders_after_contact AS orders_after_contact
        FROM users u
        LEFT JOIN wallets w ON u.id = w.user_id
        LEFT JOIN user_credits uc ON u.id = uc.user_id
        LEFT JOIN user_addon_entitlements uae ON u.id = uae.user_id
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)::int AS total_events,
            COUNT(*) FILTER (WHERE e.status::text IN ('live', 'completed', 'ended'))::int AS completed_events,
            MAX(e.created_at) AS last_event_at,
            MAX(COALESCE(e.started_at, e.created_at)) FILTER (WHERE e.status::text IN ('live', 'completed', 'ended')) AS last_live_at
          FROM events e
          WHERE e.user_id = u.id
        ) es ON true
        LEFT JOIN LATERAL (
          SELECT
            MAX(l.created_at) AS last_contacted_at,
            (ARRAY_AGG(l.campaign_type ORDER BY l.created_at DESC))[1] AS last_campaign_type,
            (ARRAY_AGG(l.follow_up_at ORDER BY l.created_at DESC))[1] AS follow_up_at,
            (ARRAY_AGG(l.note ORDER BY l.created_at DESC))[1] AS note
          FROM admin_user_engagement_logs l
          WHERE l.user_id = u.id
        ) eng ON true
        LEFT JOIN LATERAL (
          SELECT
            MIN(l.created_at) FILTER (WHERE l.created_at >= ${sinceIso}) AS first_contacted_at,
            EXISTS (
              SELECT 1 FROM admin_user_engagement_logs l2
              WHERE l2.user_id = u.id
                AND l2.created_at >= ${sinceIso}
                AND u.last_login_at IS NOT NULL
                AND u.last_login_at > l2.created_at
            ) AS relogin_after_contact,
            (
              SELECT COUNT(*)::int
              FROM events e2
              WHERE e2.user_id = u.id
                AND e2.created_at > (
                  SELECT MIN(l3.created_at)
                  FROM admin_user_engagement_logs l3
                  WHERE l3.user_id = u.id AND l3.created_at >= ${sinceIso}
                )
            ) AS events_after_contact,
            (
              SELECT COUNT(*)::int
              FROM wallet_transactions wt
              JOIN wallets w2 ON w2.id = wt.wallet_id
              WHERE w2.user_id = u.id
                AND wt.created_at > (
                  SELECT MIN(l4.created_at)
                  FROM admin_user_engagement_logs l4
                  WHERE l4.user_id = u.id AND l4.created_at >= ${sinceIso}
                )
            ) AS wallet_txns_after_contact,
            (
              SELECT COUNT(*)::int
              FROM orders o
              WHERE o.user_id = u.id
                AND o.created_at > (
                  SELECT MIN(l5.created_at)
                  FROM admin_user_engagement_logs l5
                  WHERE l5.user_id = u.id AND l5.created_at >= ${sinceIso}
                )
            ) AS orders_after_contact
        ) conv ON true
        WHERE u.role IN ('studio', 'streamer')
      `,
    ])

    const segmentCounts = new Map<AdminEngagementSegment, number>(SEGMENT_ORDER.map((segment) => [segment, 0]))
    let contactedUsers = 0
    let reloginsAfterContact = 0
    let usersWithEventsAfterContact = 0
    let usersWithWalletActivityAfterContact = 0
    let usersWithOrdersAfterContact = 0

    for (const row of userRows as Array<Record<string, unknown>>) {
      const credits = {
        rtmp: Number(row.credits_rtmp ?? 0),
        youtube_api: Number(row.credits_youtube_api ?? 0),
        youtube_embed: Number(row.credits_youtube_embed ?? 0),
        third_party: Number(row.credits_third_party ?? 0),
      }
      const summary = classifyAdminUserEngagement({
        role: String(row.role ?? ""),
        createdAt: row.created_at as string | Date | null,
        lastLoginAt: row.last_login_at as string | Date | null,
        totalEvents: Number(row.engagement_total_events ?? 0),
        completedEvents: Number(row.engagement_completed_events ?? 0),
        lastEventAt: row.engagement_last_event_at as string | Date | null,
        lastLiveAt: row.engagement_last_live_at as string | Date | null,
        walletBalance: Number(row.wallet_balance ?? 0),
        totalCreditsRemaining: Object.values(credits).reduce((sum, value) => sum + value, 0),
        studioSubscriptionExpiresAt: row.studio_subscription_expires_at as string | Date | null,
        photoGalleryEnabled: row.photo_gallery_enabled === true,
        lastContactedAt: row.engagement_last_contacted_at as string | Date | null,
        lastCampaignType: row.engagement_last_campaign_type as string | null,
        followUpAt: row.engagement_follow_up_at as string | Date | null,
        note: row.engagement_note as string | null,
      })
      segmentCounts.set(summary.segment, (segmentCounts.get(summary.segment) ?? 0) + 1)

      if (row.first_contacted_at) {
        contactedUsers += 1
        if (row.relogin_after_contact === true) reloginsAfterContact += 1
        if (Number(row.events_after_contact ?? 0) > 0) usersWithEventsAfterContact += 1
        if (Number(row.wallet_txns_after_contact ?? 0) > 0) usersWithWalletActivityAfterContact += 1
        if (Number(row.orders_after_contact ?? 0) > 0) usersWithOrdersAfterContact += 1
      }
    }

    const logStats = (logRows[0] ?? {}) as Record<string, unknown>
    return NextResponse.json({
      success: true,
      days,
      overview: {
        totalActions: Number(logStats.total ?? 0),
        sent: Number(logStats.sent ?? 0),
        failed: Number(logStats.failed ?? 0),
        logged: Number(logStats.logged ?? 0),
        contactedUsers,
        reloginsAfterContact,
        usersWithEventsAfterContact,
        usersWithWalletActivityAfterContact,
        usersWithOrdersAfterContact,
      },
      channels: {
        email: Number(logStats.email ?? 0),
        whatsapp: Number(logStats.whatsapp ?? 0),
        call: Number(logStats.call ?? 0),
        note: Number(logStats.note ?? 0),
      },
      segments: SEGMENT_ORDER.map((segment) => ({
        segment,
        label: ADMIN_ENGAGEMENT_SEGMENT_LABELS[segment],
        count: segmentCounts.get(segment) ?? 0,
      })),
      campaigns: ADMIN_ENGAGEMENT_CAMPAIGNS.map((campaign) => ({ type: campaign.type, label: campaign.label })),
      recentActivity: recentRows,
      upcomingFollowUps: followUpRows,
    })
  } catch (error: any) {
    console.error("[admin/engagement/reports]", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

