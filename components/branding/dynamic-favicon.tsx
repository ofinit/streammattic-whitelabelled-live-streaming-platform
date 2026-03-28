"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { applyFaviconHrefToDocument } from "@/lib/favicon-dom"

/**
 * Applies favicon for dashboard routes: platform (admin) → studio / streamer’s studio → default.
 * Watch/event pages also set favicon from API payload (see WatchEventContent).
 */
export function DynamicFavicon() {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/favicon/resolve", { credentials: "include" })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { href?: string }
        if (data.href && !cancelled) applyFaviconHrefToDocument(data.href)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, user?.role, isLoading])

  return null
}
