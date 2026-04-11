"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

/** Maps /streamer/control-center/:id → ?event=:id (see control-center page). */
export default function StreamerControlCenterEventRedirect() {
  const router = useRouter()
  const params = useParams()
  const raw = params.id
  const id = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : ""

  useEffect(() => {
    if (!id) return
    router.replace(`/streamer/control-center?event=${encodeURIComponent(id)}`)
  }, [router, id])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground text-sm">
      Opening event…
    </div>
  )
}
