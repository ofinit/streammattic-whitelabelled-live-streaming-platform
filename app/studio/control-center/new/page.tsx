"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Redirect to the events list with the create dialog open.
 */
export default function StudioNewEventPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/studio/control-center?openModal=1")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-muted-foreground">Redirecting to create event...</p>
    </div>
  )
}
