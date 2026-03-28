"use client"

import type { ReactNode } from "react"
import { useMemo, useState, useEffect } from "react"
import type { LiveEvent } from "@/lib/types"
import { Play, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type CorporateStreamDateRow = {
  id: string
  label: string
  scheduledAt: string
  timezone: string
  sortOrder: number
}

export type CorporateTechForwardWatchViewProps = {
  event: LiveEvent
  /** Under the title: event Sub-title first, else template company tagline, else default. */
  heroSubtitle: string
  heroBlurb: string
  heroBackdropUrl: string
  /** Event hero image or template company logo — show backdrop clearly (defaults stay subtle). */
  heroBackdropIsCustom: boolean
  primaryDateFormatted: string
  eventDates: CorporateStreamDateRow[]
  formatExtraDate: (d: CorporateStreamDateRow) => string
  showScheduledPageEnabled: boolean
  countdown: { days: number; hours: number; minutes: number; seconds: number }
  allowChat: boolean
  showChat: boolean
  renderStreamPlayer: (shellClassName: string) => ReactNode
  renderLiveChatBody: () => ReactNode
  detailsPanel: ReactNode
  streamShellClassName: string
  /** Long-form event description below the player (same source as other watch skins: `event.description`). */
  eventDescriptionBelowStream: string
}

const DATA_CHARS = "01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF"

function buildStreamText(rows: number): string {
  let s = ""
  for (let j = 0; j < rows; j++) {
    let line = ""
    for (let k = 0; k < 18; k++) {
      line += DATA_CHARS[Math.floor(Math.random() * DATA_CHARS.length)]!
    }
    s += line + (j < rows - 1 ? "\n" : "")
  }
  return s
}

export function CorporateTechForwardWatchView({
  event,
  heroSubtitle,
  heroBlurb,
  heroBackdropUrl,
  heroBackdropIsCustom,
  primaryDateFormatted,
  eventDates,
  formatExtraDate,
  showScheduledPageEnabled,
  countdown,
  allowChat,
  showChat,
  renderStreamPlayer,
  renderLiveChatBody,
  detailsPanel,
  streamShellClassName,
  eventDescriptionBelowStream,
}: CorporateTechForwardWatchViewProps) {
  const [typedBlurb, setTypedBlurb] = useState("")

  const dataStreams = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      id: i,
      leftPct: Math.random() * 92 + 2,
      durationSec: Math.random() * 5 + 7,
      delaySec: Math.random() * 6,
      text: buildStreamText(16),
    }))
  }, [])

  useEffect(() => {
    if (!heroBlurb) {
      setTypedBlurb("")
      return
    }
    let i = 0
    setTypedBlurb("")
    const t = window.setTimeout(function tick() {
      if (i < heroBlurb.length) {
        setTypedBlurb(heroBlurb.slice(0, i + 1))
        i++
        window.setTimeout(tick, 32)
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [heroBlurb])

  const scrollToStream = () => {
    document.getElementById("corp-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0a0a0a] font-sans text-white">
      <div className="corp-tech-grid-bg pointer-events-none fixed inset-0 z-0 motion-reduce:hidden" aria-hidden />

      <div
        className="corp-tech-orb -right-24 -top-24 h-[400px] w-[400px] bg-[rgba(0,102,255,0.14)] motion-reduce:hidden"
        style={{ animationDelay: "0s" }}
        aria-hidden
      />
      <div
        className="corp-tech-orb -bottom-12 -left-12 h-[300px] w-[300px] bg-[rgba(0,212,170,0.09)] motion-reduce:hidden"
        style={{ animationDelay: "-5s" }}
        aria-hidden
      />
      <div
        className="corp-tech-orb left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 bg-[rgba(255,107,107,0.08)] motion-reduce:hidden"
        style={{ animationDelay: "-10s" }}
        aria-hidden
      />

      <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden motion-reduce:hidden" aria-hidden>
        {dataStreams.map((col) => (
          <div
            key={col.id}
            className="corp-tech-data-stream left-0 top-0 whitespace-pre opacity-80"
            style={{
              left: `${col.leftPct}%`,
              animationDuration: `${col.durationSec}s`,
              animationDelay: `${col.delaySec}s`,
            }}
          >
            {col.text}
          </div>
        ))}
      </div>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-10 md:pt-14">
        <div className="corp-tech-scan-line z-[2] motion-reduce:hidden" aria-hidden />

        {heroBackdropUrl ? (
          <div
            className={cn(
              "absolute inset-0 z-0 bg-cover bg-center bg-no-repeat",
              heroBackdropIsCustom ? "opacity-100" : "opacity-[0.18]",
            )}
            style={{ backgroundImage: `url(${JSON.stringify(heroBackdropUrl)})` }}
            aria-hidden
          />
        ) : null}
        <div
          className={cn(
            "absolute inset-0 z-[1] bg-gradient-to-b to-[#0a0a0a]",
            heroBackdropIsCustom
              ? "from-[#0a0a0a]/55 via-[#0a0a0a]/72"
              : "from-[#0a0a0a]/40 via-[#0a0a0a]/88",
          )}
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div>
              <h1
                className={cn(
                  "font-corporate-tech-display text-balance text-4xl font-bold leading-[1.12] tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl",
                  heroSubtitle ? "mb-4 md:mb-5" : "mb-6",
                )}
              >
                <span className="corp-tech-glitch" data-text={event.title}>
                  {event.title}
                </span>
              </h1>

              {heroSubtitle ? (
                <p className="mb-6 text-sm font-medium leading-snug text-zinc-400 md:text-base">
                  {heroSubtitle}
                </p>
              ) : null}

              <p className="mx-auto mb-2 min-h-[3.5rem] max-w-xl text-lg text-zinc-400 md:text-xl">
                {typedBlurb}
                <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-blue-500 align-[-0.15em] motion-reduce:hidden" />
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="#corp-stream"
                  className={cn(
                    "corp-tech-pulse-ring relative z-10 inline-flex h-auto cursor-pointer items-center justify-center gap-2 rounded-xl border-0 bg-blue-600 px-8 py-4 text-base font-semibold text-white no-underline outline-none transition-colors",
                    "hover:bg-blue-500 hover:underline hover:decoration-white/90 hover:underline-offset-4",
                    "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]",
                  )}
                  onClick={(e) => {
                    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
                    e.preventDefault()
                    scrollToStream()
                  }}
                >
                  <Play className="h-5 w-5 shrink-0" aria-hidden />
                  Watch Live Stream
                </a>
              </div>

              {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
                <div className="mx-auto mt-10 grid max-w-md grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label} className="corp-tech-glass-card rounded-xl px-3 py-3 text-center">
                      <p className="font-corporate-tech-display text-2xl font-bold tabular-nums text-white">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : primaryDateFormatted ? (
                <p className="mx-auto mt-10 max-w-xl text-sm font-medium text-zinc-400">{primaryDateFormatted}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-blue-400/50">
          <ChevronDown className="h-7 w-7 animate-bounce" />
        </div>
      </section>

      <section id="corp-stream" className="relative z-10 scroll-mt-4 border-t border-white/10 px-4 py-16 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            {(event.scheduledAt || eventDates.length > 0) && (
              <ul className="mx-auto mb-8 flex w-full max-w-2xl list-none flex-col items-center gap-3 px-2">
                {event.scheduledAt && primaryDateFormatted ? (
                  <li className="text-center text-xs font-semibold uppercase tracking-widest text-sky-400/95">
                    Main event · {primaryDateFormatted}
                  </li>
                ) : null}
                {eventDates.map((d) => (
                  <li
                    key={d.id}
                    className="text-center text-xs font-semibold uppercase tracking-widest text-sky-400/95"
                  >
                    {(d.label || "Session").trim()} · {formatExtraDate(d)}
                  </li>
                ))}
              </ul>
            )}
            <h2 className="font-corporate-tech-display text-3xl font-bold md:text-4xl">Watch Live Stream</h2>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-8 lg:items-start",
              allowChat ? "lg:grid-cols-3" : "",
            )}
          >
            <div className={cn("space-y-6", allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
              <div className="relative overflow-hidden rounded-2xl">
                {renderStreamPlayer(streamShellClassName)}
                <div
                  className="pointer-events-none absolute inset-0 z-[5] rounded-2xl bg-[linear-gradient(transparent_55%,rgba(0,102,255,0.04)_55%)] bg-[length:100%_3px] opacity-25 motion-reduce:hidden"
                  aria-hidden
                />
              </div>
              {eventDescriptionBelowStream ? (
                <div className="rounded-2xl border border-blue-500/30 bg-white/[0.04] p-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <p className="text-sm font-medium leading-relaxed text-zinc-300 md:text-base">
                    {eventDescriptionBelowStream}
                  </p>
                </div>
              ) : null}
            </div>

            {allowChat ? (
              <div
                className={cn(
                  "flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-blue-500/25 bg-[#0a0a0a]/95 shadow-[0_0_40px_rgba(0,102,255,0.08)] backdrop-blur-md lg:min-h-[560px]",
                  showChat ? "flex" : "hidden lg:flex",
                )}
              >
                {renderLiveChatBody()}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div id="corp-details" className="relative z-10 border-t border-white/10">
        {detailsPanel}
      </div>
    </div>
  )
}
