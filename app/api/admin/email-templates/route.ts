import { getDb, toCamelRows } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { NextRequest, NextResponse } from "next/server"

export const GET = withAuth(async (user, request) => {
  if (user.role !== "admin") return jsonError("Unauthorized", 403)
  
  const sql = getDb()
  // Try mapping from platform_settings first
  const rows = await sql`SELECT value FROM platform_settings WHERE key = 'email_templates'`
  
  if (rows.length > 0) {
    return jsonOk({ templates: rows[0].value })
  }

  // Fallback to a hardcoded list if not in DB, but the goal is to have it in DB
  return jsonOk({ templates: [] })
})

export const POST = withAuth(async (user, request) => {
  if (user.role !== "admin") return jsonError("Unauthorized", 403)
  
  const body = await request.json()
  const { templates } = body
  const sql = getDb()

  if (!templates || !Array.isArray(templates)) {
    return jsonError("Invalid templates data")
  }

  await sql`
    INSERT INTO platform_settings (key, value) 
    VALUES ('email_templates', ${JSON.stringify(templates)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `

  return jsonOk({ success: true, message: "Email templates updated" })
})
