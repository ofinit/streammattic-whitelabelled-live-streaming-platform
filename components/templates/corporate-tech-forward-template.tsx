"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/**
 * Marketing preview for tpl-corporate-tech-forward (Tech Forward Summit).
 * Full watch UX: `CorporateTechForwardWatchView` + `watch-event-content` skin.
 */
export function CorporateTechForwardTemplate({
  eventTitle = "TechForward 2026",
  eventDescription = "Annual Innovation Summit — live keynotes, panels, and Q&A.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-corporate-tech-forward") || ""

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] font-sans text-white">
      <div className="corp-tech-grid-bg pointer-events-none fixed inset-0 z-0 motion-reduce:hidden" aria-hidden />
      <div
        className="corp-tech-orb -right-24 -top-24 h-[320px] w-[320px] bg-[rgba(0,102,255,0.12)] motion-reduce:hidden"
        aria-hidden
      />

      <div className="border-b border-white/10 bg-black/80 px-4 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm" className="gap-2 text-zinc-300 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-bold">
              TF
            </div>
            <span className="font-corporate-tech-display text-sm font-semibold tracking-tight">Template preview</span>
          </div>
          <span className="w-16" />
        </div>
      </div>

      <section className="relative flex min-h-[82vh] flex-col items-center justify-center overflow-hidden px-4 pt-12">
        <div className="corp-tech-scan-line z-[2] motion-reduce:hidden" aria-hidden />
        {hero ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.2]"
            style={{ backgroundImage: `url(${hero})` }}
            aria-hidden
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/90 to-[#0a0a0a]" aria-hidden />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 corp-tech-live-dot" />
            Innovation summit skin
          </div>
          <h1 className="font-corporate-tech-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            <span className="corp-tech-glitch uppercase" data-text="THE FUTURE">
              THE FUTURE
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">IS NOW</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">{eventDescription}</p>
          <p className="mt-4 font-corporate-tech-display text-xl text-sky-200/90">{eventTitle}</p>
          <Button
            type="button"
            className="corp-tech-pulse-ring mt-10 h-auto cursor-pointer rounded-xl border-0 bg-blue-600 px-8 py-4 text-base font-semibold hover:bg-blue-500 hover:underline hover:decoration-white/90 hover:underline-offset-4"
          >
            <span className="relative z-10 inline-flex items-center gap-2">
              <Play className="h-5 w-5" />
              Watch Live Stream
            </span>
          </Button>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-14">
        <div className="mx-auto max-w-3xl text-center text-sm text-zinc-500">
          <p>
            On the public watch page: animated grid, floating orbs, data streams, scan line, glitch headline, glass
            preview card, neon stream shell, blue chat chrome, and details panel — driven by company fields + event
            schedule.
          </p>
        </div>
      </section>
    </div>
  )
}
