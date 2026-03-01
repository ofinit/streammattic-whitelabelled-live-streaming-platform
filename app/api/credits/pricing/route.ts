import { getDb } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async () => {
  const sql = getDb()
  const rows = await sql`SELECT value FROM platform_settings WHERE key = 'credit_pricing'`
  if (rows.length === 0) return jsonError("Pricing not configured", 500)

  const discountRows = await sql`SELECT value FROM platform_settings WHERE key = 'discount_tiers'`

  return jsonOk({
    pricing: (rows[0] as Record<string, unknown>).value,
    discountTiers: discountRows.length > 0 ? (discountRows[0] as Record<string, unknown>).value : [],
  })
})
