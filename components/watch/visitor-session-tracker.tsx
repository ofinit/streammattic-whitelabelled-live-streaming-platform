"use client"

import { useEffect, useRef } from "react"
import { watchSessionKeyStorage, watchVisitorKeyStorage } from "@/lib/watch-session-client"

const HEARTBEAT_MS = 45_000

/**
 * Fire-and-forget session beacon + heartbeat for watch analytics (does not block playback).
 */
export function VisitorSessionTracker({ eventId }: { eventId: string }) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    let sk = sessionStorage.getItem(watchSessionKeyStorage(eventId))
    if (!sk) {
      sk = crypto.randomUUID()
      try {
        sessionStorage.setItem(watchSessionKeyStorage(eventId), sk)
      } catch {
        /* ignore */
      }
    }

    const patch = (sync?: boolean) => {
      let vk = sessionStorage.getItem(watchVisitorKeyStorage(eventId))
      if (!vk) return
      const payload = JSON.stringify({ sessionKey: sk, visitorKey: vk })
      const url = `/api/watch/${encodeURIComponent(eventId)}/session`
      if (sync && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" })
        navigator.sendBeacon(url, blob)
        return
      }
      fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }

    const postPresence = (vk: string | null) => {
      fetch(`/api/watch/${encodeURIComponent(eventId)}/presence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          vk ? { visitorKey: vk, sessionKey: sk } : {},
        ),
      }).catch(() => {})
    }

    const postSession = async () => {
      let vk = sessionStorage.getItem(watchVisitorKeyStorage(eventId))
      try {
        const res = await fetch(`/api/watch/${encodeURIComponent(eventId)}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionKey: sk,
            visitorKey: vk || undefined,
            landingPageUrl: window.location.href,
          }),
        })
        if (!res.ok) {
          postPresence(null)
          return
        }
        const data = (await res.json().catch(() => ({}))) as { visitorKey?: string }
        if (data.visitorKey) {
          try {
            sessionStorage.setItem(watchVisitorKeyStorage(eventId), data.visitorKey)
          } catch {
            /* ignore */
          }
        }
        const vkFinal = sessionStorage.getItem(watchVisitorKeyStorage(eventId))
        postPresence(vkFinal)
      } catch {
        postPresence(null)
      }
    }

    void postSession()

    intervalRef.current = setInterval(() => patch(), HEARTBEAT_MS)

    const onHide = () => {
      if (document.visibilityState === "hidden") patch()
    }
    const onUnload = () => {
      patch()
      fetch(`/api/watch/${encodeURIComponent(eventId)}/presence`, {
        method: "DELETE",
        keepalive: true,
      }).catch(() => {})
    }

    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("beforeunload", onUnload)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("beforeunload", onUnload)
      fetch(`/api/watch/${encodeURIComponent(eventId)}/presence`, { method: "DELETE" }).catch(() => {})
    }
  }, [eventId])

  return null
}
