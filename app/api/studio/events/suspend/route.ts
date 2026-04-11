import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { checkStudioSubscriptionActiveForEventManagement } from "@/lib/studio-subscription"
import { sanitizeEventForClient } from "@/lib/sanitize-event-for-client"

/**
 * Suspend / unsuspend public event page (streamer + studio only; admin DELETE still removes events).
 * Dedicated route avoids PUT body-shape issues and full-row update failures.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = (await req.json()) as { id?: string; suspended?: boolean }
    const id = typeof body.id === "string" ? body.id.trim() : ""
    if (!id) return NextResponse.json({ error: "Event id is required" }, { status: 400 })
    if (typeof body.suspended !== "boolean") {
      return NextResponse.json({ error: "Field `suspended` (boolean) is required" }, { status: 400 })
    }

    const sql = getDb()
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false`.catch(() => {})

    const existing = await sql`SELECT * FROM events WHERE id = ${id}`
    if (existing.length === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    const existingRow = existing[0] as Record<string, unknown>
    const targetUserId = existingRow.user_id as string

    if (targetUserId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (user.role === "studio" && targetUserId === user.id) {
      const sub = await checkStudioSubscriptionActiveForEventManagement(sql, user.id as string, user.role as string)
      if (!sub.ok) {
        return NextResponse.json({ error: sub.message, code: "STUDIO_SUBSCRIPTION_EXPIRED" }, { status: 403 })
      }
    }

    /** Streamers (and admins acting on behalf of streamers) are not gated by studio subscription here. */

    const nextSuspended = body.suspended
    try {
      const rows = await sql`
        UPDATE events SET is_suspended = ${nextSuspended}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `
      if (rows.length === 0) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      const updatedEvent = rows[0] as Record<string, unknown>
      return NextResponse.json({
        event: toCamel(sanitizeEventForClient(updatedEvent as Record<string, unknown>)),
      })
    } catch (e) {
      console.error("[studio/events/suspend POST]", e)
      return NextResponse.json(
        {
          error:
            e instanceof Error && e.message.includes("is_suspended")
              ? "Database is missing is_suspended. Run migrations or redeploy the latest schema."
              : "Could not update suspension status.",
        },
        { status: 500 },
      )
    }
  } catch (e) {
    console.error("[studio/events/suspend POST]", e)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
