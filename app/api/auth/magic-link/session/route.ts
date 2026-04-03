import { NextResponse } from "next/server"
import { getLoginSession } from "@/lib/login-sessions"
import { getDb, toCamel } from "@/lib/db"
import { createOneTimeToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Session id required" }, { status: 400 })
    }

    const session = await getLoginSession(id)
    if (!session) {
      return NextResponse.json({ status: "expired" })
    }

    if (session.status === "pending") {
      return NextResponse.json({ status: "pending" })
    }

    if (session.status === "approved" && session.userId) {
      const sql = getDb()
      const rows = await sql`
        SELECT id, email, name, role, status
        FROM users
        WHERE id = ${session.userId}
      `
      if (rows.length === 0) {
        return NextResponse.json({ status: "expired" })
      }
      const user = toCamel(rows[0] as Record<string, unknown>) as Record<string, unknown>
      const oneTimeToken = createOneTimeToken(session.userId)
      return NextResponse.json({
        status: "approved",
        one_time_token: oneTimeToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
      })
    }

    return NextResponse.json({ status: "pending" })
  } catch (e) {
    console.error("Magic link session error:", e)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}
