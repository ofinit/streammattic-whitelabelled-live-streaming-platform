"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { ChevronDown, Play, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/styles/wedding-south-indian-arch-template.css"

interface WeddingSouthIndianArchWatchViewProps {
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

function ArchLotusFlower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      <path d="M50,15 C45,30 35,40 30,55 C40,55 45,45 50,25 C55,45 60,55 70,55 C65,40 55,30 50,15 Z" />
      <path d="M50,32 C40,45 28,52 20,68 C32,68 40,58 46,45 C43,58 40,68 50,78 C60,68 57,58 54,45 C60,58 68,68 80,68 C72,52 60,45 50,32 Z" opacity="0.85" />
      <path d="M50,50 C44,60 32,70 12,78 C28,78 38,70 44,60 C40,72 38,82 50,88 C62,82 60,72 56,60 C62,70 72,78 88,78 C68,70 56,60 50,50 Z" opacity="0.7" />
      <path d="M25,80 C35,88 65,88 75,80 C60,82 40,82 25,80 Z" fill="#2d5f2d" />
    </svg>
  )
}

function ArchGarlandAccent() {
  return (
    <svg viewBox="0 0 400 60" className="w-full h-full animate-pulse" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10,0 Q30,45 70,35 T130,25 T190,15" stroke="#d4af37" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M390,0 Q370,45 330,35 T270,25 T210,15" stroke="#d4af37" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="20" cy="18" r="6" fill="#ff9900" />
      <circle cx="20" cy="18" r="3" fill="#ffcc00" />
      <circle cx="45" cy="32" r="7" fill="#ff6600" />
      <circle cx="45" cy="32" r="4" fill="#ffcc00" />
      <circle cx="75" cy="34" r="6" fill="#ff9900" />
      <circle cx="105" cy="28" r="7" fill="#ff6600" />
      <circle cx="135" cy="23" r="6" fill="#ff9900" />
      <circle cx="165" cy="17" r="6" fill="#ff6600" />
      <circle cx="380" cy="18" r="6" fill="#ff9900" />
      <circle cx="380" cy="18" r="3" fill="#ffcc00" />
      <circle cx="355" cy="32" r="7" fill="#ff6600" />
      <circle cx="355" cy="32" r="4" fill="#ffcc00" />
      <circle cx="325" cy="34" r="6" fill="#ff9900" />
      <circle cx="295" cy="28" r="7" fill="#ff6600" />
      <circle cx="265" cy="23" r="6" fill="#ff9900" />
      <circle cx="235" cy="17" r="6" fill="#ff6600" />
      <line x1="200" y1="0" x2="200" y2="40" stroke="#d4af37" strokeWidth="1.5" />
      <circle cx="200" cy="35" r="7" fill="#ff6600" />
      <polygon points="196,40 204,40 200,55" fill="#ffcc00" />
    </svg>
  )
}

export function WeddingSouthIndianArchWatchView({
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
}: WeddingSouthIndianArchWatchViewProps) {
  const scrollToStream = () =>
    document.getElementById("arch-stream-section")?.scrollIntoView({ behavior: "smooth", block: "start" })

  const kicker = eventSubtitle || "Welcome"

  const tickerMessage =
    primaryDateFormatted || eventDates.length > 0
      ? [
          primaryDateFormatted ? `Main ceremony · ${primaryDateFormatted}` : "",
          ...eventDates.map((d) => `${(d.label || "Session").trim()} · ${d.formatted}`),
        ]
          .filter(Boolean)
          .join(" · ")
      : eventDescription || "Live ceremony · Watch from anywhere"

  const initials = useMemo(() => {
    if (coupleParts && coupleParts.length === 2) {
      return {
        first: coupleParts[0].charAt(0).toUpperCase(),
        second: coupleParts[1].charAt(0).toUpperCase(),
      }
    }
    const clean = coupleHero.replace(/weds|&|\+/gi, "").trim().split(/\s+/)
    if (clean.length >= 2) {
      return { first: clean[0].charAt(0).toUpperCase(), second: clean[1].charAt(0).toUpperCase() }
    }
    return { first: "A", second: "S" }
  }, [coupleHero, coupleParts])

  return (
    <div className="wedding-south-indian-arch-skin">
      {globalHeaderImage}

      {/* Decorative Pillars and Arch elements */}
      <div className="arch-frame-top" />
      <div className="arch-pillar-left" />
      <div className="arch-pillar-right" />

      {/* Hero section */}
      <section className="arch-hero">
        {/* Monogram */}
        <div className="arch-monogram">
          <div className="arch-monogram-circle">
            <span className="arch-monogram-text">{initials.first}</span>
            <span className="arch-monogram-amp">&</span>
            <span className="arch-monogram-text">{initials.second}</span>
          </div>
        </div>

        {/* Garland */}
        <div className="arch-couple-frame-wrapper">
          <div className="arch-gold-frame-outer" />
          <div className="arch-gold-frame-inner" />
          <div className="arch-couple-frame">
            <img src={heroImageUrl} alt={coupleHero} />
          </div>
          <div className="arch-garland-accent">
            <ArchGarlandAccent />
          </div>
        </div>

        <div className="text-center z-10 px-4">
          <p className="arch-kicker">{kicker}</p>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4af37] mb-2">To The</p>
          
          <h1 className="arch-title">
            {coupleParts && coupleParts.length === 2 ? (
              <>
                {coupleParts[0]}
                <span className="arch-names-weds font-serif italic text-[#ff9900] font-normal my-2 block">weds</span>
                {coupleParts[1]}
              </>
            ) : (
              coupleHero
            )}
          </h1>

          <div className="arch-badge-party">
            Marriage Party
          </div>

          <div className="arch-divider">
            <span className="arch-divider-line" />
            <Sparkles className="arch-divider-emblem text-[#d4af37]" />
            <span className="arch-divider-line" />
          </div>

          {primaryDateFormatted ? (
            <div className="arch-date-box">
              {primaryDateFormatted}
            </div>
          ) : null}

          {showCountdown ? (
            <div className="arch-countdown-container">
              <p className="arch-countdown-title">The Big Day Is Coming</p>
              <div className="arch-countdown-timer">
                <div className="arch-countdown-item">
                  <span className="arch-countdown-num">{String(countdown.days).padStart(2, "0")}</span>
                  <span className="arch-countdown-label">Days</span>
                </div>
                <span className="arch-countdown-sep">:</span>
                <div className="arch-countdown-item">
                  <span className="arch-countdown-num">{String(countdown.hours).padStart(2, "0")}</span>
                  <span className="arch-countdown-label">Hrs</span>
                </div>
                <span className="arch-countdown-sep">:</span>
                <div className="arch-countdown-item">
                  <span className="arch-countdown-num">{String(countdown.minutes).padStart(2, "0")}</span>
                  <span className="arch-countdown-label">Mins</span>
                </div>
                <span className="arch-countdown-sep">:</span>
                <div className="arch-countdown-item">
                  <span className="arch-countdown-num">{String(countdown.seconds).padStart(2, "0")}</span>
                  <span className="arch-countdown-label">Secs</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <button type="button" className="arch-btn" onClick={scrollToStream}>
              Watch Live Stream
            </button>
          </div>

          <button type="button" className="arch-scroll-down" onClick={scrollToStream} aria-label="Scroll to content">
            <ChevronDown className="w-8 h-8" />
          </button>
        </div>
      </section>

      {/* Marquee ticker message */}
      <div className="arch-marquee">
        <div className="arch-marquee-track">
          <span className="px-8">{tickerMessage} · </span>
          <span className="px-8" aria-hidden>{tickerMessage} · </span>
          <span className="px-8" aria-hidden>{tickerMessage} · </span>
        </div>
      </div>

      {/* Live Stream Section */}
      <section id="arch-stream-section" className="arch-section">
        <div className="arch-container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className={cn("lg:col-span-12", allowChat && showChat && "lg:col-span-8")}>
              <div className="arch-section-heading">
                <h2>Watch Live</h2>
                <p>Welcome! Connect from anywhere and witness our special celebration.</p>
              </div>

              <div className="arch-stream-card">
                <div className="arch-stream-wrapper bg-black">
                  {streamPlayer}
                </div>
                <p className="arch-card-text">{invitationLine}</p>
              </div>
            </div>

            {allowChat && showChat ? (
              <div className="lg:col-span-4 lg:sticky lg:top-4">
                <div className="arch-section-heading text-left lg:mb-4">
                  <h2 className="text-xl">Live Wishes</h2>
                  <p className="text-xs">Send your blessings and congratulations to the couple</p>
                </div>
                <div className="arch-chat-panel h-[480px]">
                  {liveChat}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Details section */}
      <section className="arch-section bg-[#fff0f3]/30">
        <div className="arch-container">
          <div className="mx-auto max-w-4xl">
            {detailsPanel}
          </div>
        </div>
      </section>

      {/* Teaser Section */}
      {teaserEmbed ? (
        <section className="arch-section">
          <div className="arch-container">
            <div className="arch-section-heading">
              <h2>Watch Teaser</h2>
              <p>A quick sneak peek of our beautiful moments</p>
            </div>
            <div className="arch-teaser-frame">
              <iframe
                title="Wedding teaser video"
                src={`${teaserEmbed}?rel=0`}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* Gallery Section */}
      {gallerySection ? (
        <section className="arch-section bg-[#fff0f3]/30">
          <div className="arch-container">
            <div className="arch-gallery-wrap">
              {gallerySection}
            </div>
          </div>
        </section>
      ) : null}

      {/* Photographer credits */}
      {photographerCredit ? (
        <section className="arch-footer py-12 border-t border-amber-500/10">
          <div className="arch-container">
            {photographerCredit}
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="arch-footer">
        <div className="arch-lotuses-footer">
          <ArchLotusFlower className="arch-lotus-flower" />
          <ArchLotusFlower className="arch-lotus-flower arch-lotus-flower-2" />
          <ArchLotusFlower className="arch-lotus-flower arch-lotus-flower-3" />
        </div>

        <div className="relative z-10">
          <h2>Thank You</h2>
          <p>Copyright © All Rights Reserved</p>
        </div>
      </footer>
    </div>
  )
}
