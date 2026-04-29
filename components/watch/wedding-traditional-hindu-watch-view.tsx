"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef } from "react"
import { ChevronDown } from "lucide-react"
import type { LiveEvent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { heroTitleFontSizeStyle, titleFallbackFontClass } from "@/lib/event-title-typography"
import { EventGlobalHeaderImage } from "./event-global-header-image"

/** Must match `--hindu-garland-tile` / `::before` `background-size` in `app/globals.css` */
const HINDU_GARLAND_TILE_PX = 30
/** Must match `--hindu-garland-tassel-reserve` / `::before` `bottom` in `app/globals.css` */
const HINDU_GARLAND_TASSEL_RESERVE_PX = 22

/** Strand height so drawable height is a whole number of tiles (no partial repeat above tassel). */
function snapHinduStrandHeight(desiredPx: number, maxPx = 150): number {
  const capped = Math.min(Math.max(desiredPx, HINDU_GARLAND_TASSEL_RESERVE_PX + HINDU_GARLAND_TILE_PX), maxPx)
  const drawable = capped - HINDU_GARLAND_TASSEL_RESERVE_PX
  const tiles = Math.max(1, Math.floor(drawable / HINDU_GARLAND_TILE_PX))
  return HINDU_GARLAND_TASSEL_RESERVE_PX + tiles * HINDU_GARLAND_TILE_PX
}

export type HinduStreamDateRow = {
  id: string
  label: string
  scheduledAt: string
  timezone: string
  sortOrder: number
}

export type WeddingTraditionalHinduWatchViewProps = {
  event: LiveEvent
  /** Full-width strip above the hero (`header_image_url`). */
  headerImageUrl?: string
  watchTemplateId: string
  coupleHero: string
  coupleParts: string[] | null
  weddingHeroDescription: string
  eventSubtitle: string
  customQuote: string
  primaryDateFormatted: string
  eventDates: HinduStreamDateRow[]
  formatExtraDate: (d: HinduStreamDateRow) => string
  showScheduledPageEnabled: boolean
  countdown: { days: number; hours: number; minutes: number; seconds: number }
  allowChat: boolean
  showChat: boolean
  renderStreamPlayer: (shellClassName: string) => ReactNode
  renderLiveChatBody: () => ReactNode
  detailsPanel: ReactNode
  streamShellClassName: string
  heroBackdropUrl: string
  titleHeroRem: number
  googleTitleFont: string | null
  titleFontColor: string | null
}

function useRevealOnScroll() {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = root.querySelectorAll<HTMLElement>("[data-hindu-reveal]")
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("hindu-wedding-reveal--visible")
        })
      },
      /* 0.12 was too strict with overflow/clipping in the hero; any visible pixel is enough */
      { threshold: 0 },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
  return rootRef
}

export function WeddingTraditionalHinduWatchView({
  event,
  headerImageUrl,
  watchTemplateId,
  coupleHero,
  coupleParts,
  weddingHeroDescription,
  eventSubtitle,
  customQuote,
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
  heroBackdropUrl,
  titleHeroRem,
  googleTitleFont,
  titleFontColor,
}: WeddingTraditionalHinduWatchViewProps) {
  const rootRef = useRevealOnScroll()

  const diyas = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 92 + 4}%`,
        top: `${Math.random() * 88 + 4}%`,
        duration: `${Math.random() * 4 + 12}s`,
        delay: `${Math.random() * 5}s`,
      })),
    [],
  )

  const petals = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: `${Math.random() * 4 + 10}s`,
        delay: `${Math.random() * 10}s`,
      })),
    [],
  )

  const scrollToStream = () => {
    document.getElementById("hindu-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const heroTitleStyle = {
    ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
    ...(titleFontColor ? { color: titleFontColor } : {}),
    ...heroTitleFontSizeStyle(titleHeroRem),
  }

  const subtitleLine = eventSubtitle.trim() || "Shubh Vivah"

  return (
    <div
      ref={rootRef}
      className="relative min-h-screen overflow-x-hidden bg-[#FFF8DC] font-hindu-wedding-serif text-[#5c0a0a]"
    >
      <EventGlobalHeaderImage url={headerImageUrl} />
      <svg
        className="pointer-events-none fixed -right-[200px] -top-[200px] z-0 h-[600px] w-[600px] animate-[hinduRotateMandala_60s_linear_infinite] opacity-[0.06] motion-reduce:animate-none"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <circle cx="100" cy="100" r="90" fill="none" stroke="#8B0000" strokeWidth="0.5" opacity="0.35" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#FFD700" strokeWidth="0.5" opacity="0.35" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="#FF8C00" strokeWidth="0.5" opacity="0.35" />
      </svg>

      <div
        className="pointer-events-none fixed bottom-20 z-0 text-8xl opacity-[0.09] motion-reduce:hidden motion-reduce:opacity-0"
        aria-hidden
      >
        <span className="inline-block animate-[hinduElephantWalk_32s_linear_infinite]">🐘</span>
      </div>

      <section className="relative z-10 flex min-h-[85vh] flex-col overflow-x-hidden bg-gradient-to-b from-orange-50/90 to-[#FFF8DC] pb-20">
        {heroBackdropUrl ? (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-35"
            style={{ backgroundImage: `url(${heroBackdropUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-orange-50 to-[#FFF8DC]" aria-hidden />
        )}
        {/* Hero-only: fixed overlays would cover the stream player; keep animations inside this section */}
        <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden motion-reduce:hidden" aria-hidden>
          {diyas.map((d) => (
            <div
              key={d.id}
              className="hindu-wedding-diya absolute z-[6] text-[40px] leading-none"
              style={{ left: d.left, top: d.top, animationDuration: d.duration, animationDelay: d.delay }}
            >
              🪔
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 z-[4] overflow-hidden motion-reduce:hidden" aria-hidden>
          {petals.map((p) => (
            <div
              key={p.id}
              className="hindu-wedding-petal absolute z-[5] text-[20px]"
              style={{ left: p.left, animationDuration: p.duration, animationDelay: p.delay }}
            >
              🌼
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 w-full">
          <div className="relative bg-gradient-to-b from-[#FFE4B5] to-[#FFF8DC]">
            <div className="relative h-[90px] sm:h-[95px]">
              <div className="hindu-wedding-scallop absolute left-0 right-0 top-0 h-[60px]" aria-hidden />
              <div className="hindu-wedding-marigold-chain absolute left-0 right-0 top-[50px] h-10" aria-hidden />
            </div>
          </div>
          <div className="relative px-4 sm:px-5">
            <div className="mx-auto flex h-[200px] max-w-6xl justify-around px-2 sm:h-[220px] sm:px-5">
              {[
                120, 90, 140, 80, 160, 100, 130, 85, 150, 95, 135, 110,
              ].map((h, i) => (
                <div
                  key={i}
                  className="hindu-wedding-string flex w-6 min-w-[1.5rem] flex-col items-center sm:w-7"
                  style={{
                    height: `${snapHinduStrandHeight(h)}px`,
                    animationDelay: `${(i % 3) * 0.35}s`,
                  }}
                >
                  <span className="hindu-wedding-tassel mt-auto" aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-30 mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 pb-8 pt-[210px] text-center [text-shadow:0_2px_8px_rgba(0,0,0,0.25)] sm:pt-[230px]">
          <div data-hindu-reveal className="hindu-wedding-reveal hindu-wedding-reveal--visible mb-6">
            <span className="inline-block text-6xl text-amber-600 drop-shadow-[0_0_24px_rgba(255,215,0,0.55)] motion-reduce:animate-none md:text-7xl">
              ॐ
            </span>
          </div>

          <div data-hindu-reveal className="hindu-wedding-reveal hindu-wedding-reveal--visible mb-4" style={{ transitionDelay: "80ms" }}>
            <span className="font-hindu-wedding-display text-lg tracking-[0.35em] text-orange-600 uppercase">
              {subtitleLine}
            </span>
          </div>

          <h1
            data-hindu-reveal
            className={cn(
              "hindu-wedding-reveal hindu-wedding-reveal--visible mb-4 font-hindu-wedding-display font-semibold leading-[1.08] text-red-900",
              titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
            )}
            style={{ ...heroTitleStyle, transitionDelay: "140ms" }}
          >
            {coupleParts && coupleParts.length === 2 ? (
              <>
                {coupleParts[0]}{" "}
                <span className="text-amber-600">&</span> {coupleParts[1]}
              </>
            ) : (
              coupleHero
            )}
          </h1>

          <div
            data-hindu-reveal
            className="hindu-wedding-reveal hindu-wedding-reveal--visible mb-6 flex items-center justify-center gap-4"
            style={{ transitionDelay: "200ms" }}
          >
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-orange-500 to-transparent sm:w-32" />
            <span className="animate-[hinduLotus_6s_ease-in-out_infinite] text-3xl motion-reduce:animate-none">
              🪷
            </span>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-orange-500 to-transparent sm:w-32" />
          </div>

          {customQuote ? (
            <div
              data-hindu-reveal
              className="hindu-wedding-reveal hindu-wedding-reveal--visible mx-auto mb-6 max-w-2xl"
              style={{ transitionDelay: "260ms" }}
            >
              <p className="font-hindu-wedding-display text-lg italic leading-relaxed text-zinc-700 md:text-xl">
                &ldquo;{customQuote}&rdquo;
              </p>
            </div>
          ) : null}

          {weddingHeroDescription ? (
            <div
              data-hindu-reveal
              className="hindu-wedding-reveal hindu-wedding-reveal--visible mx-auto mb-8 max-w-2xl"
              style={{ transitionDelay: "300ms" }}
            >
              <p className="text-lg leading-relaxed text-zinc-700 md:text-xl">{weddingHeroDescription}</p>
            </div>
          ) : null}

          <div
            data-hindu-reveal
            className="hindu-wedding-reveal hindu-wedding-reveal--visible mx-auto mb-2 inline-block w-full max-w-lg rounded-3xl border-[3px] border-amber-400 bg-[rgba(255,248,220,0.95)] p-6 shadow-[0_15px_35px_rgba(139,0,0,0.12),inset_0_0_30px_rgba(255,215,0,0.08)] backdrop-blur-md md:p-8"
            style={{ transitionDelay: "320ms" }}
          >
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="animate-[hinduPeacock_5s_ease-in-out_infinite] text-3xl motion-reduce:animate-none">
                🦚
              </span>
              <span className="font-hindu-wedding-display text-xl font-bold text-red-900 md:text-2xl">
                Event Details
              </span>
              <span className="animate-[hinduPeacock_5s_ease-in-out_infinite] text-3xl motion-reduce:animate-none">
                🦚
              </span>
            </div>
            {primaryDateFormatted ? (
              <p className="mb-6 text-center text-base font-medium text-orange-800 md:text-lg">{primaryDateFormatted}</p>
            ) : (
              <p className="mb-6 text-center text-sm text-zinc-600">Date &amp; time to be announced</p>
            )}
            {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
              <div className="grid grid-cols-2 gap-3 border-t-2 border-amber-300/80 pt-4 sm:grid-cols-4 sm:gap-4">
                {(
                  [
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="text-center">
                    <p className="font-hindu-wedding-display text-2xl font-bold tabular-nums text-red-900 md:text-3xl">
                      {String(item.value).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div data-hindu-reveal className="hindu-wedding-reveal hindu-wedding-reveal--visible mt-10" style={{ transitionDelay: "400ms" }}>
            <Button asChild className="h-auto gap-2 rounded-full bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 px-10 py-4 text-base font-bold text-white shadow-xl hover:opacity-95">
              <a
                href="#hindu-stream"
                className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline hover:underline hover:underline-offset-4"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToStream()
                }}
              >
                <span className="text-2xl" aria-hidden>
                  🪔
                </span>
                Watch live stream
              </a>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 text-orange-500/70">
          <ChevronDown className="h-7 w-7 animate-bounce" />
        </div>
      </section>

      <div className="hindu-wedding-bangle relative z-[1]" aria-hidden />

      <section
        id="hindu-stream"
        className="relative z-[1] scroll-mt-4 bg-gradient-to-b from-orange-50/95 to-red-50/90 px-4 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="animate-[hinduBell_4s_ease-in-out_infinite] text-3xl motion-reduce:animate-none">
                🔔
              </span>
              <h2 className="font-hindu-wedding-display text-3xl font-bold text-red-900 md:text-4xl">Watch Live Stream</h2>
              <span className="animate-[hinduBell_4s_ease-in-out_infinite] text-3xl motion-reduce:animate-none">
                🔔
              </span>
            </div>
            {(event.scheduledAt || eventDates.length > 0) && (
              <ul className="mx-auto mb-6 flex max-w-2xl list-none flex-col items-center gap-2 text-base font-medium text-zinc-700 md:text-lg">
                {event.scheduledAt && primaryDateFormatted ? (
                  <li>
                    Main event · {primaryDateFormatted}
                  </li>
                ) : null}
                {eventDates.map((d) => (
                  <li key={d.id}>
                    {(d.label || "Session").trim()} · {formatExtraDate(d)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-8 lg:items-start",
              allowChat ? "lg:grid-cols-3" : "",
            )}
          >
            <div className={cn("space-y-6", allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
              {renderStreamPlayer(streamShellClassName)}
              {weddingHeroDescription ? (
                <div className="rounded-2xl border border-amber-300/80 bg-[rgba(255,248,220,0.92)] p-6 text-center shadow-md backdrop-blur-sm">
                  <p className="text-sm leading-relaxed text-zinc-800 md:text-base">{weddingHeroDescription}</p>
                </div>
              ) : null}
            </div>

            {allowChat ? (
              <div
                className={cn(
                  "flex min-h-[420px] flex-col overflow-hidden rounded-3xl border-2 border-amber-400/90 bg-[#FFF8DC]/95 shadow-[0_8px_32px_rgba(185,28,28,0.12)] backdrop-blur-sm lg:min-h-[600px]",
                  showChat ? "flex" : "hidden lg:flex",
                )}
              >
                {renderLiveChatBody()}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="hindu-wedding-bangle relative z-[1]" aria-hidden />

      <div className="relative z-[1] bg-[#FFF8DC]">{detailsPanel}</div>
    </div>
  )
}
