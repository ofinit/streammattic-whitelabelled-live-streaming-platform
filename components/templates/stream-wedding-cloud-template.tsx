"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-wedding-cloud (soft sky / romantic clouds). */
export function StreamWeddingCloudTemplate({
  eventTitle = "Elena & Mateo",
  eventDescription = "Head in the clouds — join our wedding live from wherever you are.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-wedding-cloud"
      brandLabel="Cloud Romance Wedding"
      eyebrow="Love in the air"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-sky-950 text-sky-50"
      headerBarClassName="border-sky-800/50 bg-sky-950/85 text-sky-100"
      heroOverlayClassName="bg-gradient-to-b from-sky-950/55 via-blue-950/30 to-sky-950/82"
      eyebrowClassName="text-sky-200"
      titleClassName="text-white drop-shadow"
      descriptionClassName="text-sky-50/95"
      sectionClassName="border-sky-900/40 bg-sky-950/95 text-sky-100"
    />
  )
}
