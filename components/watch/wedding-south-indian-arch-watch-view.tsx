"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { ChevronDown, Sparkles, Heart } from "lucide-react"
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

function GoldVinesSVG() {
  return (
    <svg viewBox="0 0 60 600" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30,600 C25,500 35,400 28,300 C22,200 32,100 28,0" stroke="#d4af37" strokeWidth="1.5" />
      <path d="M30,550 C15,540 10,530 18,525 C25,520 30,535 30,550 Z" fill="#d4af37" />
      <path d="M30,520 C45,510 50,500 42,495 C35,490 30,505 30,520 Z" fill="#d4af37" />
      <path d="M29,460 C14,450 9,440 17,435 C24,430 29,445 29,460 Z" fill="#d4af37" />
      <path d="M29,430 C44,420 49,410 41,405 C34,400 29,415 29,430 Z" fill="#d4af37" />
      <path d="M28,370 C13,360 8,350 16,345 C23,340 28,355 28,370 Z" fill="#d4af37" />
      <path d="M28,340 C43,330 48,320 40,315 C33,310 28,325 28,340 Z" fill="#d4af37" />
      <path d="M28,280 C13,270 8,260 16,255 C23,250 28,265 28,280 Z" fill="#d4af37" />
      <path d="M28,250 C43,240 48,230 40,225 C33,220 28,235 28,250 Z" fill="#d4af37" />
      <path d="M28,190 C13,180 8,170 16,165 C23,160 28,175 28,190 Z" fill="#d4af37" />
      <path d="M28,160 C43,150 48,140 40,135 C33,130 28,145 28,160 Z" fill="#d4af37" />
      <path d="M28,100 C13,90 8,80 16,75 C23,70 28,85 28,100 Z" fill="#d4af37" />
      <path d="M28,70 C43,60 48,50 40,45 C33,40 28,55 28,70 Z" fill="#d4af37" />
      <circle cx="16" cy="525" r="2.5" fill="#f5da81" />
      <circle cx="44" cy="405" r="2.5" fill="#f5da81" />
      <circle cx="15" cy="255" r="2.5" fill="#f5da81" />
      <circle cx="43" cy="135" r="2.5" fill="#f5da81" />
    </svg>
  )
}

function WreathSVG() {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M50,4 C53,10 52,16 48,20" stroke="#d4af37" strokeWidth="1" />
      <path d="M50,4 C44,5 42,9 45,12 C48,15 50,8 50,4 Z" fill="#d4af37" />
      <path d="M68,8 C73,13 71,20 66,23" stroke="#d4af37" strokeWidth="1" />
      <path d="M68,8 C63,11 62,15 65,18 C68,20 69,13 68,8 Z" fill="#d4af37" />
      <path d="M84,20 C89,26 86,33 80,35" stroke="#d4af37" strokeWidth="1" />
      <path d="M84,20 C80,24 79,28 82,31 C85,33 85,26 84,20 Z" fill="#d4af37" />
      <path d="M94,38 C98,45 93,52 87,53" stroke="#d4af37" strokeWidth="1" />
      <path d="M94,38 C91,43 90,47 93,50 C96,51 95,44 94,38 Z" fill="#d4af37" />
      <path d="M32,8 C27,13 29,20 34,23" stroke="#d4af37" strokeWidth="1" />
      <path d="M32,8 C37,11 38,15 35,18 C32,20 31,13 32,8 Z" fill="#d4af37" />
      <path d="M16,20 C11,26 14,33 20,35" stroke="#d4af37" strokeWidth="1" />
      <path d="M16,20 C20,24 21,28 18,31 C15,33 15,26 16,20 Z" fill="#d4af37" />
      <path d="M6,38 C2,45 7,52 13,53" stroke="#d4af37" strokeWidth="1" />
      <path d="M6,38 C9,43 10,47 7,50 C4,51 5,44 6,38 Z" fill="#d4af37" />
    </svg>
  )
}

function LotusSVG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 100" className={className} fill="currentColor">
      <g color="#ff809b">
        <path d="M60,15 C54,35 44,45 42,65 C52,65 57,55 60,35 C63,55 68,65 78,65 C76,45 66,35 60,15 Z" />
        <path d="M60,35 C50,48 38,55 28,70 C42,70 50,60 55,48 C51,60 48,70 60,80 C57,70 54,60 60,35 Z" opacity="0.9" />
        <path d="M60,35 C70,48 82,55 92,70 C78,70 70,60 65,48 C69,60 72,70 60,80 C63,70 66,60 60,35 Z" opacity="0.9" />
        <path d="M60,52 C52,62 38,72 15,80 C32,80 42,72 48,62 C44,74 42,84 55,90 C52,80 50,70 60,52 Z" opacity="0.75" />
        <path d="M60,52 C68,62 82,72 105,80 C88,80 78,72 72,62 C76,74 78,84 65,90 C68,80 70,70 60,52 Z" opacity="0.75" />
      </g>
      <path d="M30,83 C45,92 75,92 90,83 C75,85 45,85 30,83 Z" fill="#2d6a4f" />
    </svg>
  )
}

function BadgeLeafAccent() {
  return (
    <svg viewBox="0 0 30 20" className="w-6 h-4 text-amber-500 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M0,10 C10,5 20,2 25,0 C22,6 18,12 10,15 C15,10 20,8 30,10 C20,12 12,16 5,20 C10,15 15,12 0,10 Z" />
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
          primaryDateFormatted ? `Live stream · ${primaryDateFormatted}` : "",
          ...eventDates.map((d) => `${(d.label || "Session").trim()} · ${d.formatted}`),
        ]
          .filter(Boolean)
          .join(" · ")
      : eventDescription || "Live Ceremony · Welcome"

  // Split initials for monogram
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

  // Extract family name
  const familyName = useMemo(() => {
    if (coupleParts && coupleParts.length === 2) {
      const words = coupleParts[1].split(/\s+/)
      return `${words[words.length - 1]}'s`
    }
    return "Regulapati's"
  }, [coupleParts])

  return (
    <div className="wedding-south-indian-arch-skin">
      {globalHeaderImage}

      {/* Stone Pillars and Top Arch background */}
      <div className="arch-pillars-bg">
        <div className="arch-stone-pillar-left" />
        <div className="arch-stone-pillar-right" />
        <div className="arch-stone-top" />
      </div>

      {/* Crawling Gold Vines */}
      <div className="arch-gold-vines-left">
        <GoldVinesSVG />
      </div>
      <div className="arch-gold-vines-right">
        <GoldVinesSVG />
      </div>

      {/* Hero section */}
      <section className="arch-hero">
        {/* Monogram circle leaf wreath */}
        <div className="arch-monogram">
          <div className="arch-monogram-circle">
            <WreathSVG />
            <span className="arch-monogram-text">{initials.first}</span>
            <span className="arch-monogram-amp">&</span>
            <span className="arch-monogram-text">{initials.second}</span>
          </div>
        </div>

        {/* Traditional Invitation details */}
        <p className="arch-welcome-kicker">{kicker}</p>
        <p className="arch-to-sans">TO THE</p>
        <h2 className="arch-family-name">{familyName}</h2>
        
        {/* Marriage Party Badge flanked by gold leaves */}
        <div className="arch-marriage-party-badge">
          <div className="transform scale-x-[-1]"><BadgeLeafAccent /></div>
          <span>Marriage Party</span>
          <BadgeLeafAccent />
        </div>

        {/* Groom & Bride names */}
        <h1 className="arch-couple-names-wreath">
          {coupleParts && coupleParts.length === 2 ? (
            <>
              {coupleParts[0]}
              <span className="arch-weds-with-hearts">
                <Heart className="arch-weds-heart -mr-1" />
                weds
                <Heart className="arch-weds-heart -ml-1" />
              </span>
              {coupleParts[1]}
            </>
          ) : (
            coupleHero
          )}
        </h1>

        <div className="arch-gold-divider">
          <span className="arch-gold-divider-line" />
          <Sparkles className="arch-gold-divider-emblem" />
          <span className="arch-gold-divider-line" />
        </div>

        {/* Date line */}
        {primaryDateFormatted ? (
          <div className="arch-details-bar">
            {primaryDateFormatted}
          </div>
        ) : null}

        {/* Countdown */}
        {showCountdown ? (
          <div className="arch-countdown-box">
            <p className="arch-countdown-title">The Lagna Muhurat</p>
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

        {/* Watch Stream Button */}
        <div>
          <button type="button" className="arch-action-btn" onClick={scrollToStream}>
            Watch Live Stream
          </button>
        </div>

        {/* Couple Portrait Card centered in overlap */}
        <div className="arch-couple-card-frame">
          <div className="arch-couple-card-ring" />
          <div className="arch-couple-photo-wrapper">
            <img src={heroImageUrl} alt={coupleHero} />
          </div>
        </div>

        {/* Lotuses rising from the bottom */}
        <div className="arch-lotuses-bottom-frame">
          <LotusSVG className="arch-lotus-flower-bloom" />
          <LotusSVG className="arch-lotus-flower-bloom arch-lotus-flower-bloom-2" />
          <LotusSVG className="arch-lotus-flower-bloom arch-lotus-flower-bloom-3" />
        </div>

        <button type="button" className="arch-scroll-down" onClick={scrollToStream} aria-label="Scroll to content">
          <ChevronDown className="w-8 h-8" />
        </button>
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
      <section id="arch-stream-section" className="arch-section bg-white">
        <div className="arch-container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Video Player Card */}
            <div className={cn("lg:col-span-12", allowChat && showChat && "lg:col-span-8")}>
              <div className="arch-section-heading">
                <h2>Watch Live Stream</h2>
                <p>Welcome! Connect from anywhere and join us live for the ceremonial union.</p>
              </div>

              <div className="arch-stream-card">
                <div className="arch-stream-card-ring" />
                <div className="arch-stream-wrapper bg-black">
                  {streamPlayer}
                </div>
                <p className="arch-card-text">{invitationLine}</p>
              </div>
            </div>

            {/* Chat sidebar panel */}
            {allowChat && showChat ? (
              <div className="lg:col-span-4 lg:sticky lg:top-4">
                <div className="arch-section-heading text-left lg:mb-4">
                  <h2 className="text-xl text-zinc-800">Live Wishes</h2>
                  <p className="text-xs text-zinc-500">Send your blessings and congratulations to the couple</p>
                </div>
                <div className="arch-chat-panel h-[480px]">
                  {liveChat}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Details info section */}
      <section className="arch-section bg-[#faf2e4]/30">
        <div className="arch-container">
          <div className="mx-auto max-w-4xl">
            {detailsPanel}
          </div>
        </div>
      </section>

      {/* Teaser Section */}
      {teaserEmbed ? (
        <section className="arch-section bg-white">
          <div className="arch-container">
            <div className="arch-section-heading">
              <h2>Watch Teaser</h2>
              <p>A quick sneak peek of our beautiful moments</p>
            </div>
            <div className="arch-teaser-frame max-w-3xl mx-auto">
              <div className="arch-teaser-wrapper">
                <iframe
                  title="Wedding teaser video"
                  src={`${teaserEmbed}?rel=0`}
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Gallery Section */}
      {gallerySection ? (
        <section id="gallery-section" className="arch-section bg-[#faf2e4]/30">
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
        <div className="relative z-10">
          <h2>Thank You</h2>
          <p>Copyright © All Rights Reserved</p>
          
          {/* Floor Kolam geometric decoration */}
          <svg viewBox="0 0 120 120" className="arch-kolam-drawing" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M60,10 L70,30 L90,20 L80,40 L100,50 L80,60 L90,80 L70,70 L60,90 L50,70 L30,80 L40,60 L20,50 L40,40 L30,20 L50,30 Z" />
            <circle cx="60" cy="50" r="15" />
            <circle cx="60" cy="50" r="5" fill="currentColor" />
            <circle cx="35" cy="35" r="2" fill="currentColor" />
            <circle cx="85" cy="35" r="2" fill="currentColor" />
            <circle cx="35" cy="65" r="2" fill="currentColor" />
            <circle cx="85" cy="65" r="2" fill="currentColor" />
          </svg>
        </div>
      </footer>
    </div>
  )
}
