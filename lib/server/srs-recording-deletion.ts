import { getDb } from "@/lib/db"
import { buildRtmpStreamId } from "@/lib/rtmp-auth"

type Sql = ReturnType<typeof getDb>

function addString(set: Set<string>, value: unknown) {
  if (typeof value === "string" && value.trim()) set.add(value.trim())
}

export async function enqueueSrsRecordingDeletion(sql: Sql, input: {
  eventId: string
  reason: string
}): Promise<void> {
  const eventRows = await sql`
    SELECT id, slug, stream_type, stream_key, rtmp_url, hls_url
    FROM events
    WHERE id = ${input.eventId}
    LIMIT 1
  `
  const event = eventRows[0] as Record<string, unknown> | undefined
  if (!event || event.stream_type !== "rtmp") return

  const streamIds = new Set<string>()
  const paths = new Set<string>()
  const slug = typeof event.slug === "string" && event.slug.trim() ? event.slug.trim() : input.eventId
  streamIds.add(buildRtmpStreamId(slug))
  addString(paths, event.hls_url)

  const dateRows = await sql`
    SELECT id, stream_key, rtmp_url
    FROM event_dates
    WHERE event_id = ${input.eventId}
  `.catch(() => [])
  for (const row of dateRows as Record<string, unknown>[]) {
    addString(streamIds, typeof row.stream_key === "string" ? row.stream_key.split("?")[0] : "")
    if (row.id) streamIds.add(buildRtmpStreamId(slug, String(row.id)))
  }

  const tokenRows = await sql`
    SELECT stream_id
    FROM stream_tokens
    WHERE event_id = ${input.eventId}
  `.catch(() => [])
  for (const row of tokenRows as Record<string, unknown>[]) addString(streamIds, row.stream_id)

  const sessionRows = await sql`
    SELECT stream_id, final_recording_path, final_recording_url
    FROM stream_sessions
    WHERE event_id = ${input.eventId}
  `.catch(() => [])
  for (const row of sessionRows as Record<string, unknown>[]) {
    addString(streamIds, row.stream_id)
    addString(paths, row.final_recording_path)
    addString(paths, row.final_recording_url)
  }

  const recordingRows = await sql`
    SELECT stream_id, source_dir, output_path, public_url
    FROM stream_recordings
    WHERE event_id = ${input.eventId}
  `.catch(() => [])
  for (const row of recordingRows as Record<string, unknown>[]) {
    addString(streamIds, row.stream_id)
    addString(paths, row.source_dir)
    addString(paths, row.output_path)
    addString(paths, row.public_url)
  }

  await sql`
    INSERT INTO stream_recording_deletion_jobs (event_id, event_slug, stream_ids, paths, reason)
    VALUES (
      ${input.eventId},
      ${slug},
      ${JSON.stringify([...streamIds])}::jsonb,
      ${JSON.stringify([...paths])}::jsonb,
      ${input.reason}
    )
  `
}
