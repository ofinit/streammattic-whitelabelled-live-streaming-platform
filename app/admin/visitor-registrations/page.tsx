import { Suspense } from "react"
import { EventVisitorsPage } from "@/components/event-visitors/event-visitors-page"

export default function AdminVisitorRegistrationsPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
      <EventVisitorsPage mode="admin" basePath="/admin" />
    </Suspense>
  )
}
