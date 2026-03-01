import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getCurrentUser, verifyPassword, hashPassword, deleteAllUserSessions, createSession, setSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current and new passwords are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    // Verify current password
    const sql = getDb()
    const rows = await sql`SELECT password_hash FROM users WHERE id = ${user.id as string}`
    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const valid = await verifyPassword(currentPassword, (rows[0] as Record<string, unknown>).password_hash as string)
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Hash and update
    const newHash = await hashPassword(newPassword)
    await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${user.id as string}`

    // Invalidate all existing sessions
    await deleteAllUserSessions(user.id as string)

    // Create a new session
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const { token, expiresAt } = await createSession(user.id as string, ip, userAgent)
    await setSessionCookie(token, expiresAt)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
