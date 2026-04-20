"use client"

import { StreamLegacyHtmlPreview } from "@/components/templates/stream-legacy-html-preview"

type TemplateProps = {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Original HTML/CSS from Corporate Template 2 — full iframe preview. */
export function StreamCorporateCountdownTemplate(_props: TemplateProps) {
  return <StreamLegacyHtmlPreview templateId="tpl-stream-corporate-countdown" label="Summit Countdown" />
}
