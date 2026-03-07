import { NextResponse } from "next/server"
import {
  getValidAccessToken,
  createLiveBroadcast,
  transitionBroadcast,
  getStreamHealth,
  deleteBroadcast,
  waitForStreamReady,
} from "@/lib/youtube-service"
import { getDb, toCamel } from "@/lib/db"
import { initEncryptionKeyFromDb } from "@/lib/encryption"

/**
 * POST /api/stream/youtube
 * Manages YouTube Live broadcasts with DB-backed channel authentication.
 * All actions use the channelDbId to look up and auto-refresh tokens.
 * Never accepts raw access tokens from the client.
 *
 * Actions: create, transition, go-live, health, delete, status
 */
export async function POST(request: Request) {
  try {
    await initEncryptionKeyFromDb()
    const body = await request.json()
    const { action, channelDbId } = body

    if (!channelDbId) {
      return NextResponse.json({ error: "channelDbId is required" }, { status: 400 })
    }

    // Get a valid access token (auto-refreshes if expired)
    const accessToken = await getValidAccessToken(channelDbId)
    const db = getDb()

    switch (action) {
      case "create": {
        const {
          eventId,
          title,
          description,
          scheduledStartTime,
          privacyStatus,
          enableDvr,
          enableAutoStart,
          enableAutoStop,
          enableLowLatency,
        } = body

        if (!eventId) {
          return NextResponse.json({ error: "eventId is required" }, { status: 400 })
        }

        // Create broadcast + stream on YouTube
        const broadcast = await createLiveBroadcast(
          accessToken,
          title || "Untitled Broadcast",
          description || "",
          scheduledStartTime ? new Date(scheduledStartTime) : new Date(),
          privacyStatus || "unlisted",
          {
            enableDvr: enableDvr ?? true,
            enableAutoStart: enableAutoStart ?? true,
            enableAutoStop: enableAutoStop ?? true,
            enableLowLatency: enableLowLatency ?? false,
          }
        )

        // Store broadcast in DB
        await db`
          INSERT INTO youtube_broadcasts (
            event_id, youtube_channel_id, broadcast_id, stream_id,
            rtmp_url, stream_key, broadcast_status, privacy_status,
            scheduled_start, enable_dvr, enable_auto_start,
            enable_auto_stop, enable_low_latency
          ) VALUES (
            ${eventId}, ${channelDbId}, ${broadcast.broadcastId}, ${broadcast.streamId},
            ${broadcast.rtmpUrl}, ${broadcast.streamKey}, ${"created"}, ${privacyStatus || "unlisted"},
            ${scheduledStartTime ? new Date(scheduledStartTime) : new Date()},
            ${enableDvr ?? true}, ${enableAutoStart ?? true},
            ${enableAutoStop ?? true}, ${enableLowLatency ?? false}
          )
        `

        return NextResponse.json({
          success: true,
          broadcast: {
            broadcastId: broadcast.broadcastId,
            streamId: broadcast.streamId,
            rtmpUrl: broadcast.rtmpUrl,
            streamKey: broadcast.streamKey,
          },
        })
      }

      case "go-live": {
        // Transition: ready -> testing -> live (with stream readiness check)
        const { broadcastId } = body
        if (!broadcastId) {
          return NextResponse.json({ error: "broadcastId is required" }, { status: 400 })
        }

        // Get broadcast's stream ID from DB
        const rows = await db`
          SELECT stream_id FROM youtube_broadcasts WHERE broadcast_id = ${broadcastId}
        `
        const streamId = rows[0]?.stream_id

        if (streamId) {
          // Wait for the stream to be active (encoder must be pushing)
          const isReady = await waitForStreamReady(accessToken, streamId, 30000)
          if (!isReady) {
            return NextResponse.json(
              { error: "Stream is not active. Make sure your encoder (OBS) is pushing to the RTMP URL before going live." },
              { status: 400 }
            )
          }
        }

        // Transition to testing first, then to live
        await transitionBroadcast(accessToken, broadcastId, "testing")
        // Small delay before transitioning to live
        await new Promise((resolve) => setTimeout(resolve, 3000))
        const result = await transitionBroadcast(accessToken, broadcastId, "live")

        // Update DB
        await db`
          UPDATE youtube_broadcasts
          SET broadcast_status = 'live', actual_start = NOW(), updated_at = NOW()
          WHERE broadcast_id = ${broadcastId}
        `

        return NextResponse.json({ success: result })
      }

      case "transition": {
        const { broadcastId, status } = body
        if (!broadcastId || !status) {
          return NextResponse.json({ error: "broadcastId and status are required" }, { status: 400 })
        }

        const result = await transitionBroadcast(accessToken, broadcastId, status)

        // Update DB status
        const dbStatus = status === "complete" ? "complete" : status
        const updateFields: Record<string, unknown> = { broadcast_status: dbStatus }
        if (status === "live") updateFields.actual_start = new Date()
        if (status === "complete") updateFields.actual_end = new Date()

        await db`
          UPDATE youtube_broadcasts
          SET broadcast_status = ${dbStatus},
              actual_start = ${status === "live" ? new Date() : null},
              actual_end = ${status === "complete" ? new Date() : null},
              updated_at = NOW()
          WHERE broadcast_id = ${broadcastId}
        `

        return NextResponse.json({ success: result })
      }

      case "health": {
        const { streamId } = body
        if (!streamId) {
          return NextResponse.json({ error: "streamId is required" }, { status: 400 })
        }
        const health = await getStreamHealth(accessToken, streamId)
        return NextResponse.json({ success: true, health })
      }

      case "delete": {
        const { broadcastId: deleteId, eventId: deleteEventId } = body
        if (!deleteId) {
          return NextResponse.json({ error: "broadcastId is required" }, { status: 400 })
        }
        const deleted = await deleteBroadcast(accessToken, deleteId)

        // Remove from DB
        await db`
          DELETE FROM youtube_broadcasts WHERE broadcast_id = ${deleteId}
        `

        return NextResponse.json({ success: deleted })
      }

      case "status": {
        // Get broadcast status from DB for a given event
        const { eventId } = body
        if (!eventId) {
          return NextResponse.json({ error: "eventId is required" }, { status: 400 })
        }

        const rows = await db`
          SELECT * FROM youtube_broadcasts
          WHERE event_id = ${eventId}
          ORDER BY created_at DESC
          LIMIT 1
        `

        if (!rows.length) {
          return NextResponse.json({ broadcast: null })
        }

        return NextResponse.json({ broadcast: toCamel(rows[0]) })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error("YouTube broadcast API error:", error)
    return NextResponse.json(
      { error: "YouTube API error", details: (error as Error).message },
      { status: 500 }
    )
  }
}
