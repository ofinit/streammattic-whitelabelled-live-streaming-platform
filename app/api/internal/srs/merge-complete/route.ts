import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getSrsSettings } from "@/lib/srs-settings"
import type { SrsMergeCompletePayload } from "@/lib/srs-merge-contract"

async function authorized(request: Request): Promise<boolean> {
  const settings = await getSrsSettings()
  if (!settings.workerSecret) return process.env.NODE_ENV !== "production"
  const auth = request.headers.get("authorization")
  const headerSecret = request.headers.get("x-worker-secret")
  return auth === `Bearer ${settings.workerSecret}` || headerSecret === settings.workerSecret
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Partial<SrsMergeCompletePayload>
  if (!body.sessionId || !body.streamId || !body.sourceDir || !body.outputPath || !body.publicUrl || !body.status) {
    return NextResponse.json({ error: "Missing merge completion fields" }, { status: 400 })
  }

  const sql = getDb()
  await sql`
    INSERT INTO stream_recordings (
      session_id, event_id, stream_id, source_dir, output_path, public_url,
      file_size_bytes, duration_seconds, status, error_message
    ) VALUES (
      ${body.sessionId}, ${body.eventId ?? null}, ${body.streamId}, ${body.sourceDir}, ${body.outputPath}, ${body.publicUrl},
      ${body.fileSizeBytes ?? null}, ${body.durationSeconds ?? null}, ${body.status}, ${body.errorMessage ?? null}
    )
  `
  await sql`
    UPDATE stream_sessions
    SET merged = ${body.status === "merged"},
        merge_status = ${body.status},
        merged_at = CASE WHEN ${body.status} = 'merged' THEN NOW() ELSE merged_at END,
        final_recording_path = ${body.status === "merged" ? body.outputPath : null},
        final_recording_url = ${body.status === "merged" ? body.publicUrl : null},
        merge_error = ${body.errorMessage ?? null},
        updated_at = NOW()
    WHERE id = ${body.sessionId}
  `

  return NextResponse.json({ success: true })
}
