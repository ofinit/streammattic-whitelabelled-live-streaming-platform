"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-classic-banner (full-width banner / stage hero). */
export function StreamClassicBannerTemplate({
  eventTitle = "Annual Gala Live",
  eventDescription = "Join us for keynote sessions and celebration — streaming to guests everywhere.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-classic-banner"
      brandLabel="Classic Banner Live"
      eyebrow="Live broadcast"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-slate-950 text-slate-50"
      headerBarClassName="border-slate-700/60 bg-slate-950/80 text-slate-100"
      heroOverlayClassName="bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/85"
      eyebrowClassName="text-slate-300"
      titleClassName="text-white drop-shadow-md"
      descriptionClassName="text-slate-200"
      sectionClassName="border-slate-800 bg-slate-900/90 text-slate-200"
    />
  )
}
