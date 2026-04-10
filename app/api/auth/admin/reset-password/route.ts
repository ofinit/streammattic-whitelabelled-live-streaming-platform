import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { hashPassword, deleteAllUserSessions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    let body: { token?: string; password?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const token = typeof body.token === "string" ? body.token.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const sql = getDb()

    const tokenRows = await sql`
      SELECT user_id FROM admin_password_reset_tokens
      WHERE token = ${token} AND expires_at > NOW()
      LIMIT 1
    `
    if (tokenRows.length === 0) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 })
    }

    const userIdRaw = String((tokenRows[0] as { user_id: unknown }).user_id)

    const rows = await sql`
      SELECT id, role FROM users WHERE id = ${userIdRaw} LIMIT 1
    `
    if (rows.length === 0 || String((rows[0] as { role?: string }).role) !== "admin") {
      await sql`DELETE FROM admin_password_reset_tokens WHERE token = ${token}`
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 })
    }

    const newHash = await hashPassword(password)
    await sql`UPDATE users SET password_hash = ${newHash}, updated_at = NOW() WHERE id = ${userIdRaw}`

    await sql`DELETE FROM admin_password_reset_tokens WHERE user_id = ${userIdRaw}`

    await deleteAllUserSessions(userIdRaw)

    return NextResponse.json({ success: true, message: "Password updated. Sign in with your new password." })
  } catch (e) {
    console.error("admin reset-password:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
