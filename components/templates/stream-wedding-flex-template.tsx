"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-wedding-flex (slider-style wedding showcase). */
export function StreamWeddingFlexTemplate({
  eventTitle = "Sophie & Daniel",
  eventDescription = "Celebrate with us — live stream, photos, and well-wishes from everyone you love.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-wedding-flex"
      brandLabel="Flex Wedding Showcase"
      eyebrow="Save the date"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-pink-950 text-pink-50"
      headerBarClassName="border-pink-800/50 bg-pink-950/85 text-pink-100"
      heroOverlayClassName="bg-gradient-to-b from-pink-950/65 via-rose-900/30 to-pink-950/88"
      eyebrowClassName="text-pink-200"
      titleClassName="text-white drop-shadow"
      descriptionClassName="text-pink-50/95"
      sectionClassName="border-pink-900/40 bg-pink-950/95 text-pink-100"
    />
  )
}
