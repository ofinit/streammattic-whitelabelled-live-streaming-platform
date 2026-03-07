import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user, request) => {
  const url = new URL(request.url)
  const userId = url.searchParams.get("userId") || user.id as string
  const sql = getDb()

  if (userId !== user.id && user.role !== "admin") {
    return jsonError("Forbidden", 403)
  }

  const rows = await sql`SELECT * FROM user_credits WHERE user_id = ${userId}`
  if (rows.length === 0) return jsonOk({ credits: { rtmp: 0, youtubeApi: 0, youtubeEmbed: 0, thirdParty: 0 } })
  return jsonOk({ credits: toCamel(rows[0] as Record<string, unknown>) })
})
