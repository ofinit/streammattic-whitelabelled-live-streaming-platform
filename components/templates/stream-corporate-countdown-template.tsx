"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-corporate-countdown (summit with countdown styling). */
export function StreamCorporateCountdownTemplate({
  eventTitle = "Global Summit Live",
  eventDescription = "The countdown ends here — watch the keynote and live announcements.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-corporate-countdown"
      brandLabel="Summit Countdown"
      eyebrow="Starts soon"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-[#0c1020] text-indigo-50"
      headerBarClassName="border-indigo-900/50 bg-[#0c1020]/90 text-indigo-100"
      heroOverlayClassName="bg-gradient-to-b from-indigo-950/70 via-slate-950/45 to-[#0c1020]/92"
      eyebrowClassName="text-indigo-300"
      titleClassName="text-white"
      descriptionClassName="text-indigo-100/90"
      sectionClassName="border-indigo-900/40 bg-[#0f1428] text-indigo-100"
    />
  )
}
