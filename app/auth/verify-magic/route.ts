import { NextRequest, NextResponse } from "next/server"
import { verifyMagicLinkToken } from "@/lib/magic-link-token"
import { getLoginSession, approveLoginSession } from "@/lib/login-sessions"
import { getDb, toCamel } from "@/lib/db"
import { createUser } from "@/lib/auth"
import { createOneTimeToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  const sessionId = url.searchParams.get("session")
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  if (!token || !sessionId) {
    return NextResponse.redirect(`${baseUrl}/login?error=InvalidLink`)
  }

  const parsed = verifyMagicLinkToken(token)
  if (!parsed) {
    return NextResponse.redirect(`${baseUrl}/login?error=InvalidLink`)
  }

  const session = await getLoginSession(sessionId)
  if (!session || session.status !== "pending") {
    return NextResponse.redirect(`${baseUrl}/login?error=ExpiredOrUsed`)
  }
  if (session.email.toLowerCase() !== parsed.email.toLowerCase()) {
    return NextResponse.redirect(`${baseUrl}/login?error=InvalidLink`)
  }

  const sql = getDb()
  let rows = await sql`SELECT id, email, name, role, status FROM users WHERE email = ${parsed.email}`
  let userId: string

  if (rows.length === 0) {
    const newUser = await createUser({
      email: parsed.email,
      password: crypto.randomUUID(),
      name: parsed.email.split("@")[0],
      role: "streamer",
    })
    userId = newUser.id as string
  } else {
    const u = toCamel(rows[0] as Record<string, unknown>) as Record<string, unknown>
    if (u.status === "suspended" || u.status === "deactivated") {
      return NextResponse.redirect(`${baseUrl}/login?error=AccountSuspended`)
    }
    userId = u.id as string
  }

  const approved = await approveLoginSession(sessionId, userId)
  if (!approved) {
    return NextResponse.redirect(`${baseUrl}/login?error=ExpiredOrUsed`)
  }

  const oneTimeToken = createOneTimeToken(userId)
  return NextResponse.redirect(`${baseUrl}/login/callback?token=${encodeURIComponent(oneTimeToken)}&source=magic`)
}
