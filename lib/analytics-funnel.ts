import { getDb } from "@/lib/db"
import type { FunnelEventType } from "@/lib/visitor-analytics-constants"

export type InsertFunnelEventParams = {
  eventType: FunnelEventType
  visitorKey: string
  sessionKey?: string | null
  userId?: string | null
  relatedEventId?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  contextType?: "platform" | "studio" | null
  contextId?: string | null
  payload?: Record<string, unknown>
}

export async function insertFunnelEvent(p: InsertFunnelEventParams): Promise<void> {
  const sql = getDb()
  const payloadJson = JSON.stringify(p.payload ?? {})
  try {
    await sql`
      INSERT INTO analytics_funnel_events (
        event_type, visitor_key, session_key, user_id, related_event_id,
        utm_source, utm_medium, utm_campaign, context_type, context_id, payload
      ) VALUES (
        ${p.eventType},
        ${p.visitorKey},
        ${p.sessionKey ?? null},
        ${p.userId ?? null},
        ${p.relatedEventId ?? null},
        ${p.utmSource ?? null},
        ${p.utmMedium ?? null},
        ${p.utmCampaign ?? null},
        ${p.contextType ?? null},
        ${p.contextId ?? null},
        ${payloadJson}::jsonb
      )
    `
  } catch (e) {
    console.error("[analytics-funnel] insert failed:", e)
  }
}

/** Prefer latest session visitor_key for this user; else synthetic stable id for funnel rows. */
export async function visitorKeyForUser(userId: string): Promise<string> {
  const sql = getDb()
  const rows = await sql`
    SELECT visitor_key FROM event_visitor_sessions
    WHERE user_id = ${userId}
    ORDER BY last_seen_at DESC
    LIMIT 1
  `
  if (rows.length > 0) {
    return (rows[0] as { visitor_key: string }).visitor_key
  }
  return `vk_uid_${userId.replace(/-/g, "").slice(0, 16)}`
}

export async function emitCreditPurchasedFunnel(
  userId: string,
  orderId: string,
  orderType: string,
  totalPaise: number,
): Promise<void> {
  const vk = await visitorKeyForUser(userId)
  await insertFunnelEvent({
    eventType: "CREDIT_PURCHASED",
    visitorKey: vk,
    userId,
    payload: { orderId, orderType, totalPaise },
  })
}
