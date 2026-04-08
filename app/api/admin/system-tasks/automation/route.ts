import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  try {
    await requireRole(["admin"])
    const sql = getDb()
    
    const rows = await sql`SELECT value FROM platform_settings WHERE key = 'auto_cleanup_config'`
    const config = rows[0]?.value || { enabled: false, schedule: "0 0 * * *" }
    
    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(["admin"])
    const body = await req.json()
    const { enabled, schedule } = body
    
    const sql = getDb()
    const config = { enabled: !!enabled, schedule: schedule || "0 0 * * *" }
    
    await sql`
      INSERT INTO platform_settings (key, value, updated_at)
      VALUES ('auto_cleanup_config', ${JSON.stringify(config)}::jsonb, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
    
    return NextResponse.json({ success: true, config })
  } catch (error: any) {
    if (error.message === "Forbidden" || error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
