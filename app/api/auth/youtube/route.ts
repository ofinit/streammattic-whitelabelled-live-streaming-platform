import { NextResponse } from "next/server"
import { getYouTubeOAuthUrl } from "@/lib/youtube-service"
import { getCurrentUser } from "@/lib/auth"

function safeReturnUrl(url: unknown): string {
  if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//") && !url.startsWith("/\\")) {
    return url
  }
  return "/streamer/settings/youtube"
}

/**
 * POST /api/auth/youtube
 * Returns the Google OAuth consent URL for the requesting user.
 * Body: { ownerId, ownerType, returnUrl? }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ownerId, ownerType, returnUrl } = body

    if (!ownerId || !ownerType) {
      return NextResponse.json({ error: "ownerId and ownerType are required" }, { status: 400 })
    }

    if (user.role !== "admin" && user.id !== ownerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (!["admin", "studio", "streamer"].includes(ownerType)) {
      return NextResponse.json({ error: "ownerType must be admin, studio, or streamer" }, { status: 400 })
    }

    const cleanReturnUrl = safeReturnUrl(returnUrl)

    // Encode state as base64url JSON
    const state = Buffer.from(
      JSON.stringify({
        ownerId,
        ownerType,
        returnUrl: cleanReturnUrl,
      })
    ).toString("base64url")

    const redirectUri =
      process.env.YOUTUBE_OAUTH_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL || "https://www.streamlivee.com"}/api/auth/youtube/callback`

    const credentialOwnerId =
      ownerType === "studio" || ownerType === "streamer" ? ownerId : undefined
    const oauthUrl = await getYouTubeOAuthUrl(redirectUri, state, credentialOwnerId)

    return NextResponse.json({ url: oauthUrl })
  } catch (err) {
    console.error("Failed to generate YouTube OAuth URL:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Failed to generate OAuth URL" },
      { status: 500 }
    )
  }
}
