export type SrsMergeStatus = "pending" | "merge_ready" | "merging" | "merged" | "failed"

export type SrsMergeCompletePayload = {
  sessionId: string
  streamId: string
  eventId?: string | null
  sourceDir: string
  outputPath: string
  publicUrl: string
  fileSizeBytes?: number | null
  durationSeconds?: number | null
  status: Extract<SrsMergeStatus, "merged" | "failed">
  errorMessage?: string | null
}
