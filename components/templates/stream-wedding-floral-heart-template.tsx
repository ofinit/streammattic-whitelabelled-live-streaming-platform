"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-wedding-floral-heart (floral / script wedding hero). */
export function StreamWeddingFloralHeartTemplate({
  eventTitle = "Amelia & Henry",
  eventDescription = "With love and gratitude — join our ceremony live with family and friends near and far.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-wedding-floral-heart"
      brandLabel="Floral Heart Wedding"
      eyebrow="We're getting married"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-rose-950 text-rose-50"
      headerBarClassName="border-rose-800/50 bg-rose-950/85 text-rose-100"
      heroOverlayClassName="bg-gradient-to-b from-rose-950/60 via-rose-900/35 to-rose-950/85"
      eyebrowClassName="text-rose-200"
      titleClassName="font-serif text-white drop-shadow-md md:text-7xl"
      descriptionClassName="text-rose-50/95"
      sectionClassName="border-rose-900/40 bg-rose-950/95 text-rose-100"
    />
  )
}
