"use client"

import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import "@/styles/wedding-royal-circle-template.css"

interface WeddingRoyalCircleWatchViewProps {
  globalHeaderImage?: ReactNode
  heroImageUrl: string
  coupleHero: string
  coupleParts: string[] | null
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

const ROYAL_PARTICLES = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  left: `${(i * 31) % 100}%`,
  top: `${(i * 23) % 94}%`,
  size: `${7 + (i % 6) * 3}px`,
  duration: `${5 + (i % 8)}s`,
  delay: `${(i % 10) * 0.32}s`,
}))

function AnimatedKicker({ text }: { text: string }) {
  return (
    <p className="royal-kicker" aria-label={text}>
      {text.split("").map((char, i) => (
        <span key={`${char}-${i}`} style={{ animationDelay: `${0.16 + i * 0.045}s` }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </p>
  )
}

export function WeddingRoyalCircleWatchView({
  globalHeaderImage,
  heroImageUrl,
  coupleHero,
  coupleParts,
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
}: WeddingRoyalCircleWatchViewProps) {
  const scrollToStream = () =>
    document.getElementById("royal-circle-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
  const kicker = eventSubtitle || "We're getting married"
  const ticker =
    primaryDateFormatted || eventDates.length > 0
      ? [
          primaryDateFormatted ? `Main event · ${primaryDateFormatted}` : "",
          ...eventDates.map((d) => `${(d.label || "Session").trim()} · ${d.formatted}`),
        ]
          .filter(Boolean)
          .join(" · ")
      : eventDescription || "Join us live for this auspicious occasion"

  return (
    <div className="wedding-royal-circle-skin">
      {globalHeaderImage}

      <section
        className={heroImageUrl ? "royal-hero" : "royal-hero royal-hero-fallback"}
        style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } : undefined}
      >
        <div className="royal-particles" aria-hidden>
          {ROYAL_PARTICLES.map((p) => (
            <span
              key={p.id}
              className="royal-particle"
              style={{
                ["--royal-left" as string]: p.left,
                ["--royal-top" as string]: p.top,
                ["--royal-size" as string]: p.size,
                ["--royal-duration" as string]: p.duration,
                ["--royal-delay" as string]: p.delay,
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="royal-hero-circle">
            <div className="royal-animated-circle" aria-hidden />
            <div className="royal-vector" aria-hidden />
            <div className="royal-circle-core">
              <h1 className="royal-title">
                {coupleParts && coupleParts.length === 2 ? (
                  <>
                    {coupleParts[0]}
                    <br />
                    <span className="amp">&</span>
                    <br />
                    {coupleParts[1]}
                  </>
                ) : (
                  coupleHero
                )}
              </h1>
            </div>
          </div>
          <AnimatedKicker text={kicker} />

          {showCountdown ? (
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-4 gap-2 px-4 sm:gap-3">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Mins", value: countdown.minutes },
                { label: "Secs", value: countdown.seconds },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/90 px-2 py-3 shadow-lg backdrop-blur">
                  <p className="font-serif text-2xl font-bold tabular-nums text-[#7b2234]">
                    {String(item.value).padStart(2, "0")}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7b2234]/60">{item.label}</p>
                </div>
              ))}
            </div>
          ) : primaryDateFormatted || eventDates.length > 0 ? (
            <div className="royal-date">
              {primaryDateFormatted ? <p>{primaryDateFormatted}</p> : null}
              {eventDates.map((d) => (
                <p key={d.id}>
                  {(d.label || "Session").trim()} · {d.formatted}
                </p>
              ))}
            </div>
          ) : null}

          <Button
            type="button"
            className="mt-8 rounded-full bg-white px-8 py-6 text-[#7b2234] shadow-xl hover:bg-white/95"
            onClick={scrollToStream}
          >
            Watch Live Stream
          </Button>
        </div>

        <button type="button" className="royal-scroll" onClick={scrollToStream} aria-label="Scroll to live stream">
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      <div className="royal-marquee">
        <div className="royal-marquee-track">
          <span className="px-10 font-semibold">{ticker}</span>
          <span className="px-10 font-semibold" aria-hidden>
            {ticker}
          </span>
        </div>
      </div>

      <section id="royal-circle-stream" className="royal-section">
        <div className="royal-container">
          <div className="royal-section-heading">
            <h2>Watch Live</h2>
            <p>{eventDescription || "Celebrate with us from anywhere."}</p>
          </div>

          <div className={cn("grid grid-cols-1 gap-8 lg:items-stretch", allowChat ? "lg:grid-cols-3" : "")}>
            <div className={cn("flex min-h-0 flex-col", allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
              <div className="royal-card royal-stream-frame">
                {streamPlayer}
                {invitationLine ? <p className="royal-invitation">{invitationLine}</p> : null}
              </div>
            </div>

            {allowChat ? (
              <div className={cn("min-h-[460px] flex-col lg:min-h-[620px]", showChat ? "flex" : "hidden lg:flex")}>
                <div className="royal-card flex min-h-0 flex-1 flex-col overflow-hidden">{liveChat}</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {teaserEmbed ? (
        <section className="royal-section bg-white/60">
          <div className="royal-container">
            <div className="royal-section-heading">
              <h2>Watch Teaser</h2>
            </div>
            <div className="royal-teaser-frame">
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

      {gallerySection ? <section className="royal-gallery-wrap royal-section">{gallerySection}</section> : null}
      {photographerCredit ? <section className="royal-credit">{photographerCredit}</section> : null}

      <footer
        className="royal-footer"
        style={heroImageUrl ? { ["--royal-footer-image" as string]: `url(${heroImageUrl})` } : undefined}
      >
        <h2>Thank You</h2>
        <p className="mt-4 text-sm uppercase tracking-[0.32em] text-white/80">For joining the celebration</p>
      </footer>

      <div className="royal-container py-10">{detailsPanel}</div>
    </div>
  )
}
