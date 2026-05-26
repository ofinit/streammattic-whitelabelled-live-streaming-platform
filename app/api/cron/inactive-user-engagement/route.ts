import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { classifyAdminUserEngagement } from "@/lib/admin-user-engagement"
import { ensureAdminUserEngagementSchema } from "@/lib/admin-user-engagement-schema"
import {
  AUTOMATED_ENGAGEMENT_SOURCE,
  shouldSendAutomatedEngagementEmail,
} from "@/lib/admin-user-engagement-automation"
import { sendInactiveUserEngagementEmail } from "@/lib/email"

type CandidateRow = Record<string, unknown> & {
  id: string
  email: string
  name: string | null
  role: string
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  const headerSecret = request.headers.get("x-cron-secret")
  const urlSecret = new URL(request.url).searchParams.get("secret")
  return auth === `Bearer ${secret}` || headerSecret === secret || urlSecret === secret
}

function requestOrigin(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
  if (envUrl?.trim()) return envUrl.trim().replace(/\/$/, "")
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

function positiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(max, Math.floor(parsed))
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get("dryRun") === "1" || url.searchParams.get("dryRun") === "true"
  const limit = positiveInt(url.searchParams.get("limit"), 50, 200)
  const minContactGapDays = positiveInt(url.searchParams.get("minContactGapDays"), 14, 365)
  const minSameCampaignGapDays = positiveInt(url.searchParams.get("minSameCampaignGapDays"), 30, 365)
  const roleFilter = url.searchParams.get("role")
  const allowedRoles = roleFilter === "studio" || roleFilter === "streamer" ? new Set([roleFilter]) : null
  const appUrl = requestOrigin(request)

  const sql = getDb()
  await ensureAdminUserEngagementSchema()

  const rows = (await sql`
    SELECT
      u.id,
      u.email,
      u.name,
      u.role::text AS role,
      u.status::text AS status,
      u.created_at,
      u.last_login_at,
      u.studio_subscription_expires_at,
      COALESCE(uae.photo_gallery_enabled, false) AS photo_gallery_enabled,
      COALESCE(w.balance, 0) AS wallet_balance,
      COALESCE(uc.rtmp, 0) AS credits_rtmp,
      COALESCE(uc.youtube_api, 0) AS credits_youtube_api,
      COALESCE(uc.youtube_embed, 0) AS credits_youtube_embed,
      COALESCE(uc.third_party, 0) AS credits_third_party,
      COALESCE(es.total_events, 0) AS engagement_total_events,
      COALESCE(es.completed_events, 0) AS engagement_completed_events,
      es.last_event_at AS engagement_last_event_at,
      es.last_live_at AS engagement_last_live_at,
      eng.last_contacted_at AS engagement_last_contacted_at,
      eng.last_campaign_type AS engagement_last_campaign_type,
      eng.follow_up_at AS engagement_follow_up_at,
      eng.note AS engagement_note
    FROM users u
    LEFT JOIN user_addon_entitlements uae ON u.id = uae.user_id
    LEFT JOIN wallets w ON u.id = w.user_id
    LEFT JOIN user_credits uc ON u.id = uc.user_id
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
    WHERE u.role::text IN ('studio', 'streamer')
      AND COALESCE(u.status::text, 'active') = 'active'
      AND NULLIF(TRIM(u.email), '') IS NOT NULL
    ORDER BY u.created_at ASC
    LIMIT 1000
  `) as CandidateRow[]

  let sent = 0
  let failed = 0
  let selected = 0
  const skipped: Array<{ userId: string; email: string; reason: string }> = []
  const results: Array<{
    userId: string
    email: string
    segment: string
    campaignType: string
    status: "sent" | "failed" | "dry_run"
  }> = []

  for (const row of rows) {
    if (allowedRoles && !allowedRoles.has(row.role)) continue
    if (selected >= limit) break

    const credits = {
      rtmp: Number(row.credits_rtmp ?? 0),
      youtubeApi: Number(row.credits_youtube_api ?? 0),
      youtubeEmbed: Number(row.credits_youtube_embed ?? 0),
      thirdParty: Number(row.credits_third_party ?? 0),
    }
    const engagement = classifyAdminUserEngagement({
      role: row.role,
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
    const decision = shouldSendAutomatedEngagementEmail(engagement, {
      minContactGapDays,
      minSameCampaignGapDays,
    })

    if (!decision.shouldSend || !decision.campaignType) {
      if (skipped.length < 25) {
        skipped.push({ userId: row.id, email: row.email, reason: decision.reason })
      }
      continue
    }

    selected++

    if (dryRun) {
      results.push({
        userId: row.id,
        email: row.email,
        segment: engagement.segment,
        campaignType: decision.campaignType,
        status: "dry_run",
      })
      continue
    }

    const note = `Automated inactive engagement: ${decision.reason}`
    const ok = await sendInactiveUserEngagementEmail({
      toEmail: row.email,
      name: String(row.name || ""),
      role: row.role,
      campaignType: decision.campaignType,
      appUrl,
    })
    const status = ok ? "sent" : "failed"

    await sql`
      INSERT INTO admin_user_engagement_logs
        (user_id, created_by, campaign_type, channel, status, subject, note, follow_up_at, metadata)
      VALUES
        (
          ${row.id},
          ${null},
          ${decision.campaignType},
          'email',
          ${status},
          ${null},
          ${note},
          ${null},
          ${JSON.stringify({
            source: AUTOMATED_ENGAGEMENT_SOURCE,
            segment: engagement.segment,
            priority: engagement.priority,
            reason: decision.reason,
          })}::jsonb
        )
    `

    if (ok) sent++
    else failed++
    results.push({
      userId: row.id,
      email: row.email,
      segment: engagement.segment,
      campaignType: decision.campaignType,
      status,
    })
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    checked: rows.length,
    selected,
    sent,
    failed,
    skippedPreview: skipped,
    results,
  })
}

