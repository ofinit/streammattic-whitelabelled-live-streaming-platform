"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-wedding-cinematic (cinematic slider / dramatic lighting). */
export function StreamWeddingCinematicTemplate({
  eventTitle = "Isla & Marcus",
  eventDescription = "A cinematic celebration — live stream in full color with everyone who matters.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-wedding-cinematic"
      brandLabel="Cinematic Wedding"
      eyebrow="Premiere night"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-[#14061f] text-violet-50"
      headerBarClassName="border-violet-900/50 bg-[#14061f]/90 text-violet-100"
      heroOverlayClassName="bg-gradient-to-b from-purple-950/70 via-[#14061f]/40 to-black/88"
      eyebrowClassName="text-violet-300"
      titleClassName="text-white drop-shadow-lg"
      descriptionClassName="text-violet-100/90"
      sectionClassName="border-violet-900/40 bg-[#1a0a26] text-violet-100"
    />
  )
}
