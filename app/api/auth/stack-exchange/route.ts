import { NextResponse } from "next/server"
import { getStackServerApp } from "@/lib/stack"
import { getDb, toCamel } from "@/lib/db"
import { createUser, createOneTimeToken } from "@/lib/auth"

/** POST: Exchange Stack Auth session for our session. Returns one-time token for credentials sign-in. */
export async function POST(request: Request) {
  try {
    const stackApp = getStackServerApp(request as unknown as { headers: { get: (n: string) => string | null } })
    if (!stackApp) {
      return NextResponse.json({ error: "Stack Auth not configured" }, { status: 503 })
    }

    const user = await stackApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not signed in with Stack" }, { status: 401 })
    }

    const email = (user.primaryEmail ?? user.id).toString()
    const name = (user.displayName ?? email).toString()
    const sql = getDb()
    let rows = await sql`SELECT id, email, name, role, status FROM users WHERE email = ${email.toLowerCase().trim()}`
    let dbUser: Record<string, unknown>

    if (rows.length === 0) {
      const newUser = await createUser({
        email: email.toLowerCase().trim(),
        password: crypto.randomUUID(),
        name: name || email.split("@")[0],
        role: "streamer",
      })
      dbUser = newUser as Record<string, unknown>
    } else {
      dbUser = toCamel(rows[0] as Record<string, unknown>) as Record<string, unknown>
      if (dbUser.status === "suspended" || dbUser.status === "deactivated") {
        return NextResponse.json({ error: "Account is suspended" }, { status: 403 })
      }
    }

    const oneTimeToken = createOneTimeToken(dbUser.id as string)
    return NextResponse.json({ token: oneTimeToken })
  } catch (e) {
    console.error("Stack exchange error:", e)
    return NextResponse.json({ error: "Exchange failed" }, { status: 500 })
  }
}
