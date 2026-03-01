import { getDb } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { notificationId, markAll } = body
  const sql = getDb()
  const userId = user.id as string

  if (markAll) {
    await sql`UPDATE notifications SET is_read = true WHERE user_id = ${userId} AND is_read = false`
  } else if (notificationId) {
    await sql`UPDATE notifications SET is_read = true WHERE id = ${notificationId} AND user_id = ${userId}`
  } else {
    return jsonError("notificationId or markAll is required")
  }

  return jsonOk({ success: true })
})
