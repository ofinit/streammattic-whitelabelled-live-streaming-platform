"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-voguish-hero (mint / editorial full-bleed). */
export function StreamVoguishHeroTemplate({
  eventTitle = "Riley & Jordan",
  eventDescription = "We solicit your gracious virtual presence with family and friends on this special day.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-voguish-hero"
      brandLabel="Voguish Hero"
      eyebrow="We are getting married"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-[#0f1f1c] text-emerald-50"
      headerBarClassName="border-emerald-800/50 bg-[#0f1f1c]/85 text-emerald-100"
      heroOverlayClassName="bg-gradient-to-b from-emerald-950/55 via-[#0a1814]/35 to-emerald-950/80"
      eyebrowClassName="text-[#7dd3c0]"
      titleClassName="text-white drop-shadow"
      descriptionClassName="text-emerald-50/95"
      sectionClassName="border-emerald-900/40 bg-[#0f1f1c]/95 text-emerald-100"
    />
  )
}
