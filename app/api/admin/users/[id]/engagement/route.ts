import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb, toCamelRows } from "@/lib/db"
import { ensureAdminUserEngagementSchema } from "@/lib/admin-user-engagement-schema"
import { normalizeCampaignType, normalizeEngagementChannel } from "@/lib/admin-user-engagement"

export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await props.params
    const sql = getDb()
    await ensureAdminUserEngagementSchema()
    const rows = await sql`
      SELECT id, user_id, created_by, campaign_type, channel, status, subject, note, follow_up_at, metadata, created_at
      FROM admin_user_engagement_logs
      WHERE user_id = ${id}
      ORDER BY created_at DESC
      LIMIT 50
    `
    return NextResponse.json({ success: true, logs: toCamelRows(rows) })
  } catch (error: any) {
    console.error("[admin/users/:id/engagement GET]", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole(["admin"])
    const { id } = await props.params
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const campaignType = normalizeCampaignType(body.campaignType)
    const channel = normalizeEngagementChannel(body.channel)
    const note = typeof body.note === "string" ? body.note.trim() : ""
    const subject = typeof body.subject === "string" ? body.subject.trim() : ""
    let followUpAt: string | null = null
    if (typeof body.followUpAt === "string" && body.followUpAt.trim()) {
      const parsed = new Date(body.followUpAt)
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid follow-up date" }, { status: 400 })
      }
      followUpAt = parsed.toISOString()
    }

    const sql = getDb()
    await ensureAdminUserEngagementSchema()
    const rows = await sql`
      INSERT INTO admin_user_engagement_logs
        (user_id, created_by, campaign_type, channel, status, subject, note, follow_up_at, metadata)
      VALUES
        (${id}, ${admin.id as string}, ${campaignType}, ${channel}, 'logged', ${subject || null}, ${note || null}, ${followUpAt}, '{}'::jsonb)
      RETURNING *
    `
    return NextResponse.json({ success: true, log: toCamelRows(rows)[0] })
  } catch (error: any) {
    console.error("[admin/users/:id/engagement POST]", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

