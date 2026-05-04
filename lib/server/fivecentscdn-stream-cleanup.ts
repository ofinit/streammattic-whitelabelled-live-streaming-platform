import type { getDb } from "@/lib/db"
import { getStreamingSettings } from "@/lib/srs-settings"
import { deleteFiveCentsCdnPushStream } from "@/lib/streaming/fivecentscdn-service"

type Sql = ReturnType<typeof getDb>

export async function deleteFiveCentsCdnStreamById(streamId: string): Promise<void> {
  const trimmedStreamId = streamId.trim()
  if (!trimmedStreamId) return

  const settings = await getStreamingSettings()
  await deleteFiveCentsCdnPushStream(settings, trimmedStreamId)
}

export async function deleteFiveCentsCdnStreamForEvent(sql: Sql, eventId: string): Promise<void> {
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS rtmp_provider TEXT NOT NULL DEFAULT 'srs'`.catch(() => {})
  await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS rtmp_provider_stream_id TEXT`.catch(() => {})
  const rows = await sql`
    SELECT rtmp_provider, rtmp_provider_stream_id
    FROM events
    WHERE id = ${eventId}
    LIMIT 1
  `.catch(() => [])

  const event = rows[0] as Record<string, unknown> | undefined
  if (!event || event.rtmp_provider !== "fivecentscdn") return

  const streamId = typeof event.rtmp_provider_stream_id === "string" ? event.rtmp_provider_stream_id.trim() : ""
  if (!streamId) return

  await deleteFiveCentsCdnStreamById(streamId)
}
