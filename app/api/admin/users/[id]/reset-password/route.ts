import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { hashPassword } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])

    const { id } = await props.params
    if (!id) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const body = await req.json() as { password?: string }
    const password = typeof body.password === "string" ? body.password.trim() : ""

    if (!password || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const sql = getDb()

    const userRows = await sql`SELECT id, email, status FROM users WHERE id = ${id} LIMIT 1`
    if (userRows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const newHash = await hashPassword(password)

    await sql`
      UPDATE users
      SET password_hash = ${newHash}, updated_at = NOW()
      WHERE id = ${id}
    `

    // Invalidate all existing sessions so the user must log in with the new password.
    await sql`DELETE FROM sessions WHERE user_id = ${id}`

    const user = userRows[0] as { id: string; email: string; status: string }
    return NextResponse.json({
      success: true,
      message: `Password reset for ${user.email}. All active sessions have been cleared.`,
    })
  } catch (error: unknown) {
    console.error("Admin reset-password error:", error)
    const msg = error instanceof Error ? error.message : "Internal server error"
    if (msg === "Forbidden" || msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
