import {
  getEvents,
  getStreamerDashboardStats,
  getUserCreditsRowByUserId,
  getWalletTransactionsByUserId,
} from "@/lib/db-queries"
import { normalizeUserCreditsRow } from "@/lib/normalize-user-credits"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user) => {
  const role = user.role as string
  if (role !== "streamer" && role !== "admin") {
    return jsonError("Forbidden", 403)
  }

  const userId = user.id as string

  try {
    const [statsRaw, creditsRow, events, transactions] = await Promise.all([
      getStreamerDashboardStats(userId),
      getUserCreditsRowByUserId(userId),
      getEvents({ userId, limit: 10 }),
      getWalletTransactionsByUserId(userId, 5),
    ])

    const credits = normalizeUserCreditsRow(creditsRow ?? undefined)
    const totalCreditsRemaining =
      credits.rtmp + credits.youtube_api + credits.youtube_embed + credits.third_party

    const stats = {
      ...statsRaw,
      credits,
      totalCreditsRemaining,
    }

    return jsonOk({ stats, events, transactions })
  } catch (error) {
    console.error("[streamer/dashboard] Error:", error)
    return jsonError("Failed to load streamer dashboard data", 500)
  }
})
