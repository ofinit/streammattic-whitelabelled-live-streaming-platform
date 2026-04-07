import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role") || "streamer"
    
    // Default search parameters, can be expanded as needed.
    const sql = getDb()
    const rows = (role === "all") 
      ? await sql`
          SELECT 
            u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar, u.email_verified, u.last_login_at, u.created_at, u.custom_pricing,
            sb.platform_name, sb.primary_color
          FROM users u
          LEFT JOIN studio_branding sb ON u.id = sb.user_id
          ORDER BY u.created_at DESC
        `
      : await sql`
          SELECT 
            u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar, u.email_verified, u.last_login_at, u.created_at, u.custom_pricing,
            sb.platform_name, sb.primary_color
          FROM users u
          LEFT JOIN studio_branding sb ON u.id = sb.user_id
          WHERE u.role = ${role}
          ORDER BY u.created_at DESC
        `

    // Mock data compatibility wrapper
    const users = rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      role: r.role,
      status: r.status,
      avatar: r.avatar,
      emailVerified: r.email_verified,
      lastLogin: r.last_login_at || r.created_at,
      joinedAt: r.created_at,
      isVerified: r.email_verified,
      totalEvents: 0,
      totalRevenue: 0,
      walletBalance: 0,
      customPricing: r.custom_pricing ?? null,
      branding: {
         platformName: r.platform_name || (r.role === 'studio' ? 'Unnamed Studio' : 'Platform'),
         primaryColor: r.primary_color || '#10b981'
      }
    }))

    // Provide some basic stats counting to meet UI needs
    // In production, you would run a JOIN against wallets and events
    for (const u of users) {
       const balanceQuery = await sql`SELECT balance FROM wallets WHERE user_id=${u.id}`
       if (balanceQuery.length > 0) u.walletBalance = Number(balanceQuery[0].balance) || 0
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
