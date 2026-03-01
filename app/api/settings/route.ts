import { getDb } from "@/lib/db"
import { jsonOk, jsonError, withAuth, withRole } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const key = url.searchParams.get("key")
  const sql = getDb()

  if (key) {
    const rows = await sql`SELECT key, value FROM platform_settings WHERE key = ${key}`
    if (rows.length === 0) return jsonError("Setting not found", 404)
    return jsonOk({ setting: rows[0] })
  }

  // Admin gets all settings, non-admin gets only public settings
  const publicKeys = ["credit_pricing", "discount_tiers", "validity_defaults", "payment_gateways"]
  const rows = user.role === "admin"
    ? await sql`SELECT key, value, updated_at FROM platform_settings ORDER BY key`
    : await sql`SELECT key, value FROM platform_settings WHERE key = ANY(${publicKeys}) ORDER BY key`

  return jsonOk({ settings: rows })
})

export const PUT = withRole(["admin"], async (adminUser, request) => {
  const body = await request.json()
  const { key, value } = body

  if (!key || value === undefined) return jsonError("key and value are required")

  const sql = getDb()
  const rows = await sql`
    INSERT INTO platform_settings (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = NOW()
    RETURNING *
  `

  return jsonOk({ setting: rows[0] })
})
