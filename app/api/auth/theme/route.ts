import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ensureUsersThemePreferenceColumn } from "@/lib/ensure-users-schema"

type ThemePreference = "system" | "dark" | "light"

function normalizeThemePreference(raw: unknown): ThemePreference | null {
  if (raw === "system" || raw === "dark" || raw === "light") return raw
  return null
}

export async function PUT(req: Request) {
  try {
    await ensureUsersThemePreferenceColumn()
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { themePreference?: unknown }
    const themePreference = normalizeThemePreference(body?.themePreference)
    if (!themePreference) {
      return NextResponse.json(
        { error: "themePreference must be one of: system, dark, light" },
        { status: 400 },
      )
    }

    const sql = getDb()
    await sql`
      UPDATE users
      SET theme_preference = ${themePreference}, updated_at = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true, themePreference })
  } catch (error) {
    console.error("Theme preference update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

