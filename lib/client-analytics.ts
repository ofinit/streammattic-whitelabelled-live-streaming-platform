"use client"

import { readWatchSessionKeys } from "@/lib/watch-session-client"

export type TrackEventOptions = {
  /** Watch event id/slug — used with sessionStorage keys from the session beacon */
  eventId?: string
  /** Override when keys are not loaded from sessionStorage */
  visitorKey?: string
  sessionKey?: string
}

/**
 * Unified client helper for custom analytics (`ANALYTICS_CUSTOM` funnel rows).
 * Requires either `options.visitorKey` or `options.eventId` with an existing watch session.
 */
export async function trackEvent(
  name: string,
  payload?: Record<string, unknown>,
  options?: TrackEventOptions,
): Promise<void> {
  if (typeof window === "undefined") return
  const fromStorage = options?.eventId ? readWatchSessionKeys(options.eventId) : { sessionKey: null, visitorKey: null }
  const visitorKey = options?.visitorKey ?? fromStorage.visitorKey
  if (!visitorKey) return

  const sessionKey = options?.sessionKey ?? fromStorage.sessionKey

  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        payload: payload ?? {},
        visitorKey,
        sessionKey: sessionKey ?? undefined,
        eventId: options?.eventId,
      }),
    })
  } catch {
    /* ignore */
  }
}
