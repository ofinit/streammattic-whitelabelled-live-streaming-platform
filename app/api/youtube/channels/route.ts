import { NextResponse } from "next/server"
import { getDb, toCamel } from "@/lib/db"
import {
  getValidAccessToken,
  getChannelInfo,
  revokeAccess,
} from "@/lib/youtube-service"
import { decrypt } from "@/lib/encryption"

/**
 * GET /api/youtube/channels?ownerId=xxx&ownerType=admin|reseller|user
 * Returns all connected YouTube channels for an owner (without tokens).
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const ownerId = url.searchParams.get("ownerId")
  const ownerType = url.searchParams.get("ownerType")

  if (!ownerId || !ownerType) {
    return NextResponse.json({ error: "ownerId and ownerType are required" }, { status: 400 })
  }

  try {
    const db = getDb()
    const rows = await db`
      SELECT id, channel_id, channel_title, channel_thumbnail,
             subscriber_count, video_count, is_active,
             token_expires_at, created_at, updated_at
      FROM youtube_channels
      WHERE owner_id = ${ownerId} AND owner_type = ${ownerType}
      ORDER BY created_at DESC
    `

    const channels = rows.map((row: Record<string, unknown>) => {
      const ch = toCamel(row)
      return {
        ...ch,
        tokenStatus:
          ch.tokenExpiresAt && new Date(ch.tokenExpiresAt as string) > new Date()
            ? "valid"
            : "expired",
      }
    })

    return NextResponse.json({ channels })
  } catch (err) {
    console.error("Failed to fetch YouTube channels:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Failed to fetch channels" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/youtube/channels
 * Actions: refresh (refresh channel info from YouTube), disconnect, token-refresh
 * Body: { action, channelDbId }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, channelDbId } = body

    if (!channelDbId) {
      return NextResponse.json({ error: "channelDbId is required" }, { status: 400 })
    }

    const db = getDb()

    // Fetch the channel row (with encrypted tokens)
    const rows = await db`
      SELECT * FROM youtube_channels WHERE id = ${channelDbId}
    `

    if (!rows.length) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const channel = toCamel(rows[0]) as Record<string, unknown>

    switch (action) {
      case "refresh": {
        // Get a valid access token (auto-refreshes if expired)
        const accessToken = await getValidAccessToken(channelDbId)
        // Fetch latest channel info from YouTube
        const info = await getChannelInfo(accessToken)

        await db`
          UPDATE youtube_channels
          SET channel_title = ${info.title},
              channel_thumbnail = ${info.thumbnail || null},
              subscriber_count = ${info.subscriberCount || 0},
              video_count = ${info.videoCount || 0},
              updated_at = NOW()
          WHERE id = ${channelDbId}
        `

        return NextResponse.json({
          success: true,
          channel: {
            id: channelDbId,
            channelId: channel.channelId,
            channelTitle: info.title,
            channelThumbnail: info.thumbnail,
            subscriberCount: info.subscriberCount,
            videoCount: info.videoCount,
          },
        })
      }

      case "disconnect": {
        // Revoke Google access, then soft-delete
        try {
          const accessToken = decrypt(channel.encryptedAccessToken as string)
          await revokeAccess(accessToken)
        } catch {
          // Token may already be invalid -- continue with disconnect
        }

        await db`
          UPDATE youtube_channels
          SET is_active = false, updated_at = NOW()
          WHERE id = ${channelDbId}
        `

        return NextResponse.json({ success: true })
      }

      case "token-refresh": {
        // Force-refresh the access token
        const accessToken = await getValidAccessToken(channelDbId)
        return NextResponse.json({
          success: true,
          tokenStatus: "valid",
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          // Never return the actual token to the client
        })
      }

      case "delete": {
        // Hard delete: revoke + remove from DB
        try {
          const accessToken = decrypt(channel.encryptedAccessToken as string)
          await revokeAccess(accessToken)
        } catch {
          // Token may already be invalid
        }

        await db`DELETE FROM youtube_channels WHERE id = ${channelDbId}`

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error("YouTube channel action error:", err)
    return NextResponse.json(
      { error: (err as Error).message || "Channel action failed" },
      { status: 500 }
    )
  }
}
