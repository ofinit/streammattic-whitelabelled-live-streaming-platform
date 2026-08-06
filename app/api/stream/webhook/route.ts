import { NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

/**
 * Nimble Streamer Webhook Handler
 *
 * Receives callbacks from the Nimble server when stream events occur:
 * - stream.started   - A publisher connected and started streaming
 * - stream.stopped   - The publisher disconnected
 * - stream.error     - An error occurred (encoding, connection, etc.)
 * - recording.ready  - A recording file is ready for download
 * - viewer.connected - A new viewer connected
 * - viewer.disconnected - A viewer disconnected
 */

interface NimbleWebhookPayload {
  event: string
  application: string
  stream: string
  timestamp: string
  data?: Record<string, unknown>
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()

    // Validate webhook signature if NIMBLE_WEBHOOK_SECRET is set
    const webhookSecret = process.env.NIMBLE_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = request.headers.get("x-nimble-signature") || ""
      if (!signature) {
        return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 })
      }
      const hmac = createHmac("sha256", webhookSecret).update(rawBody).digest("hex")
      const expectedSig = signature.startsWith("sha256=") ? `sha256=${hmac}` : hmac
      if (signature.length !== expectedSig.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 })
      }
    }

    const payload = JSON.parse(rawBody) as NimbleWebhookPayload

    const eventId = payload.application?.replace("event-", "")

    switch (payload.event) {
      case "stream.started":
        // Update event status to "live"
        // Update stream record startedAt
        console.log(`[Webhook] Stream started for event ${eventId}`)
        break

      case "stream.stopped":
        // Update event status to "completed"
        // Update stream record stoppedAt
        console.log(`[Webhook] Stream stopped for event ${eventId}`)
        break

      case "stream.error":
        // Update stream status to "error"
        // Notify event owner
        console.log(`[Webhook] Stream error for event ${eventId}:`, payload.data)
        break

      case "recording.ready":
        // Update recording status to "ready"
        // Generate download URL
        console.log(`[Webhook] Recording ready for event ${eventId}`)
        break

      case "viewer.connected":
        // Increment current viewer count
        break

      case "viewer.disconnected":
        // Decrement current viewer count
        break

      default:
        console.log(`[Webhook] Unknown event: ${payload.event}`)
    }

    return NextResponse.json({ success: true, received: payload.event })
  } catch (error) {
    return NextResponse.json(
      { error: `Webhook processing failed: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}
