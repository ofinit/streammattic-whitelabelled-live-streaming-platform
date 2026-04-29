import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb, toCamel } from "@/lib/db"
import { sanitizeEventForClient } from "@/lib/sanitize-event-for-client"

export async function GET(req: Request) {
  try {
    await requireRole(["admin"])
    
    // Parse query params (optional)
    const url = new URL(req.url)
    const status = url.searchParams.get("status") // draft|scheduled|live|completed
    
    const sql = getDb()
    
    const domainSubquery = sql.unsafe(`(
      SELECT domain FROM domains
      WHERE user_id = COALESCE(e.studio_id, e.user_id, u.id)
        AND verification_status IN ('verified', 'pending')
        AND is_primary = true
      ORDER BY CASE WHEN verification_status = 'verified' THEN 0 ELSE 1 END, created_at DESC
      LIMIT 1
    ) AS studio_custom_domain`)

    let rows: Record<string, unknown>[]
    if (status) {
      rows = await sql`
        SELECT e.*, u.name AS user_name, u.email AS user_email, u.role AS user_role,
               ${domainSubquery}
        FROM events e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.status = ${status}
        ORDER BY e.created_at DESC
        LIMIT 100
      ` as Record<string, unknown>[]
    } else {
      rows = await sql`
        SELECT e.*, u.name AS user_name, u.email AS user_email, u.role AS user_role,
               ${domainSubquery}
        FROM events e
        LEFT JOIN users u ON e.user_id = u.id
        ORDER BY e.created_at DESC
        LIMIT 100
      ` as Record<string, unknown>[]
    }

    const events = rows.map(r => {
      const camel = toCamel(sanitizeEventForClient(r))
      // Fallback: Default to 30 days from creation if validity_expires_at is missing (common for old mock data)
      const createdAt = new Date((r.created_at ?? camel.createdAt) as string)
      const fallbackExpiry = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)

      return {
        ...camel,
        validityExpiresAt: (camel.validityExpiresAt as string | null) || fallbackExpiry.toISOString(),
        viewers: (camel.currentViewers as number) || 0,
        revenue: 0,
        studioName: camel.userName,  // Legacy field
        isMock: !!(camel.isMock ?? r.is_mock),
        eventType: "Virtual",
      }
    })

    return NextResponse.json({ success: true, events })
  } catch (error: any) {
    console.error("Admin Events API error:", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
