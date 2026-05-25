import { NextResponse } from "next/server"
import { requireRole, createUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { classifyAdminUserEngagement } from "@/lib/admin-user-engagement"
import { ensureAdminUserEngagementSchema } from "@/lib/admin-user-engagement-schema"

/** Emails are unique for all users; lists filter by role — explain where the account appears. */
async function messageForDuplicateEmail(emailFromBody: string | undefined): Promise<string> {
  const normalized = (emailFromBody ?? "").trim().toLowerCase()
  if (!normalized) return "A user with this email already exists"
  const sql = getDb()
  const rows = await sql`
    SELECT role::text AS role FROM users WHERE LOWER(TRIM(email)) = ${normalized} LIMIT 1
  `
  const row = rows[0] as { role?: string } | undefined
  const role = row?.role ?? "unknown"
  if (role === "streamer") {
    return "This email is already a streamer account. Use Streamers to find them, or try refreshing the page."
  }
  if (role === "studio") {
    return "This email is already a studio account. Open Admin → Studios to manage it; streamers and studios are separate lists."
  }
  if (role === "admin") {
    return "This email is already an admin account. Admins do not appear under Streamers or Studios."
  }
  return `This email is already registered (${role}). One login email cannot be reused for another role; use a different address or change the user’s role in the database.`
}

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role") || "streamer"
    
    // Use u.* so optional columns (e.g. custom_pricing, studio_subscription_expires_at) missing on older DBs do not break the query.
    const sql = getDb()
    await ensureAdminUserEngagementSchema()
    const rows =
      role === "all"
        ? await sql(`
          SELECT u.*, sb.platform_name AS branding_platform_name, sb.primary_color AS branding_primary_color,
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
          LEFT JOIN studio_branding sb ON u.id = sb.user_id
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
          ORDER BY u.created_at DESC
        `)
        : await sql(
            `
          SELECT u.*, sb.platform_name AS branding_platform_name, sb.primary_color AS branding_primary_color,
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
          LEFT JOIN studio_branding sb ON u.id = sb.user_id
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
          WHERE u.role = $1
          ORDER BY u.created_at DESC
        `,
            [role],
          )

    // Mock data compatibility wrapper
    const users = rows.map((r) => {
      const row = r as Record<string, unknown>
      const roleVal = String(row.role ?? "")
      const credits = {
        rtmp: Number(row.credits_rtmp ?? 0),
        youtube_api: Number(row.credits_youtube_api ?? 0),
        youtube_embed: Number(row.credits_youtube_embed ?? 0),
        third_party: Number(row.credits_third_party ?? 0),
      }
      const walletBalance = Number(row.wallet_balance ?? 0) || 0
      const engagement = classifyAdminUserEngagement({
        role: roleVal,
        createdAt: row.created_at as string | Date | null,
        lastLoginAt: row.last_login_at as string | Date | null,
        totalEvents: Number(row.engagement_total_events ?? 0),
        completedEvents: Number(row.engagement_completed_events ?? 0),
        lastEventAt: row.engagement_last_event_at as string | Date | null,
        lastLiveAt: row.engagement_last_live_at as string | Date | null,
        walletBalance,
        totalCreditsRemaining: Object.values(credits).reduce((sum, v) => sum + v, 0),
        studioSubscriptionExpiresAt: row.studio_subscription_expires_at as string | Date | null,
        photoGalleryEnabled: row.photo_gallery_enabled === true,
        lastContactedAt: row.engagement_last_contacted_at as string | Date | null,
        lastCampaignType: row.engagement_last_campaign_type as string | null,
        followUpAt: row.engagement_follow_up_at as string | Date | null,
        note: row.engagement_note as string | null,
      })
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone || "",
        role: row.role,
        status: row.status,
        avatar: row.avatar,
        emailVerified: row.email_verified,
        lastLogin: row.last_login_at || row.created_at,
        joinedAt: row.created_at,
        createdAt: row.created_at,
        isVerified: row.email_verified,
        totalEvents: engagement.totalEvents,
        totalRevenue: 0,
        walletBalance,
        credits,
        eventsUsed: engagement.completedEvents,
        engagement,
        customPricing: row.custom_pricing ?? null,
        studioSubscriptionExpiresAt: row.studio_subscription_expires_at
          ? new Date(String(row.studio_subscription_expires_at)).toISOString()
          : null,
        branding: {
          platformName:
            (row.branding_platform_name as string) || (roleVal === "studio" ? "Unnamed Studio" : "Platform"),
          primaryColor: (row.branding_primary_color as string) || "#10b981",
        },
        photoGalleryEnabled: row.photo_gallery_enabled === true,
      }
    })

    return NextResponse.json({ success: true, users })
  } catch (error: any) {
    console.error("Admin Users API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
export async function POST(req: Request) {
  let body: Record<string, unknown> = {}
  try {
    await requireRole(["admin"])
    body = (await req.json()) as Record<string, unknown>

    /** Admin → Create streamer (UserFormDialog on /admin/streamers) */
    if (body.role === "streamer") {
      const { email, password, firstName, lastName, mobile } = body as {
        email?: string
        password?: string
        firstName?: string
        lastName?: string
        mobile?: string
      }
      if (!email || !password || !firstName || !lastName) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
      }
      const name = `${firstName} ${lastName}`.trim()
      const user = await createUser({
        email: email.trim().toLowerCase(),
        password,
        name,
        phone: mobile?.trim() || undefined,
        role: "streamer",
      })
      return NextResponse.json({ success: true, user })
    }

    const companyName = typeof body.companyName === "string" ? body.companyName.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const phone = typeof body.phone === "string" ? body.phone.trim() : undefined
    const platformName = typeof body.platformName === "string" ? body.platformName.trim() : ""
    const primaryColor = typeof body.primaryColor === "string" ? body.primaryColor : "#10b981"
    const secondaryColor = typeof body.secondaryColor === "string" ? body.secondaryColor : "#059669"

    if (!companyName || !email || !password || !platformName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = getDb()
    
    // 1. Create the user (this also creates wallet & credits)
    const user: any = await createUser({
      email,
      password,
      name: companyName,
      phone,
      role: "studio",
    })

    // 2. Initialize branding
    await sql`
      INSERT INTO studio_branding (user_id, platform_name, primary_color, secondary_color)
      VALUES (${user.id}, ${platformName}, ${primaryColor}, ${secondaryColor})
      ON CONFLICT (user_id) DO UPDATE SET 
        platform_name = ${platformName},
        primary_color = ${primaryColor},
        secondary_color = ${secondaryColor},
        updated_at = NOW()
    `

    // 3. Optional: Create a default domain record so the studio is "ready" to configured DNS
    const verificationToken = `v=${Math.random().toString(36).substring(2, 10)}`
    await sql`
      INSERT INTO domains (user_id, domain, verification_token, verification_status, is_primary)
      VALUES (${user.id}, ${companyName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".platform.com"}, ${verificationToken}, 'pending', true)
      ON CONFLICT DO NOTHING
    `

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error("Admin create user error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // Unique email is global; streamer/studio lists only show matching role
    if (error.code === "23505") {
      const emailHint = typeof body.email === "string" ? body.email : undefined
      const errorText = await messageForDuplicateEmail(emailHint)
      return NextResponse.json({ error: errorText }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
