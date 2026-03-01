import { NextResponse } from "next/server"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"

/** GET: Fetch reseller-specific integration settings (masked secrets) */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const resellerId = url.searchParams.get("resellerId")

  if (!resellerId) {
    return NextResponse.json({ error: "resellerId is required" }, { status: 400 })
  }

  try {
    const [clientId, clientSecret] = await Promise.all([
      getPlatformSetting(`google_client_id:${resellerId}`),
      getPlatformSetting(`google_client_secret:${resellerId}`),
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
    console.error("Failed to fetch reseller integration settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

/** POST: Save reseller-specific integration settings */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { resellerId, google_client_id, google_client_secret } = body

    if (!resellerId) {
      return NextResponse.json({ error: "resellerId is required" }, { status: 400 })
    }

    // Save with reseller-namespaced keys
    if (google_client_id !== undefined && google_client_id !== "") {
      await setPlatformSetting(`google_client_id:${resellerId}`, google_client_id)
    }
    if (google_client_secret !== undefined && google_client_secret !== "" && !google_client_secret.startsWith("****")) {
      await setPlatformSetting(`google_client_secret:${resellerId}`, google_client_secret)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save reseller integration settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

/** DELETE: Remove reseller-specific overrides (fall back to platform defaults) */
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { resellerId } = body

    if (!resellerId) {
      return NextResponse.json({ error: "resellerId is required" }, { status: 400 })
    }

    const sql = (await import("@/lib/db")).getDb()
    await sql`DELETE FROM platform_settings WHERE key IN (${`google_client_id:${resellerId}`}, ${`google_client_secret:${resellerId}`})`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to remove reseller integration settings:", error)
    return NextResponse.json({ error: "Failed to remove settings" }, { status: 500 })
  }
}
