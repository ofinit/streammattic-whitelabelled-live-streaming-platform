import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"

const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, phone, username } = body

    if (!firstName || typeof firstName !== "string") {
      return NextResponse.json({ error: "First name is required" }, { status: 400 })
    }

    const fullName = [firstName.trim(), lastName?.trim()].filter(Boolean).join(" ")
    const phoneVal = phone?.trim() || null

    const sql = getDb()

    // Ensure username column exists (auto-migration)
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT`.catch(() => {})
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'users_username_key' AND conrelid = 'users'::regclass
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
        END IF;
      END $$
    `.catch(() => {})
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`.catch(() => {})

    let usernameVal: string | null = null
    if (username && typeof username === "string") {
      const cleaned = username.trim().toLowerCase()
      if (!USERNAME_RE.test(cleaned)) {
        return NextResponse.json(
          { error: "Username must be 3–30 characters: letters, numbers, underscore, dot, or hyphen only." },
          { status: 400 }
        )
      }
      // Check uniqueness (exclude current user)
      const existing = await sql`
        SELECT id FROM users WHERE username = ${cleaned} AND id != ${user.id}
      `
      if (existing.length > 0) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 })
      }
      usernameVal = cleaned
    }

    await sql`
      UPDATE users
      SET
        name     = ${fullName},
        phone    = ${phoneVal},
        username = ${usernameVal},
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true, name: fullName, phone: phoneVal, username: usernameVal })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
