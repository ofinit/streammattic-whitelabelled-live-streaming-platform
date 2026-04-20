"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

const LEGACY_BASE = "/templates/stream-legacy"

export type StreamLegacyHtmlPreviewProps = {
  /** Event template id, e.g. `tpl-stream-voguish-hero` */
  templateId: string
  /** Short label for the chrome bar (matches registry display name) */
  label: string
}

/**
 * Full-fidelity preview: loads the original static HTML/CSS/JS from
 * `public/templates/stream-legacy/<templateId>/index.html` in an iframe so theme
 * styles, jQuery plugins, sliders, and WOW animations behave like the source pack.
 */
export function StreamLegacyHtmlPreview({ templateId, label }: StreamLegacyHtmlPreviewProps) {
  const src = `${LEGACY_BASE}/${templateId}/index.html`

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
        <Link href="/admin/control-center">
          <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <span className="max-w-[min(24rem,55vw)] truncate text-center text-sm font-medium text-white/90">
          {label}
        </span>
        <span className="w-20 shrink-0" aria-hidden />
      </header>
      <iframe
        title={label}
        src={src}
        className="min-h-0 w-full flex-1 border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
        loading="lazy"
      />
    </div>
  )
}
