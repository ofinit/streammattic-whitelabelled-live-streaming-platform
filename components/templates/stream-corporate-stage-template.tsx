"use client"

import { StreamMarketingPreview } from "@/components/templates/stream-marketing-preview"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Marketing preview for tpl-stream-corporate-stage (conference / keynote stage). */
export function StreamCorporateStageTemplate({
  eventTitle = "Innovation Summit 2026",
  eventDescription = "Keynotes, panels, and live Q&A with industry leaders — join from anywhere.",
  heroImageUrl,
}: TemplateProps) {
  return (
    <StreamMarketingPreview
      templateId="tpl-stream-corporate-stage"
      brandLabel="Conference Stage"
      eyebrow="Annual summit"
      eventTitle={eventTitle}
      eventDescription={eventDescription}
      heroImageUrl={heroImageUrl}
      shellClassName="bg-slate-950 text-slate-50"
      headerBarClassName="border-blue-900/50 bg-slate-950/90 text-blue-100"
      heroOverlayClassName="bg-gradient-to-b from-slate-950/75 via-blue-950/40 to-slate-950/90"
      eyebrowClassName="text-blue-300"
      titleClassName="text-white"
      descriptionClassName="text-slate-200"
      sectionClassName="border-slate-800 bg-slate-900 text-slate-200"
    />
  )
}
