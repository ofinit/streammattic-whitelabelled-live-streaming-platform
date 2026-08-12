import { NextRequest, NextResponse } from "next/server"
import { getDb, toCamel } from "@/lib/db"
import { getCurrentUser, createSession, setSessionCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { userId, stop, originalUserId } = body

    // Handle stop impersonation: restore original admin session cookie
    if (stop && originalUserId) {
      const sql = getDb()
      const adminRows = await sql`
        SELECT id, email, name, phone, role, status, avatar, email_verified, created_at, updated_at
        FROM users WHERE id = ${originalUserId}
      `
      if (adminRows.length > 0 && adminRows[0].role === "admin") {
        const token = await createSession(originalUserId)
        await setSessionCookie(token)
        const adminUser = toCamel(adminRows[0] as Record<string, unknown>)
        return NextResponse.json({ user: adminUser, stopped: true })
      }
    }

    // Only admin can impersonate
    if (currentUser.role !== "admin") {
      return NextResponse.json({ error: "Only admins can impersonate users" }, { status: 403 })
    }

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

    // Set real session cookie for impersonated user so API endpoints return their actual data
    const token = await createSession(targetUser.id as string)
    await setSessionCookie(token)

    return NextResponse.json({
      user: targetUser,
      impersonatedBy: currentUser.id,
    })
  } catch (error) {
    console.error("Impersonate error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
