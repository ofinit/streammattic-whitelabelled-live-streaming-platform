import { NextResponse } from "next/server"
import {
  exchangeCodeForTokens,
  getChannelInfo,
} from "@/lib/youtube-service"
import { encrypt, initEncryptionKeyFromDb } from "@/lib/encryption"
import { getDb } from "@/lib/db"

/**
 * GET /api/auth/youtube/callback
 * Handles the Google OAuth redirect after user consent.
 * Exchanges the authorization code for tokens, fetches channel info,
 * encrypts tokens, stores in DB, and redirects back to the app.
 */
export async function GET(request: Request) {
  await initEncryptionKeyFromDb()
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")
  const error = url.searchParams.get("error")

  // Parse state: JSON with { ownerId, ownerType, returnUrl }
  let stateData: { ownerId: string; ownerType: string; returnUrl: string } | null = null
  try {
    stateData = state ? JSON.parse(Buffer.from(state, "base64url").toString()) : null
  } catch {
    stateData = null
  }

  const returnUrl = stateData?.returnUrl || "/dashboard/settings/youtube"

  if (error) {
    const errorUrl = new URL(returnUrl, url.origin)
    errorUrl.searchParams.set("yt_error", error === "access_denied" ? "You denied access to your YouTube account" : error)
    return NextResponse.redirect(errorUrl.toString())
  }

  if (!code || !stateData?.ownerId || !stateData?.ownerType) {
    const errorUrl = new URL(returnUrl, url.origin)
    errorUrl.searchParams.set("yt_error", "Invalid callback parameters")
    return NextResponse.redirect(errorUrl.toString())
  }

  try {
    // 1. Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    if (!tokens.refreshToken) {
      const errorUrl = new URL(returnUrl, url.origin)
      errorUrl.searchParams.set("yt_error", "No refresh token received. Please revoke access at myaccount.google.com/permissions and try again.")
      return NextResponse.redirect(errorUrl.toString())
    }

    // 2. Fetch channel info using the new access token
    const channel = await getChannelInfo(tokens.accessToken)

    // 3. Encrypt tokens
    const encryptedAccessToken = encrypt(tokens.accessToken)
    const encryptedRefreshToken = encrypt(tokens.refreshToken)
    const tokenExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000)

    // 4. Upsert into DB (update tokens if channel already connected)
    const db = getDb()
    await db`
      INSERT INTO youtube_channels (
        owner_id, owner_type, channel_id, channel_title, channel_thumbnail,
        subscriber_count, video_count,
        encrypted_access_token, encrypted_refresh_token, token_expires_at,
        scopes, is_active
      ) VALUES (
        ${stateData.ownerId}, ${stateData.ownerType},
        ${channel.id}, ${channel.title}, ${channel.thumbnail || null},
        ${channel.subscriberCount || 0}, ${channel.videoCount || 0},
        ${encryptedAccessToken}, ${encryptedRefreshToken}, ${tokenExpiresAt},
        ${"youtube.force-ssl youtube.readonly"}, ${true}
      )
      ON CONFLICT (owner_id, owner_type, channel_id)
      DO UPDATE SET
        channel_title = EXCLUDED.channel_title,
        channel_thumbnail = EXCLUDED.channel_thumbnail,
        subscriber_count = EXCLUDED.subscriber_count,
        video_count = EXCLUDED.video_count,
        encrypted_access_token = EXCLUDED.encrypted_access_token,
        encrypted_refresh_token = EXCLUDED.encrypted_refresh_token,
        token_expires_at = EXCLUDED.token_expires_at,
        is_active = true,
        updated_at = NOW()
    `

    // 5. Redirect back with success
    const successUrl = new URL(returnUrl, url.origin)
    successUrl.searchParams.set("yt_connected", channel.title)
    return NextResponse.redirect(successUrl.toString())
  } catch (err) {
    console.error("YouTube OAuth callback error:", err)
    const errorUrl = new URL(returnUrl, url.origin)
    errorUrl.searchParams.set("yt_error", (err as Error).message || "Failed to connect YouTube channel")
    return NextResponse.redirect(errorUrl.toString())
  }
}
