"use client"

import { StreamLegacyHtmlPreview } from "@/components/templates/stream-legacy-html-preview"

type TemplateProps = {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Original HTML/CSS from Wedding Template 04 — full iframe preview. */
export function StreamWeddingFlexTemplate(_props: TemplateProps) {
  return <StreamLegacyHtmlPreview templateId="tpl-stream-wedding-flex" label="Flex Wedding Showcase" />
}
