import { NextResponse } from "next/server"
import { getYouTubeOAuthUrl } from "@/lib/youtube-service"

/**
 * POST /api/auth/youtube
 * Returns the Google OAuth consent URL for the requesting user.
 * Body: { ownerId, ownerType, returnUrl? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { ownerId, ownerType, returnUrl } = body

    if (!ownerId || !ownerType) {
      return NextResponse.json({ error: "ownerId and ownerType are required" }, { status: 400 })
    }

    if (!["admin", "studio", "streamer"].includes(ownerType)) {
      return NextResponse.json({ error: "ownerType must be admin, studio, or streamer" }, { status: 400 })
    }

    // Encode state as base64url JSON
    const state = Buffer.from(
      JSON.stringify({
        ownerId,
        ownerType,
        returnUrl: returnUrl || "/streamer/settings/youtube",
      })
    ).toString("base64url")

    const redirectUri =
      process.env.YOUTUBE_OAUTH_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL || "https://www.streamlivee.com"}/api/auth/youtube/callback`

    const studioId = ownerType === "studio" ? ownerId : undefined
    const oauthUrl = await getYouTubeOAuthUrl(redirectUri, state, studioId)

    return NextResponse.json({ url: oauthUrl })
  } catch (err) {
    console.error("Failed to generate YouTube OAuth URL:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate OAuth URL" },
      { status: 500 }
    )
  }
}
