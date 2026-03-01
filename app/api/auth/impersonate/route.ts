import { NextRequest, NextResponse } from "next/server"
import { getDb, toCamel } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admin can impersonate
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Only admins can impersonate users" }, { status: 403 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const sql = getDb()
    const rows = await sql`
      SELECT id, email, name, phone, role, status, avatar, email_verified, created_at, updated_at
      FROM users WHERE id = ${userId}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const targetUser = toCamel(rows[0] as Record<string, unknown>)

    return NextResponse.json({
      user: targetUser,
      impersonatedBy: currentUser.id,
    })
  } catch (error) {
    console.error("Impersonate error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
