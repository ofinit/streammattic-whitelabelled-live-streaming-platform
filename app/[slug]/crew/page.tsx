"use client"

import { use } from "react"
import { CrewCredentialsContent } from "@/components/watch/crew-credentials-content"

/** Crew credentials page: /{event-slug}/crew (PIN-protected RTMP / ingest keys). */
export default function SlugCrewCredentialsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <CrewCredentialsContent eventId={slug} />
}
