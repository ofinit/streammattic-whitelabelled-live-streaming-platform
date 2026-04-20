"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-digital-creative (bold creative / tech-forward hero). */
export function StreamDigitalCreativeTemplate({
  eventTitle = "Creative Showcase 2026",
  eventDescription = "Experience the launch live — design, motion, and music in one stream.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-digital-creative"
      brandLabel="Digital Creative"
      eyebrow="Digital premiere"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-[#12061a] text-fuchsia-50"
      headerBarClassName="border-fuchsia-900/50 bg-[#12061a]/90 text-fuchsia-100"
      heroOverlayClassName="bg-gradient-to-b from-purple-950/70 via-fuchsia-950/35 to-[#12061a]/90"
      eyebrowClassName="text-fuchsia-300"
      titleClassName="bg-gradient-to-r from-fuchsia-100 to-violet-200 bg-clip-text text-transparent drop-shadow-sm"
      descriptionClassName="text-fuchsia-100/90"
      sectionClassName="border-fuchsia-900/40 bg-[#1a0a24]/95 text-fuchsia-100"
    />
  )
}
