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
import { findUserByEmailForLogin } from "@/lib/db-queries"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const dbUser = await findUserByEmailForLogin(email)

    if (!dbUser) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Check if user is suspended or deactivated
    if (dbUser.status === "suspended") {
      return NextResponse.json({ error: "Your account has been suspended. Contact support." }, { status: 403 })
    }
    if (dbUser.status === "deactivated") {
      return NextResponse.json({ error: "Your account has been deactivated." }, { status: 403 })
    }

    const storedHash = dbUser.password_hash as string
    const passwordValid = await verifyPassword(password, storedHash)
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Migrate legacy bcrypt (e.g. Postgres crypt()) to app PBKDF2 on successful login
    if (isLegacyPasswordHash(storedHash)) {
      const sql = getDb()
      const newHash = await hashPassword(password)
      await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${dbUser.id as string}`
    }

    // Create session
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const { token, expiresAt } = await createSession(dbUser.id as string, ip, userAgent)

    // Set cookie
    await setSessionCookie(token, expiresAt)

    // Update last login
    await updateLastLogin(dbUser.id as string)

    // Return user without password_hash
    const user = toCamel(dbUser)
    const { passwordHash: _, ...safeUser } = user as Record<string, unknown>

    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
