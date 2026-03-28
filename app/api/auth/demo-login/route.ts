import { NextRequest, NextResponse } from "next/server"
import { getOrCreateDemoUser, getDemoAccountByEmail, createSession, setSessionCookie, updateLastLogin } from "@/lib/auth"

const DEMO_ROLES = {
  admin: "admin@streammattic.com",
  studio: "john@livestream.pro",
  streamer: "alice@example.com",
}

/**
 * POST /api/auth/demo-login
 * Body: { role: "admin" | "studio" | "streamer" }
 * Creates (or fetches) the demo user, creates a session and sets the cookie server-side,
 * then returns { ok: true, role } — no NextAuth or Stack Auth redirect involved.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const role = (body.role as keyof typeof DEMO_ROLES) || "admin"
    const email = DEMO_ROLES[role]
    if (!email) {
      return NextResponse.json({ error: "Invalid demo role" }, { status: 400 })
    }

    const dbUser = await getOrCreateDemoUser(email)
    if (!dbUser) {
      return NextResponse.json(
        { error: "Demo user could not be created. Set DATABASE_URL and run: npm run db:migrate" },
        { status: 500 }
      )
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const ua = request.headers.get("user-agent") || "unknown"
    const { token, expiresAt } = await createSession(dbUser.id as string, ip, ua)
    await setSessionCookie(token, expiresAt)
    await updateLastLogin(dbUser.id as string)

    return NextResponse.json({ ok: true, role: dbUser.role })
  } catch (err) {
    console.error("Demo login API error:", err)
    const msg = err instanceof Error ? err.message : String(err)
    const friendly = (msg.includes("DATABASE_URL") || msg.includes("relation") || msg.includes("does not exist"))
      ? "Database not set up. Set DATABASE_URL in .env.local and run: npm run db:migrate"
      : msg
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
