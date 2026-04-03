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
 * Marketing preview for tpl-wedding-midnight (Midnight Elegance).
 * Live watch UX is implemented in watch-event-content (weddingMidnight skin).
 */
export function WeddingMidnightTemplate({
  eventTitle = "Alexander & Victoria",
  eventDescription = "A digital wedding experience — join us live for the ceremony and celebration.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-midnight") || ""

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] font-midnight-sans text-zinc-100">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212, 175, 55, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 175, 55, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div className="border-b border-amber-500/20 bg-black/80 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/events">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 font-midnight-sans text-xs font-semibold uppercase tracking-widest text-amber-200/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-midnight-display text-lg tracking-wide text-amber-100">Midnight Elegance</span>
          <span className="w-16" />
        </div>
      </div>

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-16">
        {hero ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${hero})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-[#0a0a0a]" />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(212,175,55,0.12)_0%,transparent_55%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="midnight-typing-caret font-midnight-sans text-xs font-semibold uppercase tracking-[0.35em] text-amber-500/80">
            Digital wedding experience
          </p>
          <h1 className="mt-6 text-5xl font-normal leading-[1.05] md:text-7xl">
            {eventTitle.includes("&") ? (
              <>
                <span className="midnight-gold-shimmer-text midnight-name-glitch inline-block font-midnight-display">
                  {eventTitle.split("&")[0]?.trim()}
                </span>
                <span className="midnight-name-glitch mx-2 inline-block font-midnight-display text-zinc-400">&</span>
                <span className="midnight-gold-shimmer-text midnight-name-glitch inline-block font-midnight-display">
                  {eventTitle.split("&")[1]?.trim()}
                </span>
              </>
            ) : (
              <span className="midnight-gold-shimmer-text midnight-name-glitch font-midnight-display">{eventTitle}</span>
            )}
          </h1>
          <div className="mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-amber-500/80 to-transparent" />
          <p className="mx-auto mt-8 max-w-xl font-midnight-sans text-sm font-medium leading-relaxed text-zinc-400">
            {eventDescription}
          </p>
          <Button className="mt-10 gap-2 rounded-none border border-amber-500/50 bg-black/60 px-8 py-6 font-midnight-sans text-sm font-semibold uppercase tracking-[0.2em] text-amber-200 shadow-[0_0_24px_rgba(212,175,55,0.2)] hover:bg-amber-500/10">
            <Play className="h-5 w-5" />
            Watch Live Stream
          </Button>
        </div>
      </section>

      <section className="border-t border-amber-500/15 bg-zinc-950/80 px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="midnight-gold-shimmer-text midnight-name-glitch font-midnight-display text-3xl md:text-4xl">
            Broadcast interface
          </h2>
          <p className="mx-auto mt-4 font-midnight-sans text-sm font-medium text-zinc-500">
            On the live event page, guests get the full Midnight Elegance layout: gold-accent hero, dark stream shell,
            mono-styled chat, schedule, and wedding fields in the details panel.
          </p>
        </div>
      </section>
    </div>
  )
}
