"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-corporate-clean (minimal corporate broadcast). */
export function StreamCorporateCleanTemplate({
  eventTitle = "Quarterly Business Update",
  eventDescription = "A clean, focused live stream for investors and teams — slides and Q&A included.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-corporate-clean"
      brandLabel="Clean Corporate Live"
      eyebrow="Company live"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-zinc-50 text-zinc-900"
      headerBarClassName="border-zinc-200 bg-white/90 text-zinc-800"
      heroOverlayClassName="bg-gradient-to-b from-zinc-900/55 via-zinc-900/25 to-zinc-900/70"
      eyebrowClassName="text-zinc-200"
      titleClassName="text-white drop-shadow"
      descriptionClassName="text-zinc-100"
      sectionClassName="border-zinc-200 bg-white text-zinc-700"
    />
  )
}
