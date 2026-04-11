"use client"

import { use } from "react"
import { WatchEventContent } from "@/components/watch/watch-event-content"
import { VisitorSessionTracker } from "@/components/watch/visitor-session-tracker"

export default function EventSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <>
      <VisitorSessionTracker eventId={slug} />
      <WatchEventContent eventId={slug} />
    </>
  )
}
