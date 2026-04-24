import { NextRequest, NextResponse } from "next/server"
import { getDb, toCamel } from "@/lib/db"
import {
  verifyPassword,
  createSession,
  setSessionCookie,
  updateLastLogin,
  hashPassword,
  isLegacyPasswordHash,
} from "@/lib/auth"
import { findUserByIdentifierForLogin } from "@/lib/db-queries"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Accept "email" (legacy) or "identifier" (email or username)
    const identifier: string = (body.identifier ?? body.email ?? "").trim()
    const password: string = body.password ?? ""

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email (or username) and password are required" }, { status: 400 })
    }

    const dbUser = await findUserByIdentifierForLogin(identifier)

    if (!dbUser) {
      return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 })
    }

    if (dbUser.status === "suspended") {
      return NextResponse.json({ error: "Your account has been suspended. Contact support." }, { status: 403 })
    }
    if (dbUser.status === "deactivated") {
      return NextResponse.json({ error: "Your account has been deactivated." }, { status: 403 })
    }

    const storedHash = dbUser.password_hash as string
    const passwordValid = await verifyPassword(password, storedHash)
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email/username or password" }, { status: 401 })
    }

    // Migrate legacy bcrypt to PBKDF2 on successful login
    if (isLegacyPasswordHash(storedHash)) {
      const sql = getDb()
      const newHash = await hashPassword(password)
      await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${dbUser.id as string}`
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const { token, expiresAt } = await createSession(dbUser.id as string, ip, userAgent)

    await setSessionCookie(token, expiresAt)
    await updateLastLogin(dbUser.id as string)

    const user = toCamel(dbUser)
    const { passwordHash: _, ...safeUser } = user as Record<string, unknown>

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
