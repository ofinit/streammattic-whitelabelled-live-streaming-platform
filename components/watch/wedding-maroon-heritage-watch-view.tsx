"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { Calendar, MapPin, Gift, Play, Home, Clock, Image as ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/styles/wedding-maroon-heritage-template.css"

interface WeddingMaroonHeritageWatchViewProps {
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

function GaneshaLogo() {
  return (
    <svg viewBox="0 0 100 100" className="heritage-ganesha" fill="currentColor">
      <path d="M50,15 C58,15 65,22 65,30 C65,38 58,45 50,45 C42,45 35,38 35,30 C35,22 42,15 50,15 Z M50,18 C43,18 38,23 38,30 C38,37 43,42 50,42 C57,42 62,37 62,30 C62,23 57,18 50,18 Z" />
      <path d="M50,42 C58,42 68,52 68,68 C68,70 66,72 64,72 C58,72 50,68 50,60 C50,68 42,72 36,72 C34,72 32,70 32,68 C32,52 42,42 50,42 Z" opacity="0.9" />
      <path d="M50,8 L53,14 L47,14 Z" />
      <circle cx="50" cy="5" r="2" />
      <path d="M50,38 C54,42 56,48 54,54 C52,60 48,62 48,65 C48,68 52,70 55,68 C58,66 59,60 59,54 C59,45 53,40 50,38 Z" fill="#d4af37" />
    </svg>
  )
}

export function WeddingMaroonHeritageWatchView({
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
}: WeddingMaroonHeritageWatchViewProps) {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="wedding-maroon-heritage-skin">
      {globalHeaderImage}

      {/* Top navigation */}
      <nav className="heritage-nav">
        <div className="heritage-nav-container">
          <div className="heritage-nav-logo">
            {coupleParts && coupleParts.length === 2 ? `${coupleParts[0]} ♥ ${coupleParts[1]}` : coupleHero}
          </div>
          <div className="heritage-nav-menu">
            <button type="button" className="heritage-nav-link" onClick={() => scrollToSection("home")}>Home</button>
            <button type="button" className="heritage-nav-link" onClick={() => scrollToSection("stream-section")}>Live</button>
            <button type="button" className="heritage-nav-link" onClick={() => scrollToSection("details-section")}>Events</button>
            {gallerySection ? (
              <button type="button" className="heritage-nav-link" onClick={() => scrollToSection("gallery-section")}>Gallery</button>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="heritage-container py-8">
        <div className="heritage-top-arch" />
        
        <div className="heritage-hero-split">
          {/* Left couple card */}
          <div className="heritage-hero-photo-card">
            <div className="heritage-hero-photo-ring" />
            <div className="heritage-hero-photo-wrapper">
              <img src={heroImageUrl} alt={coupleHero} />
            </div>
          </div>

          {/* Right invitation details */}
          <div className="heritage-hero-info-card">
            <GaneshaLogo />
            <p className="heritage-shloka">|| श्री गणेशाय नमः ||</p>
            <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-bold mb-4">शुभलेख</p>
            
            <div className="heritage-names">
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  <span className="heritage-names-telugu font-sans block mb-1">
                    {coupleParts[0]} రెడ్డి
                  </span>
                  <span className="heritage-names-weds">weds</span>
                  <span className="heritage-names-telugu font-sans block mt-1">
                    {coupleParts[1]}
                  </span>
                  <span className="text-sm font-semibold tracking-wider text-zinc-500 block mt-4">
                    ({coupleParts[0]} & {coupleParts[1]})
                  </span>
                </>
              ) : (
                coupleHero
              )}
            </div>

            <div className="heritage-save-date-badge">Save The Date</div>
            {primaryDateFormatted ? (
              <div className="heritage-event-date">{primaryDateFormatted}</div>
            ) : null}
            
            {/* Countdown timer */}
            {showCountdown ? (
              <div className="heritage-countdown-card">
                <p className="heritage-countdown-title">Big Day Is Coming</p>
                <div className="heritage-countdown-grid">
                  <div className="heritage-countdown-item">
                    <span className="heritage-countdown-num">{String(countdown.days).padStart(2, "0")}</span>
                    <span className="heritage-countdown-label">Days</span>
                  </div>
                  <span className="heritage-countdown-sep">:</span>
                  <div className="heritage-countdown-item">
                    <span className="heritage-countdown-num">{String(countdown.hours).padStart(2, "0")}</span>
                    <span className="heritage-countdown-label">Hrs</span>
                  </div>
                  <span className="heritage-countdown-sep">:</span>
                  <div className="heritage-countdown-item">
                    <span className="heritage-countdown-num">{String(countdown.minutes).padStart(2, "0")}</span>
                    <span className="heritage-countdown-label">Mins</span>
                  </div>
                  <span className="heritage-countdown-sep">:</span>
                  <div className="heritage-countdown-item">
                    <span className="heritage-countdown-num">{String(countdown.seconds).padStart(2, "0")}</span>
                    <span className="heritage-countdown-label">Secs</span>
                  </div>
                </div>
                <button type="button" className="heritage-countdown-btn">Add to Calendar</button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Live Stream Section */}
      <section id="stream-section" className="heritage-section bg-[#faf7f0]">
        <div className="heritage-container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Video Player Card */}
            <div className={cn("lg:col-span-12", allowChat && showChat && "lg:col-span-8")}>
              <div className="heritage-section-heading">
                <h2>Watch Live Stream</h2>
                <p>Witness our sacred ceremonies live from anywhere in the world.</p>
              </div>

              <div className="heritage-video-card">
                <div className="heritage-video-frame bg-black">
                  {streamPlayer}
                </div>
                <p className="text-center font-serif text-lg text-zinc-800 mt-4 px-2">{invitationLine}</p>
              </div>
            </div>

            {/* Chat Body panel */}
            {allowChat && showChat ? (
              <div className="lg:col-span-4 lg:sticky lg:top-16">
                <div className="heritage-section-heading text-left lg:mb-4">
                  <h2 className="text-xl">Live Wishes</h2>
                  <p className="text-xs">Bless the couple with your sweet words</p>
                </div>
                <div className="heritage-chat-panel h-[480px]">
                  {liveChat}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Events Details sheet */}
      <section id="details-section" className="heritage-section bg-white">
        <div className="heritage-container">
          <div className="heritage-section-heading">
            <h2>Wedding Details</h2>
            <p>Timelines, venue addresses, and details for the events</p>
          </div>
          <div className="mx-auto max-w-4xl">
            {detailsPanel}
          </div>
        </div>
      </section>

      {/* Teaser Section */}
      {teaserEmbed ? (
        <section className="heritage-section bg-[#faf7f0]">
          <div className="heritage-container">
            <div className="heritage-section-heading">
              <h2>Watch Teaser</h2>
              <p>A quick sneak peek of our beautiful moments</p>
            </div>
            <div className="heritage-video-card max-w-3xl mx-auto">
              <div className="heritage-video-frame">
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
        <section id="gallery-section" className="heritage-section bg-white">
          <div className="heritage-container">
            <div className="heritage-gallery-wrap">
              {gallerySection}
            </div>
          </div>
        </section>
      ) : null}

      {/* Photographer credits */}
      {photographerCredit ? (
        <section className="heritage-footer py-12 border-t border-amber-500/10">
          <div className="heritage-container">
            {photographerCredit}
          </div>
        </section>
      ) : null}

      {/* Invite banner statement */}
      <div className="heritage-invite-banner">
        We warmly invite you to share our joy and bless the couple
      </div>

      {/* Footer */}
      <footer className="heritage-footer">
        <h2>Thank You</h2>
        <p>Copyright © All Rights Reserved</p>
      </footer>

      {/* Bottom tabs for mobile */}
      <div className="heritage-mobile-tabs">
        <button type="button" className="heritage-tab-item" onClick={() => scrollToSection("home")}>
          <Home className="heritage-tab-icon" />
          <span className="heritage-tab-label">Home</span>
        </button>
        <button type="button" className="heritage-tab-item" onClick={() => scrollToSection("stream-section")}>
          <Play className="heritage-tab-icon" />
          <span className="heritage-tab-label">Live</span>
        </button>
        <button type="button" className="heritage-tab-item" onClick={() => scrollToSection("details-section")}>
          <Clock className="heritage-tab-icon" />
          <span className="heritage-tab-label">Events</span>
        </button>
        {gallerySection ? (
          <button type="button" className="heritage-tab-item" onClick={() => scrollToSection("gallery-section")}>
            <ImageIcon className="heritage-tab-icon" />
            <span className="heritage-tab-label">Gallery</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
