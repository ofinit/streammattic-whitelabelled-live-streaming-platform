import { NextResponse } from "next/server"
import {
  createLiveBroadcast,
  transitionBroadcast,
  getStreamHealth,
  deleteBroadcast,
} from "@/lib/youtube-service"

/**
 * POST /api/stream/youtube
 * Create a YouTube Live broadcast, transition it, check health, or delete it.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, accessToken } = body

    if (!accessToken) {
      return NextResponse.json({ error: "Access token required" }, { status: 401 })
    }

    switch (action) {
      case "create": {
        const { title, description, scheduledStartTime, privacyStatus, options } = body
        const broadcast = await createLiveBroadcast(
          accessToken,
          title || "Untitled Broadcast",
          description || "",
          scheduledStartTime ? new Date(scheduledStartTime) : new Date(),
          privacyStatus || "unlisted",
          options || {},
        )
        return NextResponse.json({ success: true, broadcast })
      }

      case "transition": {
        const { broadcastId, status } = body
        if (!broadcastId || !status) {
          return NextResponse.json({ error: "broadcastId and status required" }, { status: 400 })
        }
        const result = await transitionBroadcast(accessToken, broadcastId, status)
        return NextResponse.json({ success: result })
      }

      case "health": {
        const { streamId } = body
        if (!streamId) {
          return NextResponse.json({ error: "streamId required" }, { status: 400 })
        }
        const health = await getStreamHealth(accessToken, streamId)
        return NextResponse.json({ success: true, health })
      }

      case "delete": {
        const { broadcastId: deleteId } = body
        if (!deleteId) {
          return NextResponse.json({ error: "broadcastId required" }, { status: 400 })
        }
        const deleted = await deleteBroadcast(accessToken, deleteId)
        return NextResponse.json({ success: deleted })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    return NextResponse.json(
      { error: "YouTube API error", details: (error as Error).message },
      { status: 500 },
    )
  }
}
