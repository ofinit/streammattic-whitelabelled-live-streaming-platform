import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    await requireRole(["admin"])
    const sql = getDb()

    // 1. Fetch latest cron job logs (last 50 runs)
    const cronLogs = await sql`
      SELECT id, started_at as "startedAt", ended_at as "endedAt", 
             status, deleted_count as "deletedCount", error_message as "errorMessage"
      FROM cron_job_logs
      ORDER BY started_at DESC
      LIMIT 50
    `

    // 2. Fetch latest deleted events (last 100)
    const deletionLogs = await sql`
      SELECT id, event_title as "eventTitle", owner_email as "ownerEmail", 
             deleted_at as "deletedAt", reason, assets_found as "assetsFound", 
             assets_deleted as "assetsDeleted"
      FROM deleted_events_log
      ORDER BY deleted_at DESC
      LIMIT 100
    `

    return NextResponse.json({
      success: true,
      cronLogs,
      deletionLogs
    })
  } catch (error: any) {
    console.error("System logs API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
