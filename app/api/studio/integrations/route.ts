import { NextResponse } from "next/server"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"

/** GET: Fetch studio-specific integration settings (masked secrets) */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const studioId = url.searchParams.get("studioId")

  if (!studioId) {
    return NextResponse.json({ error: "studioId is required" }, { status: 400 })
  }

  try {
    const [clientId, clientSecret] = await Promise.all([
      getPlatformSetting(`google_client_id:${studioId}`),
      getPlatformSetting(`google_client_secret:${studioId}`),
    ])

    // Also check if platform-level defaults exist
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
      (platformClientSecret || process.env.GOOGLE_CLIENT_SECRET)
    )

    return NextResponse.json({
      google_client_id: typeof clientId === "string" ? clientId.replace(/^"|"$/g, "") : "",
      google_client_secret: maskSecret(clientSecret),
      has_override: Boolean(clientId && clientSecret),
      has_platform_defaults: hasPlatformDefaults,
    })
  } catch (error) {
    console.error("Failed to fetch studio integration settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

/** POST: Save studio-specific integration settings */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studioId, google_client_id, google_client_secret } = body

    if (!studioId) {
      return NextResponse.json({ error: "studioId is required" }, { status: 400 })
    }

    // Save with studio-namespaced keys
    if (google_client_id !== undefined && google_client_id !== "") {
      await setPlatformSetting(`google_client_id:${studioId}`, google_client_id)
    }
    if (google_client_secret !== undefined && google_client_secret !== "" && !google_client_secret.startsWith("****")) {
      await setPlatformSetting(`google_client_secret:${studioId}`, google_client_secret)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save studio integration settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

/** DELETE: Remove studio-specific overrides (fall back to platform defaults) */
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { studioId } = body

    if (!studioId) {
      return NextResponse.json({ error: "studioId is required" }, { status: 400 })
    }

    const sql = (await import("@/lib/db")).getDb()
    await sql`DELETE FROM platform_settings WHERE key IN (${`google_client_id:${studioId}`}, ${`google_client_secret:${studioId}`})`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove studio integration settings:", error)
    return NextResponse.json({ error: "Failed to remove settings" }, { status: 500 })
  }
}
