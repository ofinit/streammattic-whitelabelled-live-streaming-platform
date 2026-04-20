"use client"

import { StreamLegacyHtmlPreview } from "@/components/templates/stream-legacy-html-preview"

type TemplateProps = {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Original HTML/CSS from Wedding Template 03 — full iframe preview. */
export function StreamWeddingFloralHeartTemplate(_props: TemplateProps) {
  return <StreamLegacyHtmlPreview templateId="tpl-stream-wedding-floral-heart" label="Floral Heart Wedding" />
}
