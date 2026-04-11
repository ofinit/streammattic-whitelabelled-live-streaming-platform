import { Suspense } from "react"
import { EventVisitorsPage } from "@/components/event-visitors/event-visitors-page"

export default function StudioEventVisitorsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground p-6">Loading…</div>}>
      <EventVisitorsPage mode="studio" basePath="/studio" />
    </Suspense>
  )
}
