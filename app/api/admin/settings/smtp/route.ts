import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { invalidateCache } from "@/lib/redis"
import {
  PLATFORM_SMTP_SETTING_KEY,
  buildPlatformSmtpStoredConfig,
  toPlatformSmtpPublicConfig,
  validatePlatformSmtpConfig,
} from "@/lib/platform-smtp"

export async function GET() {
  try {
    await requireRole(["admin"])
    const sql = getDb()
    const rows = await sql`SELECT value FROM platform_settings WHERE key = ${PLATFORM_SMTP_SETTING_KEY}`
    return NextResponse.json({
      success: true,
      smtp: toPlatformSmtpPublicConfig(rows[0]?.value),
    })
  } catch (error: any) {
    console.error("[admin/settings/smtp GET]", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    await requireRole(["admin"])
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const sql = getDb()
    const previousRows = await sql`SELECT value FROM platform_settings WHERE key = ${PLATFORM_SMTP_SETTING_KEY}`
    const nextConfig = buildPlatformSmtpStoredConfig(body, previousRows[0]?.value)
    const validationError = validatePlatformSmtpConfig(nextConfig)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const rows = await sql`
      INSERT INTO platform_settings (key, value, updated_at)
      VALUES (${PLATFORM_SMTP_SETTING_KEY}, ${JSON.stringify(nextConfig)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING value
    `
    await invalidateCache(`platform_setting:${PLATFORM_SMTP_SETTING_KEY}`)

    return NextResponse.json({
      success: true,
      smtp: toPlatformSmtpPublicConfig(rows[0]?.value),
    })
  } catch (error: any) {
    console.error("[admin/settings/smtp PUT]", error)
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

