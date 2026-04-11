import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"
import { getDb } from "@/lib/db"

/** GET: streamer-specific Google OAuth overrides (masked secret) */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.role !== "streamer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const streamerId = user.id as string

    const [clientId, clientSecret] = await Promise.all([
      getPlatformSetting(`google_client_id:${streamerId}`),
      getPlatformSetting(`google_client_secret:${streamerId}`),
    ])

    const [platformClientId, platformClientSecret] = await Promise.all([
      getPlatformSetting("google_client_id"),
      getPlatformSetting("google_client_secret"),
    ])

    const maskSecret = (val: unknown): string => {
      const str = typeof val === "string" ? val.replace(/^"|"$/g, "") : ""
      if (!str || str.length < 8) return str ? "****" : ""
      return "****" + str.slice(-4)
    }

    const hasPlatformDefaults = Boolean(
      (platformClientId || process.env.GOOGLE_CLIENT_ID) &&
        (platformClientSecret || process.env.GOOGLE_CLIENT_SECRET),
    )

    return NextResponse.json({
      google_client_id: typeof clientId === "string" ? clientId.replace(/^"|"$/g, "") : "",
      google_client_secret: maskSecret(clientSecret),
      has_override: Boolean(clientId && clientSecret),
      has_platform_defaults: hasPlatformDefaults,
    })
  } catch (error) {
    console.error("Failed to fetch streamer integration settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

/** POST: save streamer-specific credentials */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.role !== "streamer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const streamerId = user.id as string
    const body = await request.json()
    const { google_client_id, google_client_secret } = body

    if (google_client_id !== undefined && google_client_id !== "") {
      await setPlatformSetting(`google_client_id:${streamerId}`, google_client_id)
    }
    if (google_client_secret !== undefined && google_client_secret !== "" && !google_client_secret.startsWith("****")) {
      await setPlatformSetting(`google_client_secret:${streamerId}`, google_client_secret)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save streamer integration settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

/** DELETE: remove overrides (fall back to platform / env) */
export async function DELETE() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (user.role !== "streamer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const streamerId = user.id as string
    const sql = getDb()
    await sql`DELETE FROM platform_settings WHERE key IN (${`google_client_id:${streamerId}`}, ${`google_client_secret:${streamerId}`})`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove streamer integration settings:", error)
    return NextResponse.json({ error: "Failed to remove settings" }, { status: 500 })
  }
}
