import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { ensureAdminUserEngagementSchema } from "@/lib/admin-user-engagement-schema"
import { normalizeCampaignType } from "@/lib/admin-user-engagement"
import { sendInactiveUserEngagementEmail } from "@/lib/email"

function requestOrigin(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
  if (envUrl?.trim()) return envUrl.trim()
  const url = new URL(req.url)
  return `${url.protocol}//${url.host}`
}

export async function POST(req: Request) {
  try {
    const admin = await requireRole(["admin"])
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const userIds = Array.isArray(body.userIds)
      ? body.userIds.map((id) => String(id)).filter(Boolean).slice(0, 100)
      : []
    if (userIds.length === 0) {
      return NextResponse.json({ error: "Select at least one user" }, { status: 400 })
    }
    const campaignType = normalizeCampaignType(body.campaignType)
    const note = typeof body.note === "string" ? body.note.trim() : ""
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
    const users = await sql(
      `SELECT id, email, name, role::text AS role FROM users WHERE id = ANY($1::uuid[])`,
      [userIds],
    )
    const appUrl = requestOrigin(req)
    const results: Array<{ userId: string; email: string; status: "sent" | "failed" }> = []

    for (const user of users as Array<Record<string, unknown>>) {
      const userId = String(user.id)
      const email = String(user.email || "")
      const sent = await sendInactiveUserEngagementEmail({
        toEmail: email,
        name: String(user.name || ""),
        role: String(user.role || "streamer"),
        campaignType,
        appUrl,
        note,
      })
      const status = sent ? "sent" : "failed"
      await sql`
        INSERT INTO admin_user_engagement_logs
          (user_id, created_by, campaign_type, channel, status, subject, note, follow_up_at, metadata)
        VALUES
          (
            ${userId},
            ${admin.id as string},
            ${campaignType},
            'email',
            ${status},
            ${null},
            ${note || null},
            ${followUpAt},
            ${JSON.stringify({ source: "bulk_campaign" })}::jsonb
          )
      `
      results.push({ userId, email, status })
    }

    return NextResponse.json({
      success: true,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    })
  } catch (error: any) {
    console.error("[admin/users/engagement/campaign POST]", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

