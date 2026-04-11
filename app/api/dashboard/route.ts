import { getDb } from "@/lib/db"
import { jsonOk, withAuth } from "@/lib/api-helpers"

export const GET = withAuth(async (user) => {
  const sql = getDb()
  const userId = user.id as string
  const isAdmin = user.role === "admin"

  if (isAdmin) {
    const [users, events, orders, revenue] = await Promise.all([
      sql`SELECT count(*)::int as total, count(*) FILTER (WHERE role = 'studio')::int as studios, count(*) FILTER (WHERE role = 'streamer')::int as streamers FROM users`,
      sql`SELECT count(*)::int as total, count(*) FILTER (WHERE status = 'live')::int as live, count(*) FILTER (WHERE status = 'scheduled')::int as scheduled FROM events`,
      sql`SELECT count(*)::int as total, COALESCE(sum(total_price) FILTER (WHERE status = 'completed'), 0)::bigint as total_revenue FROM orders`,
      sql`SELECT COALESCE(sum(balance), 0)::bigint as total_wallet_balance FROM wallets`,
    ])

    return jsonOk({
      stats: {
        totalUsers: (users[0] as Record<string, unknown>).total,
        totalStudios: (users[0] as Record<string, unknown>).studios,
        totalStreamers: (users[0] as Record<string, unknown>).streamers,
        totalEvents: (events[0] as Record<string, unknown>).total,
        liveEvents: (events[0] as Record<string, unknown>).live,
        scheduledEvents: (events[0] as Record<string, unknown>).scheduled,
        totalOrders: (orders[0] as Record<string, unknown>).total,
        totalRevenue: Number((orders[0] as Record<string, unknown>).total_revenue) / 100,
        totalWalletBalance: Number((revenue[0] as Record<string, unknown>).total_wallet_balance) / 100,
      }
    })
  }

  // Non-admin dashboard
  const [wallet, credits, events, orders] = await Promise.all([
    sql`SELECT balance FROM wallets WHERE user_id = ${userId}`,
    sql`SELECT * FROM user_credits WHERE user_id = ${userId}`,
    sql`SELECT count(*)::int as total, count(*) FILTER (WHERE status = 'live')::int as live, count(*) FILTER (WHERE status = 'scheduled')::int as scheduled FROM events WHERE user_id = ${userId}`,
    sql`SELECT count(*)::int as total FROM orders WHERE user_id = ${userId}`,
  ])

  return jsonOk({
    stats: {
      walletBalance: wallet.length > 0 ? Number((wallet[0] as Record<string, unknown>).balance) / 100 : 0,
      credits: credits.length > 0 ? credits[0] : { rtmp: 0, youtube_api: 0, youtube_embed: 0, third_party: 0 },
      totalEvents: (events[0] as Record<string, unknown>).total,
      liveEvents: (events[0] as Record<string, unknown>).live,
      scheduledEvents: (events[0] as Record<string, unknown>).scheduled,
      totalOrders: (orders[0] as Record<string, unknown>).total,
    }
  })
})
