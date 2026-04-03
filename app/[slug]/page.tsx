"use client"

import { use } from "react"
import { WatchEventContent } from "@/components/watch/watch-event-content"

export default function EventSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <WatchEventContent eventId={slug} />
}
