"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-showcase-home (gallery / home showcase layout). */
export function StreamShowcaseHomeTemplate({
  eventTitle = "Open House Live Tour",
  eventDescription = "Walk through the space with us — streaming in full HD with Q&A.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-showcase-home"
      brandLabel="Showcase Home"
      eyebrow="Virtual open house"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-stone-950 text-amber-50"
      headerBarClassName="border-amber-900/40 bg-stone-950/85 text-amber-100"
      heroOverlayClassName="bg-gradient-to-b from-stone-950/65 via-amber-950/25 to-stone-950/88"
      eyebrowClassName="text-amber-200/90"
      titleClassName="text-amber-50"
      descriptionClassName="text-amber-100/90"
      sectionClassName="border-amber-900/35 bg-stone-900/95 text-amber-50"
    />
  )
}
