import { NextResponse } from "next/server"
import { requireRole, createUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"

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
    const rows =
      role === "all"
        ? await sql(`
          SELECT u.*, sb.platform_name AS branding_platform_name, sb.primary_color AS branding_primary_color,
                 COALESCE(uae.photo_gallery_enabled, false) AS photo_gallery_enabled
          FROM users u
          LEFT JOIN studio_branding sb ON u.id = sb.user_id
          LEFT JOIN user_addon_entitlements uae ON u.id = uae.user_id
          ORDER BY u.created_at DESC
        `)
        : await sql(
            `
          SELECT u.*, sb.platform_name AS branding_platform_name, sb.primary_color AS branding_primary_color,
                 COALESCE(uae.photo_gallery_enabled, false) AS photo_gallery_enabled
          FROM users u
          LEFT JOIN studio_branding sb ON u.id = sb.user_id
          LEFT JOIN user_addon_entitlements uae ON u.id = uae.user_id
          WHERE u.role = $1
          ORDER BY u.created_at DESC
        `,
            [role],
          )

    // Mock data compatibility wrapper
    const users = rows.map((r) => {
      const row = r as Record<string, unknown>
      const roleVal = String(row.role ?? "")
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
        totalEvents: 0,
        totalRevenue: 0,
        walletBalance: 0,
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

    // Provide some basic stats counting to meet UI needs
    // In production, you would run a JOIN against wallets and events
    for (const u of users) {
      const balanceQuery = await sql`SELECT balance FROM wallets WHERE user_id=${u.id}`
      if (balanceQuery.length > 0) u.walletBalance = Number((balanceQuery[0] as Record<string, unknown>).balance) || 0
    }

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

    const { companyName, email, password, phone, platformName, primaryColor, secondaryColor } = body

    if (!companyName || !email || !password || !platformName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = getDb()
    
    // 1. Create the user (this also creates wallet & credits)
    const user: any = await createUser({
      email: typeof email === "string" ? email.trim().toLowerCase() : email,
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
