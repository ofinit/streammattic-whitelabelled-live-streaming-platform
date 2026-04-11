"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Redirect to the events list with the create dialog open.
 * Admin uses the same create flow as streamer/studio (list page + EventFormDialog).
 */
export default function AdminNewEventPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/admin/control-center?openModal=1")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirecting to create event...</p>
    </div>
  )
}
