import { NextResponse } from "next/server"
import { getPlatformSetting, setPlatformSetting } from "@/lib/db-queries"

/** GET: Fetch integration settings (masked secrets) */
export async function GET() {
  try {
    const [clientId, clientSecret, encryptionKey, youtubeConfigEnabled] = await Promise.all([
      getPlatformSetting("google_client_id"),
      getPlatformSetting("google_client_secret"),
      getPlatformSetting("encryption_key"),
      getPlatformSetting("youtube_config_enabled"),
    ])

    // Mask secrets -- only show last 4 chars
    const maskSecret = (val: unknown): string => {
      const str = typeof val === "string" ? val.replace(/^"|"$/g, "") : ""
      if (!str || str.length < 8) return str ? "****" : ""
      return "****" + str.slice(-4)
    }

    const enabled = youtubeConfigEnabled === true || youtubeConfigEnabled === "true" || (typeof youtubeConfigEnabled === "string" && youtubeConfigEnabled.toLowerCase() === "true")

    return NextResponse.json({
      google_client_id: typeof clientId === "string" ? clientId.replace(/^"|"$/g, "") : (clientId ?? ""),
      google_client_secret: maskSecret(clientSecret),
      encryption_key: maskSecret(encryptionKey),
      has_google_client_id: Boolean(clientId || process.env.GOOGLE_CLIENT_ID),
      has_google_client_secret: Boolean(clientSecret || process.env.GOOGLE_CLIENT_SECRET),
      has_encryption_key: Boolean(encryptionKey || process.env.ENCRYPTION_KEY),
      youtube_config_enabled: enabled,
    })
  } catch (error) {
    console.error("Failed to fetch integration settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

/** POST: Save integration settings */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { google_client_id, google_client_secret, encryption_key, youtube_config_enabled } = body

    // Only update fields that are provided and non-empty
    if (google_client_id !== undefined && google_client_id !== "") {
      await setPlatformSetting("google_client_id", google_client_id)
    }
    if (google_client_secret !== undefined && google_client_secret !== "" && !google_client_secret.startsWith("****")) {
      await setPlatformSetting("google_client_secret", google_client_secret)
    }
    if (encryption_key !== undefined && encryption_key !== "" && !encryption_key.startsWith("****")) {
      await setPlatformSetting("encryption_key", encryption_key)
    }
    if (youtube_config_enabled !== undefined) {
      await setPlatformSetting("youtube_config_enabled", Boolean(youtube_config_enabled))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to save integration settings:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
