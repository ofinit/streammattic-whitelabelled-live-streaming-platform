"use client"

import type { CSSProperties, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LiveEvent } from "@/lib/types"
import { Play, ChevronDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { EventGlobalHeaderImage } from "./event-global-header-image"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { WatchPhotographerMarquee } from "./watch-photographer-marquee"

export type MemorialWatchViewProps = {
  event: LiveEvent
  /** Full-width strip above the memorial hero (`header_image_url`). */
  headerImageUrl?: string
  heroBackdropUrl: string
  deceasedName: string
  deceasedPhotoUrl: string
  birthDateLabel: string
  passedDateLabel: string
  memorialHeadline: string
  memorialTagline: string
  memorialQuote: string
  footerVerse: string
  tributeMessage: string
  inLieuOf: string
  eventSubtitle: string
  eventDescription: string
  primaryDateFormatted: string
  showScheduledPageEnabled: boolean
  countdown: { days: number; hours: number; minutes: number; seconds: number }
  allowChat: boolean
  showChat: boolean
  setShowChat: (v: boolean) => void
  renderStreamPlayer: (shellClassName: string) => ReactNode
  renderLiveChatBody: () => ReactNode
  detailsPanel: ReactNode
  streamShellClassName: string
  photoGalleryUrls: string[]
  /** Optional scrolling banner directly under the memorial photo gallery */
  galleryMarqueeMessage?: string
  titleHeroRem: number
  googleTitleFont: string | null
  titleFontColor: string | null
  titleFallbackFontClass: string
  heroTitleFontSizeStyle: (rem: number) => CSSProperties
}

const DEFAULT_MEMORIAL_HEADLINE = "In Loving Memory"

export function memorialHeroTopLine(eventSubtitle: string, memorialHeadline: string): string {
  const sub = eventSubtitle.trim()
  if (sub) return sub
  const head = memorialHeadline.trim()
  if (!head) return ""
  if (head.toLowerCase() === DEFAULT_MEMORIAL_HEADLINE.toLowerCase()) return ""
  return head
}

export function formatMemorialDate(raw: string | undefined): string {
  const s = raw?.trim()
  if (!s) return ""
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export function MemorialServiceWatchView({
  event,
  headerImageUrl,
  heroBackdropUrl,
  deceasedName,
  deceasedPhotoUrl,
  birthDateLabel,
  passedDateLabel,
  memorialHeadline,
  memorialTagline,
  memorialQuote,
  footerVerse,
  tributeMessage,
  inLieuOf,
  eventSubtitle,
  eventDescription,
  primaryDateFormatted,
  showScheduledPageEnabled,
  countdown,
  allowChat,
  showChat,
  setShowChat,
  renderStreamPlayer,
  renderLiveChatBody,
  detailsPanel,
  streamShellClassName,
  photoGalleryUrls,
  galleryMarqueeMessage,
  titleHeroRem,
  googleTitleFont,
  titleFontColor,
  titleFallbackFontClass,
  heroTitleFontSizeStyle,
}: MemorialWatchViewProps) {
  const rays = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        left: `${(i * 9.7 + 3) % 96}%`,
        duration: `${6 + (i % 4)}s`,
        delay: `${(i * 0.4) % 5}s`,
      })),
    [],
  )

  const heroTopLine = memorialHeroTopLine(eventSubtitle, memorialHeadline)

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#f8f5f0] font-memorial-serif text-[#2c3e50]">
      <EventGlobalHeaderImage url={headerImageUrl} />
      <section className="relative flex min-h-[min(100dvh,920px)] items-center justify-center overflow-hidden px-4 py-16 md:py-20">
        {heroBackdropUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroBackdropUrl})` }}
            aria-hidden
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#7e8ba3]"
            aria-hidden
          />
        )}

        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
          {rays.map((r) => (
            <span
              key={r.id}
              className="memorial-light-ray absolute top-0 h-[150px] w-0.5"
              style={{ left: r.left, animationDuration: r.duration, animationDelay: r.delay }}
            />
          ))}
          {["18%", "42%", "68%"].map((top, i) => (
            <span
              key={i}
              className="memorial-dove absolute text-3xl text-white/50 md:text-4xl"
              style={{ top, animationDuration: `${22 + i * 4}s`, animationDelay: `${i * 2.5}s` }}
              aria-hidden
            >
              🕊️
            </span>
          ))}
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center motion-safe:animate-[memorialFadeInUp_1.2s_ease-out] [text-shadow:0_2px_10px_rgba(0,0,0,0.55)]">
          <div className="relative mx-auto mb-8 w-[min(220px,70vw)] md:mb-10 md:w-[280px]">
            <div className="memorial-photo-glow rounded-full border-[5px] border-[#c9a961] bg-white p-2 shadow-[0_10px_40px_rgba(0,0,0,0.35)] md:border-[6px] md:p-2">
              <div className="relative aspect-square overflow-hidden rounded-full bg-gradient-to-br from-zinc-200 to-zinc-400">
                {deceasedPhotoUrl ? (
                  <img src={deceasedPhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-500">
                    <User className="h-[42%] w-[42%] max-h-[7rem] max-w-[7rem] stroke-[1.25]" aria-hidden />
                  </div>
                )}
              </div>
            </div>
            <span
              className="memorial-candle-flicker pointer-events-none absolute -bottom-1 left-1/2 z-[2] -translate-x-1/2 text-4xl leading-none md:text-5xl"
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
            className={cn(
              "font-memorial-display font-bold leading-[1.1] text-[#c9a961] [text-shadow:2px_2px_12px_rgba(0,0,0,0.45)]",
              heroTopLine ? "mt-4" : "mt-2",
              titleFallbackFontClass,
            )}
            style={{
              ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", ui-serif, Georgia, serif` } : {}),
              ...(titleFontColor ? { color: titleFontColor } : {}),
              ...heroTitleFontSizeStyle(titleHeroRem),
            }}
          >
            {deceasedName}
          </h1>

          {(birthDateLabel || passedDateLabel) && (
            <p className="mt-6 font-memorial-sans text-sm font-light tracking-[0.2em] text-white/95 md:text-lg md:tracking-[0.28em]">
              {birthDateLabel}
              {birthDateLabel && passedDateLabel ? (
                <span className="mx-3 text-[#c9a961] md:mx-5">—</span>
              ) : null}
              {passedDateLabel}
            </p>
          )}

          {memorialTagline ? (
            <p className="mx-auto mt-6 max-w-xl font-memorial-serif text-base italic text-white/90 md:text-lg">
              {memorialTagline}
            </p>
          ) : null}

          {memorialQuote ? (
            <div className="relative mx-auto mt-10 max-w-xl border-y border-[#c9a961]/45 px-4 py-6 text-left md:mt-12 md:px-8 md:py-8">
              <span className="pointer-events-none absolute left-2 top-2 font-serif text-4xl text-[#c9a961]/25 md:left-3 md:text-5xl">
                &ldquo;
              </span>
              <p className="relative z-[1] font-memorial-serif text-base italic leading-relaxed text-white/95 md:text-lg md:leading-loose">
                {memorialQuote}
              </p>
              <span className="pointer-events-none absolute bottom-2 right-2 font-serif text-4xl text-[#c9a961]/25 md:right-3 md:text-5xl">
                &rdquo;
              </span>
            </div>
          ) : null}

          {tributeMessage ? (
            <p className="mx-auto mt-8 max-w-2xl font-memorial-serif text-sm leading-relaxed text-white/85 md:text-base">
              {tributeMessage}
            </p>
          ) : null}

          {eventDescription ? (
            <>
              <div className="mx-auto mt-8 h-px w-20 bg-[#c9a961]/70 md:mt-10 md:w-24" aria-hidden />
              <p className="mx-auto mt-6 max-w-xl font-memorial-serif text-base italic leading-relaxed text-white/90 md:mt-8 md:text-lg">
                {eventDescription}
              </p>
            </>
          ) : null}

          <div className="mx-auto mt-8 max-w-xl px-2 md:mt-10">
            {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
              <div>
                <p className="mb-4 font-memorial-display text-sm font-semibold uppercase tracking-[0.12em] text-white/95 md:text-base">
                  Service begins in…
                </p>
                <div className="flex flex-wrap justify-center gap-3 md:gap-5">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="min-w-[72px] rounded-xl border-2 border-[#c9a961]/80 bg-white/95 px-3 py-2.5 shadow-lg md:min-w-[88px] md:px-4 md:py-3"
                    >
                      <p className="font-memorial-display text-xl font-bold tabular-nums text-[#2c3e50] md:text-2xl">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 font-memorial-sans text-[9px] font-semibold uppercase tracking-wider text-[#7f8c8d] md:text-[10px]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : event.scheduledAt && primaryDateFormatted ? (
              <div className="space-y-1.5 text-center">
                <p className="font-memorial-sans text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a961]/95 md:text-xs">
                  Service — date &amp; time
                </p>
                <p className="font-memorial-serif text-sm font-medium text-white md:text-base">{primaryDateFormatted}</p>
              </div>
            ) : (
              <p className="text-center font-memorial-serif text-sm text-white/80 md:text-base">
                Date &amp; time to be announced
              </p>
            )}
          </div>

          <ButtonMemorialScroll />
        </div>

        <button
          type="button"
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[#c9a961] motion-safe:animate-[memorialGentleBounce_2s_ease-in-out_infinite]"
          aria-label="Scroll to live stream"
          onClick={() => document.getElementById("memorial-stream")?.scrollIntoView({ behavior: "smooth" })}
        >
          <ChevronDown className="h-7 w-7 opacity-90" />
        </button>
      </section>

      {inLieuOf ? (
        <section className="relative z-[2] bg-white px-4 pb-16 pt-8 md:pb-24 md:pt-12">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-xl border border-[#c9a961]/30 bg-[#f8f5f0] p-5 text-center md:p-8">
              <h3 className="font-memorial-display text-lg text-[#2c3e50] md:text-xl">In lieu of flowers</h3>
              <p className="mt-2 whitespace-pre-wrap font-memorial-serif text-sm text-[#5a6c7d] md:text-base">
                {inLieuOf}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section
        id="memorial-stream"
        className="scroll-mt-4 border-t border-[#e8e4dc] bg-white px-4 py-16 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 text-center md:mb-10">
            <h2 className="font-memorial-display text-2xl text-black md:text-4xl">Live memorial service</h2>
            {primaryDateFormatted ? (
              <p className="mt-3 font-memorial-serif text-sm font-medium text-black md:text-base">
                {primaryDateFormatted}
              </p>
            ) : (
              <p className="mt-3 font-memorial-serif text-sm text-neutral-600 md:text-base">Date &amp; time to be announced</p>
            )}
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border-2 border-[#c9a961]/45 bg-white px-5 py-2.5 font-memorial-sans text-sm font-medium text-black md:text-base">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_#f44]" />
              Watch Live Stream
            </span>
          </header>

          <div
            className={cn(
              "grid grid-cols-1 gap-8 lg:items-start",
              allowChat ? "lg:grid-cols-3" : "",
            )}
          >
            <div className={cn("space-y-6", allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
              {renderStreamPlayer(streamShellClassName)}
              {eventDescription ? (
                <div className="rounded-2xl border border-[#c9a961]/35 bg-[#f8f5f0] p-6 text-center">
                  <p className="font-memorial-serif text-sm leading-relaxed text-neutral-900 md:text-base">{eventDescription}</p>
                </div>
              ) : null}
            </div>

            {allowChat ? (
              <div
                className={`flex min-h-[420px] flex-col overflow-hidden rounded-[1.75rem] border-[3px] border-[#c9a961] bg-white shadow-xl lg:min-h-[600px] ${
                  showChat ? "flex" : "hidden lg:flex"
                }`}
              >
                {renderLiveChatBody()}
              </div>
            ) : null}
          </div>

          {allowChat ? (
            <div className="mt-6 flex justify-center lg:hidden">
              <button
                type="button"
                className="rounded-full border border-[#c9a961]/45 bg-white px-5 py-2 font-memorial-sans text-sm text-neutral-900 shadow-sm hover:bg-[#f8f5f0]"
                onClick={() => setShowChat(!showChat)}
              >
                {showChat ? "Hide condolences" : "Open condolences"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {photoGalleryUrls.length > 0 ? (
        <section className="relative z-[2] bg-[#ecf0f1] px-4 py-16 md:py-24">
          <div className="mx-auto max-w-6xl">
            <header className="mb-8 text-center md:mb-12">
              <div className="mb-2 text-3xl md:text-4xl" aria-hidden>
                📷
              </div>
              <h2 className="font-memorial-display text-2xl text-[#2c3e50] md:text-4xl">Life in pictures</h2>
              <p className="mt-2 font-memorial-serif text-[#7f8c8d]">Cherished moments and memories</p>
            </header>
            <MemorialPhotoGallery urls={photoGalleryUrls} />
            {galleryMarqueeMessage?.trim() ? (
              <div className="mx-auto mt-8 max-w-4xl px-2">
                <WatchPhotographerMarquee message={galleryMarqueeMessage.trim()} theme="memorial" />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <footer className="relative z-[2] bg-[#2c3e50] px-4 py-16 text-center text-white md:py-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-4xl text-[#c9a961] md:text-5xl" aria-hidden>
            🕊️
          </div>
          <p className="font-memorial-serif text-base leading-relaxed text-white/90 md:text-lg">
            Thank you for joining us in honoring
            <br />
            <span className="font-semibold text-[#c9a961]">{deceasedName}</span>.
          </p>
          {footerVerse ? (
            <div className="mt-8 border-t border-[#c9a961]/30 pt-8">
              <p className="whitespace-pre-wrap font-memorial-serif text-base italic leading-relaxed text-[#c9a961] md:text-lg">
                {footerVerse}
              </p>
            </div>
          ) : null}
        </div>
      </footer>

      <div className="border-t border-[#ecf0f1] bg-[#f8f5f0]">{detailsPanel}</div>
    </div>
  )
}

function ButtonMemorialScroll() {
  return (
    <a
      href="#memorial-stream"
      className="mt-10 inline-flex items-center gap-2 rounded-full border-2 border-[#c9a961]/80 bg-white/95 px-6 py-3 font-memorial-sans text-sm font-semibold text-[#2c3e50] shadow-md transition hover:bg-white md:mt-12 md:px-8 md:text-base"
      onClick={(e) => {
        e.preventDefault()
        document.getElementById("memorial-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }}
    >
      <Play className="h-4 w-4 text-[#c9a961] md:h-5 md:w-5" aria-hidden />
      Watch Live Stream
    </a>
  )
}

function MemorialPhotoGallery({ urls }: { urls: string[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollBy = useCallback((dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const slide = el.querySelector<HTMLElement>("[data-memorial-slide]")
    const step = slide ? slide.offsetWidth + 12 : 280
    const max = el.scrollWidth - el.clientWidth
    let next = el.scrollLeft + dir * step
    if (next < 0) next = max
    if (next > max) next = 0
    el.scrollTo({ left: next, behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : i === 0 ? urls.length - 1 : i - 1))
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : i === urls.length - 1 ? 0 : i + 1))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxIndex, urls.length])

  return (
    <>
      <div className="relative">
        {urls.length > 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border-[#c9a961]/60 bg-white/95 text-[#2c3e50] shadow-md hover:bg-[#f8f5f0]"
              aria-label="Previous photos"
              onClick={() => scrollBy(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border-[#c9a961]/60 bg-white/95 text-[#2c3e50] shadow-md hover:bg-[#f8f5f0]"
              aria-label="Next photos"
              onClick={() => scrollBy(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}
        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {urls.map((u, i) => (
            <button
              key={`${u}-${i}`}
              type="button"
              data-memorial-slide
              className="relative h-56 w-[min(280px,85vw)] shrink-0 snap-center overflow-hidden rounded-xl border-2 border-[#c9a961]/50 bg-zinc-200 shadow-md"
              onClick={() => setLightboxIndex(i)}
            >
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null ? (
        <button
          type="button"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          aria-label="Close gallery"
          onClick={() => setLightboxIndex(null)}
        >
          <img
            src={urls[lightboxIndex]}
            alt=""
            className="max-h-[90vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </button>
      ) : null}
    </>
  )
}
