"use client"

import type { ReactNode } from "react"
import { ChevronDown, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import "@/styles/wedding-papercut-template.css"

interface WeddingPapercutWatchViewProps {
  globalHeaderImage?: ReactNode
  heroImageUrl: string
  coupleHero: string
  eventSubtitle: string
  eventDescription: string
  primaryDateFormatted: string
  eventDates: Array<{ id: string; label: string; formatted: string }>
  showCountdown: boolean
  countdown: { days: number; hours: number; minutes: number; seconds: number }
  streamPlayer: ReactNode
  liveChat?: ReactNode
  detailsPanel: ReactNode
  allowChat: boolean
  showChat: boolean
  invitationLine: string
  teaserEmbed?: string | null
  gallerySection?: ReactNode
  photographerCredit?: ReactNode
}

const R2_BASE = "https://pub-c5ef5a9c919b4b45bb164fa5de4a9f9d.r2.dev"
const TOP_LINE = `${R2_BASE}/e7b73-top-line.png`
const BOTTOM_LINE = `${R2_BASE}/c1170-bottom-line.png`

function AnimatedTitle({ title }: { title: string }) {
  return (
    <h1 className="papercut-title" aria-label={title}>
      {title.split("").map((char, i) =>
        char === " " ? (
          <span key={`space-${i}`} className="papercut-title-space" aria-hidden />
        ) : (
          <span key={`${char}-${i}`} className="papercut-title-char" style={{ animationDelay: `${i * 0.045}s` }}>
            {char}
          </span>
        ),
      )}
    </h1>
  )
}

export function WeddingPapercutWatchView({
  globalHeaderImage,
  heroImageUrl,
  coupleHero,
  eventSubtitle,
  eventDescription,
  primaryDateFormatted,
  eventDates,
  showCountdown,
  countdown,
  streamPlayer,
  liveChat,
  detailsPanel,
  allowChat,
  showChat,
  invitationLine,
  teaserEmbed,
  gallerySection,
  photographerCredit,
}: WeddingPapercutWatchViewProps) {
  const scrollToStream = () =>
    document.getElementById("papercut-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
  const subtitle = eventSubtitle || "We're Getting Married!"
  const ticker =
    primaryDateFormatted || eventDates.length > 0
      ? [
          primaryDateFormatted ? `Main event · ${primaryDateFormatted}` : "",
          ...eventDates.map((d) => `${(d.label || "Session").trim()} · ${d.formatted}`),
        ]
          .filter(Boolean)
          .join(" · ")
      : eventDescription || "Live Streaming Starts at 12:00 am"

  return (
    <div className="wedding-papercut-skin">
      {globalHeaderImage}

      <section
        className={heroImageUrl ? "papercut-hero" : "papercut-hero papercut-hero-fallback"}
        style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } : undefined}
      >
        <div className="papercut-kenburns" aria-hidden />
        <div className="papercut-hero-content">
          <img src={TOP_LINE} alt="" className="papercut-ornament" />
          <AnimatedTitle title={coupleHero} />
          <p className="papercut-subtitle">{subtitle}</p>

          {showCountdown ? (
            <div className="mx-auto mt-7 grid max-w-lg grid-cols-4 gap-2 px-4 sm:gap-3">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Mins", value: countdown.minutes },
                { label: "Secs", value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/90 px-2 py-3 text-[#a93673] shadow-lg backdrop-blur">
                  <p className="font-serif text-2xl font-bold tabular-nums">{String(item.value).padStart(2, "0")}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{item.label}</p>
                </div>
              ))}
            </div>
          ) : (
            <button type="button" className="papercut-date-pill" onClick={scrollToStream}>
              {primaryDateFormatted || "Watch Live"}
            </button>
          )}

          <img src={BOTTOM_LINE} alt="" className="papercut-ornament bottom mt-8" />
        </div>
        <button type="button" className="papercut-scroll" onClick={scrollToStream} aria-label="Scroll to live stream">
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      <section className="papercut-section alt">
        <div className="papercut-container">
          <div className="papercut-heading">
            <h2>{eventSubtitle || "Auspicious Time"}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-white/90">
              {invitationLine || eventDescription}
            </p>
          </div>
        </div>
      </section>

      <div className="papercut-marquee">
        <div className="papercut-marquee-track">
          <span className="px-10">{ticker}</span>
          <span className="px-10" aria-hidden>
            {ticker}
          </span>
        </div>
      </div>

      <section id="papercut-stream" className="papercut-section">
        <div className="papercut-container">
          <div className="papercut-heading">
            <h2>Watch Live</h2>
            <div className="after" />
          </div>

          <div className={cn("grid grid-cols-1 gap-8 lg:items-stretch", allowChat ? "lg:grid-cols-3" : "")}>
            <div className={cn("flex min-h-0 flex-col", allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
              <div className="papercut-card papercut-stream-frame">
                {streamPlayer}
                {invitationLine ? <p className="papercut-invitation">{invitationLine}</p> : null}
              </div>
            </div>

            {allowChat ? (
              <div className={cn("min-h-[460px] flex-col lg:min-h-[620px]", showChat ? "flex" : "hidden lg:flex")}>
                <div className="papercut-card flex min-h-0 flex-1 flex-col overflow-hidden">{liveChat}</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {teaserEmbed ? (
        <section className="papercut-section alt">
          <div className="papercut-container">
            <div className="papercut-heading">
              <h2>Watch Teaser</h2>
              <div className="after" />
            </div>
            <div className="papercut-teaser-frame">
              <iframe
                title="Wedding teaser"
                src={`${teaserEmbed}?rel=0`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      ) : null}

      {gallerySection ? <section className="papercut-gallery-wrap papercut-section">{gallerySection}</section> : null}
      {photographerCredit ? (
        <section className="papercut-credit">
          <span className="papercut-preloader-mark">
            <Heart className="h-8 w-8" fill="currentColor" />
          </span>
          {photographerCredit}
        </section>
      ) : null}

      <footer
        className="papercut-footer"
        style={heroImageUrl ? { ["--papercut-footer-image" as string]: `url(${heroImageUrl})` } : undefined}
      >
        <h2>Thank You</h2>
        <p className="mt-4 text-sm uppercase tracking-[0.32em] text-white/80">For joining the celebration</p>
      </footer>

      <div className="papercut-container py-10">{detailsPanel}</div>
    </div>
  )
}
