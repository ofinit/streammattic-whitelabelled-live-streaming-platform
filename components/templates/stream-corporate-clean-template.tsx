"use client"

import { StreamLegacyHtmlPreview } from "@/components/templates/stream-legacy-html-preview"

type TemplateProps = {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/** Original HTML/CSS from Corporate Template 3 — full iframe preview. */
export function StreamCorporateCleanTemplate(_props: TemplateProps) {
  return <StreamLegacyHtmlPreview templateId="tpl-stream-corporate-clean" label="Clean Corporate Live" />
}
