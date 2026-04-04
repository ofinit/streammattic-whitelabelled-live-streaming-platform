import { getDb, toCamelRows } from "@/lib/db"
import { jsonOk, jsonError, withAuth, withRole } from "@/lib/api-helpers"

export const GET = withRole(["studio"], async (user) => {
  try {
    const sql = getDb()
    const rows = await sql`
      SELECT * FROM domains 
      WHERE user_id = ${user.id} 
      ORDER BY created_at DESC
    `
    return jsonOk({ domains: toCamelRows(rows as Record<string, unknown>[]) })
  } catch (err) {
    console.error("GET /api/studio/domains error:", err)
    return jsonError("Failed to fetch domains")
  }
})

export const POST = withRole(["studio"], async (user, request) => {
  try {
    const { domain } = await request.json()
    if (!domain) return jsonError("Domain is required")

    const sql = getDb()
    const verificationToken = `streamlivee-verify-${Math.random().toString(36).substring(2, 34)}`

    const [newDomain] = await sql`
      INSERT INTO domains (user_id, domain, verification_token, verification_status, is_primary)
      VALUES (${user.id}, ${domain.trim().toLowerCase()}, ${verificationToken}, 'pending', true)
      ON CONFLICT (domain) 
      DO UPDATE SET verification_token = EXCLUDED.verification_token, updated_at = NOW()
      RETURNING *
    `

    return jsonOk({ 
      message: "Domain linked successfully", 
      domain: toCamelRows([newDomain as Record<string, unknown>])[0] 
    })
  } catch (err) {
    console.error("POST /api/studio/domains error:", err)
    return jsonError("Failed to link domain")
  }
})
