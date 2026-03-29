"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Play, User } from "lucide-react"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
  deceasedName?: string
  memorialHeadline?: string
  memorialTagline?: string
  memorialQuote?: string
  eventSubtitle?: string
  memorialLifeDates?: string
  primaryServiceDateLabel?: string
}

const DEFAULT_MEMORIAL_HEADLINE = "In Loving Memory"

function memorialPreviewHeroTopLine(eventSubtitle: string | undefined, memorialHeadline: string | undefined): string {
  const sub = (eventSubtitle ?? "").trim()
  if (sub) return sub
  const head = (memorialHeadline ?? "").trim()
  if (!head || head.toLowerCase() === DEFAULT_MEMORIAL_HEADLINE.toLowerCase()) return ""
  return head
}

/**
 * Marketing preview for tpl-funeral (Memorial Service).
 * Live watch uses the `memorialService` skin in watch-event-content.
 */
export function FuneralTemplate({
  eventTitle = "Celebration of Life",
  eventDescription = "Join us virtually to honor and remember a beloved life.",
  deceasedName = "Robert James Anderson",
  memorialHeadline = "",
  memorialTagline = "A life beautifully lived deserves to be beautifully remembered",
  memorialQuote = "Those we love don't go away — they walk beside us every day. Unseen, unheard, but always near.",
  eventSubtitle,
  memorialLifeDates,
  primaryServiceDateLabel,
}: TemplateProps) {
  const heroTopLine = memorialPreviewHeroTopLine(eventSubtitle, memorialHeadline)

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f5f0] font-memorial-serif text-[#2c3e50]">
      <div className="border-b border-[#c9a961]/25 bg-[#2c3e50] px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm" className="gap-2 text-white/90 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-memorial-display text-xs uppercase tracking-[0.2em] text-[#c9a961] md:text-sm">
            Memorial Service
          </span>
          <span className="w-16" />
        </div>
      </div>

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-16">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#7e8ba3]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <div className="relative mx-auto mb-8 w-[200px] md:w-[240px]">
            <div className="memorial-photo-glow rounded-full border-[5px] border-[#c9a961] bg-white p-2 shadow-xl">
              <div className="flex aspect-square items-center justify-center rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-500">
                <User className="h-[42%] w-[42%] max-h-[6.5rem] max-w-[6.5rem] stroke-[1.25]" aria-hidden />
              </div>
            </div>
            <span
              className="memorial-candle-flicker pointer-events-none absolute -bottom-1 left-1/2 z-[2] -translate-x-1/2 text-2xl"
              aria-hidden
            >
              🕯️
            </span>
          </div>

          {heroTopLine ? (
            <p className="font-memorial-display text-xs uppercase tracking-[0.25em] text-white/95 md:text-sm md:tracking-[0.35em]">
              {heroTopLine}
            </p>
          ) : null}
          <h1
            className={`font-memorial-display text-3xl font-bold leading-tight text-[#c9a961] [text-shadow:2px_2px_10px_rgba(0,0,0,0.4)] md:text-5xl ${heroTopLine ? "mt-4" : "mt-2"}`}
          >
            {deceasedName}
          </h1>
          {memorialLifeDates ? (
            <p className="mt-4 font-memorial-sans text-sm font-light tracking-[0.18em] text-white/95 md:text-base md:tracking-[0.22em]">
              {memorialLifeDates}
            </p>
          ) : null}
          <p className="mt-2 font-memorial-sans text-sm text-white/85 md:text-base">{eventTitle}</p>

          {memorialTagline ? (
            <p className="mx-auto mt-6 max-w-lg text-base italic text-white/90 md:text-lg">{memorialTagline}</p>
          ) : null}

          {memorialQuote ? (
            <div className="relative mx-auto mt-8 max-w-lg border-y border-[#c9a961]/45 px-4 py-5 text-sm italic text-white/95 md:text-base">
              <span className="pointer-events-none absolute left-1 top-1 text-3xl text-[#c9a961]/30">&ldquo;</span>
              <p className="relative z-[1] leading-relaxed">{memorialQuote}</p>
            </div>
          ) : null}

          {eventDescription ? (
            <>
              <div className="mx-auto mt-8 h-px w-20 bg-[#c9a961]/70 md:mt-10 md:w-24" aria-hidden />
              <p className="mx-auto mt-6 max-w-xl font-memorial-serif text-base italic leading-relaxed text-white/90 md:mt-8 md:text-lg">
                {eventDescription}
              </p>
            </>
          ) : null}

          {primaryServiceDateLabel ? (
            <div className="mx-auto mt-8 max-w-xl space-y-1.5 text-center md:mt-10">
              <p className="font-memorial-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a961]/95 md:text-xs">
                Service — date &amp; time
              </p>
              <p className="font-memorial-serif text-sm font-medium text-white md:text-base">{primaryServiceDateLabel}</p>
            </div>
          ) : null}

          <Button
            asChild
            className="mt-10 h-auto rounded-full border-2 border-[#c9a961]/90 bg-white/95 px-8 py-3 font-memorial-sans text-sm font-semibold text-[#2c3e50] shadow-md hover:bg-white"
          >
            <a href="#memorial-preview-stream" className="inline-flex items-center gap-2 no-underline">
              <Play className="h-4 w-4 text-[#c9a961]" />
              Watch live stream
            </a>
          </Button>
        </div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[#c9a961] motion-safe:animate-[memorialGentleBounce_2s_ease-in-out_infinite]">
          <ChevronDown className="h-7 w-7" />
        </div>
      </section>

      <section id="memorial-preview-stream" className="scroll-mt-4 bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-memorial-display text-2xl text-[#2c3e50] md:text-3xl">Service details</h2>
          <p className="mt-3 font-memorial-serif text-sm text-[#7f8c8d] md:text-base">
            Date, venue, and order of service appear on the live watch page from your event fields.
          </p>
          <div className="mt-10 aspect-video w-full overflow-hidden rounded-2xl border-[3px] border-[#c9a961]/80 bg-[#2c3e50] shadow-lg">
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-white/90">
              <span className="text-3xl" aria-hidden>
                🕊️
              </span>
              <p className="font-memorial-display text-sm uppercase tracking-widest md:text-base">Live stream</p>
              <p className="font-memorial-serif text-xs text-white/70 md:text-sm">Player embeds here when the event is live</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
