import {
  getEvents,
  getStudioDashboardStats,
  getUserCreditsRowByUserId,
  getWalletTransactionsByUserId,
} from "@/lib/db-queries"
import { normalizeUserCreditsRow } from "@/lib/normalize-user-credits"
import { jsonError, jsonOk, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user) => {
  const role = user.role as string
  if (role !== "studio" && role !== "admin") {
    return jsonError("Forbidden", 403)
  }

  const studioId = user.id as string

  try {
    const [statsRaw, creditsRow, events, transactions] = await Promise.all([
      getStudioDashboardStats(studioId),
      getUserCreditsRowByUserId(studioId),
      getEvents({ studioId, limit: 10 }),
      getWalletTransactionsByUserId(studioId, 5),
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
    console.error("[studio/dashboard] Error:", error)
    return jsonError("Failed to load studio dashboard data", 500)
  }
})
