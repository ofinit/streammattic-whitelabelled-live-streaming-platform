import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    
    // Parse query params (optional)
    const url = new URL(req.url)
    const status = url.searchParams.get("status") // draft|scheduled|live|completed
    
    const sql = getDb()
    
    let rows;
    if (status) {
      rows = await sql`
        SELECT 
          e.id, e.title, e.stream_type as "streamType", e.status, e.scheduled_at as "scheduledAt", 
          e.max_viewers as "maxViewers", e.current_viewers as "currentViewers", e.created_at, e.slug, e.crew_pin_hash,
          e.is_mock as "isMock",
          u.id as "userId", u.name as "userName", u.email as "userEmail", u.role as "userRole"
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.status = ${status}
        ORDER BY e.created_at DESC
        LIMIT 100
      `
    } else {
      rows = await sql`
        SELECT 
          e.id, e.title, e.stream_type as "streamType", e.status, e.scheduled_at as "scheduledAt", 
          e.max_viewers as "maxViewers", e.current_viewers as "currentViewers", e.created_at, e.slug, e.crew_pin_hash,
          e.is_mock as "isMock",
          u.id as "userId", u.name as "userName", u.email as "userEmail", u.role as "userRole"
        FROM events e
        JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
        LIMIT 100
      `
    }

    const events = rows.map(r => ({
      id: r.id,
      title: r.title,
      streamType: r.streamType,
      status: r.status,
      scheduledAt: r.scheduledAt,
      viewers: r.currentViewers || 0,
      revenue: 0,
      studioName: r.userName, // Legacy field
      userName: r.userName,
      userEmail: r.userEmail,
      userRole: r.userRole,
      isMock: !!r.isMock,
      eventType: "Virtual",
      slug: r.slug,
      userId: r.userId,
      hasCrewPin: !!r.crew_pin_hash
    }))

    return NextResponse.json({ success: true, events })
  } catch (error: any) {
    console.error("Admin Events API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
