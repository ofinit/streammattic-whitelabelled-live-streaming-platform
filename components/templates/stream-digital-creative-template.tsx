"use client"

import { StreamLegacyHtmlPreview } from "@/components/templates/stream-legacy-html-preview"

type TemplateProps = {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Original HTML/CSS from General Template 4 (Digital Creative) — full iframe preview. */
export function StreamDigitalCreativeTemplate(_props: TemplateProps) {
  return <StreamLegacyHtmlPreview templateId="tpl-stream-digital-creative" label="Digital Creative" />
}
