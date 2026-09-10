"use client"

import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/styles/wedding-ornate-floral-template.css"

export interface WeddingOrnateFloralDuoWatchViewProps {
  globalHeaderImage?: ReactNode
  heroImageUrl: string
  couple1ImageUrl?: string | null
  couple2ImageUrl?: string | null
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

function OrnateCornerOrnament() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2">
      {/* Corner outline design */}
      <path d="M0,0 L0,90 C8,85 16,72 16,62 C16,52 24,52 32,42 C40,32 48,24 56,16 C64,16 76,8 80,0 L0,0 Z" fill="currentColor" fillOpacity="0.08" />
      <path d="M0,0 C16,16 32,24 48,24 C56,24 64,16 80,0" />
      <path d="M0,0 C16,32 24,48 24,64 C24,72 16,80 0,80" />
      
      {/* Little accents */}
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
      <circle cx="36" cy="36" r="2.5" fill="currentColor" />
      <path d="M0,40 C16,36 28,24 40,0" />
      <path d="M0,60 C20,56 40,36 60,0" />
      
      {/* Traditional paisley leaf elements */}
      <path d="M20,4 C22,8 26,6 28,4 C26,2 22,0 20,4 Z" fill="currentColor" />
      <path d="M4,20 C8,22 6,26 4,28 C2,26 0,22 4,20 Z" fill="currentColor" />
      <path d="M30,10 C32,15 36,12 38,10 C36,7 32,5 30,10 Z" fill="currentColor" />
      <path d="M10,30 C15,32 12,36 10,38 C7,36 5,32 10,30 Z" fill="currentColor" />
    </svg>
  )
}

function OrnateRoseWreath() {
  return (
    <svg viewBox="0 0 300 90" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rose Wreath shadow leaves */}
      <path d="M60,55 C70,40 90,40 95,50 C90,60 70,60 60,55 Z" fill="#d4af37" fillOpacity="0.6" />
      <path d="M240,55 C230,40 210,40 205,50 C210,60 230,60 240,55 Z" fill="#d4af37" fillOpacity="0.6" />
      
      {/* Left side soft roses */}
      <circle cx="105" cy="52" r="14" fill="#f8bbd0" />
      <circle cx="105" cy="52" r="10" fill="#f48fb1" />
      <circle cx="105" cy="52" r="6" fill="#ad1457" />

      <circle cx="80" cy="58" r="10" fill="#d4af37" />
      <circle cx="80" cy="58" r="6" fill="#b8860b" />
      
      {/* Right side soft roses */}
      <circle cx="195" cy="52" r="14" fill="#f8bbd0" />
      <circle cx="195" cy="52" r="10" fill="#f48fb1" />
      <circle cx="195" cy="52" r="6" fill="#ad1457" />

      <circle cx="220" cy="58" r="10" fill="#d4af37" />
      <circle cx="220" cy="58" r="6" fill="#b8860b" />

      {/* Center Group - Magenta Rose */}
      <circle cx="150" cy="46" r="20" fill="#f8bbd0" />
      <circle cx="150" cy="46" r="16" fill="#e91e63" />
      <circle cx="150" cy="46" r="11" fill="#c2185b" />
      <circle cx="150" cy="46" r="6" fill="#880e4f" />
      
      {/* Overlay decorative petals */}
      <path d="M142,32 C146,28 154,28 158,32 C152,35 148,35 142,32 Z" fill="#e91e63" />
      <path d="M136,44 C132,48 132,54 136,58 C140,52 140,48 136,44 Z" fill="#e91e63" />
      <path d="M164,44 C168,48 168,54 164,58 C160,52 160,48 164,44 Z" fill="#e91e63" />
      <path d="M144,60 C148,64 152,64 156,60 C150,58 148,58 144,60 Z" fill="#e91e63" />

      {/* Mini gold accents */}
      <path d="M124,36 C120,38 120,44 126,44 C128,40 128,36 124,36 Z" fill="#d4af37" />
      <path d="M176,36 C180,38 180,44 174,44 C172,40 172,36 176,36 Z" fill="#d4af37" />
    </svg>
  )
}

export function WeddingOrnateFloralDuoWatchView({
  globalHeaderImage,
  heroImageUrl,
  couple1ImageUrl,
  couple2ImageUrl,
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
}: WeddingOrnateFloralDuoWatchViewProps) {
  const scrollToStream = () =>
    document.getElementById("ornate-stream-section")?.scrollIntoView({ behavior: "smooth", block: "start" })

  const kicker = eventSubtitle || "The Wedding of"

  const tickerMessage =
    primaryDateFormatted || eventDates.length > 0
      ? [
          primaryDateFormatted ? `Main ceremony · ${primaryDateFormatted}` : "",
          ...eventDates.map((d) => `${(d.label || "Session").trim()} · ${d.formatted}`),
        ]
          .filter(Boolean)
          .join(" · ")
      : eventDescription || "Live ceremony · Watch from anywhere"

  const c1Img = couple1ImageUrl?.trim() || heroImageUrl?.trim() || "/templates/wedding-ornate-couple.png"
  const c2Img = couple2ImageUrl?.trim() || heroImageUrl?.trim() || "/templates/wedding-ornate-couple.png"
  const c1Name = coupleParts?.[0] || "Groom"
  const c2Name = coupleParts?.[1] || "Bride"

  return (
    <div className="wedding-ornate-floral-skin">
      {globalHeaderImage}

      {/* Corner Ornaments */}
      <div className="ornate-corner ornate-corner-tl"><OrnateCornerOrnament /></div>
      <div className="ornate-corner ornate-corner-tr"><OrnateCornerOrnament /></div>
      <div className="ornate-corner ornate-corner-bl"><OrnateCornerOrnament /></div>
      <div className="ornate-corner ornate-corner-br"><OrnateCornerOrnament /></div>

      {/* Hero section */}
      <section className="ornate-hero">
        <div className="ornate-duo-wrapper">
          {/* Couple 1 Portrait */}
          <div className="ornate-duo-item">
            <div className="ornate-couple-circle-wrapper ornate-duo-circle-wrapper">
              <div className="ornate-gold-ring-outer" />
              <div className="ornate-gold-ring" />
              <div className="ornate-duo-circle">
                <img src={c1Img} alt={c1Name} />
              </div>
              <div className="ornate-duo-wreath">
                <OrnateRoseWreath />
              </div>
            </div>
            {coupleParts && coupleParts.length === 2 && (
              <p className="ornate-duo-caption">{c1Name}</p>
            )}
          </div>

          {/* Central Gold Ampersand Medallion */}
          <div className="ornate-duo-badge" aria-hidden="true">
            <span className="ornate-duo-badge-ampersand">&</span>
          </div>

          {/* Couple 2 Portrait */}
          <div className="ornate-duo-item">
            <div className="ornate-couple-circle-wrapper ornate-duo-circle-wrapper">
              <div className="ornate-gold-ring-outer" />
              <div className="ornate-gold-ring" />
              <div className="ornate-duo-circle">
                <img src={c2Img} alt={c2Name} />
              </div>
              <div className="ornate-duo-wreath">
                <OrnateRoseWreath />
              </div>
            </div>
            {coupleParts && coupleParts.length === 2 && (
              <p className="ornate-duo-caption">{c2Name}</p>
            )}
          </div>
        </div>

        <div className="text-center z-10 px-4">
          <p className="ornate-kicker">{kicker}</p>
          <h1 className="ornate-title">
            {coupleParts && coupleParts.length === 2 ? (
              <>
                {coupleParts[0]}
                <br />
                <span className="font-serif italic text-amber-600 font-normal my-1 inline-block">&</span>
                <br />
                {coupleParts[1]}
              </>
            ) : (
              coupleHero
            )}
          </h1>

          <div className="ornate-divider">
            <span className="ornate-divider-line" />
            <svg viewBox="0 0 24 24" className="ornate-divider-emblem fill-current w-6 h-6">
              <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4M12,18A2,2 0 0,1 10,20A2,2 0 0,1 12,22A2,2 0 0,1 14,20A2,2 0 0,1 12,18Z" />
            </svg>
            <span className="ornate-divider-line" />
          </div>

          {primaryDateFormatted ? (
            <div className="ornate-date-box">
              {primaryDateFormatted.toUpperCase()}
            </div>
          ) : null}

          {showCountdown ? (
            <div className="ornate-countdown-container">
              <p className="ornate-countdown-title">COUNTDOWN TO CEREMONY</p>
              <div className="ornate-countdown-timer">
                <div className="ornate-countdown-item">
                  <span className="ornate-countdown-num">{String(countdown.days).padStart(2, "0")}</span>
                  <span className="ornate-countdown-label">Days</span>
                </div>
                <span className="ornate-countdown-sep">:</span>
                <div className="ornate-countdown-item">
                  <span className="ornate-countdown-num">{String(countdown.hours).padStart(2, "0")}</span>
                  <span className="ornate-countdown-label">Hours</span>
                </div>
                <span className="ornate-countdown-sep">:</span>
                <div className="ornate-countdown-item">
                  <span className="ornate-countdown-num">{String(countdown.minutes).padStart(2, "0")}</span>
                  <span className="ornate-countdown-label">Mins</span>
                </div>
                <span className="ornate-countdown-sep">:</span>
                <div className="ornate-countdown-item">
                  <span className="ornate-countdown-num">{String(countdown.seconds).padStart(2, "0")}</span>
                  <span className="ornate-countdown-label">Secs</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={scrollToStream}
              className="ornate-btn"
            >
              Watch Live Stream
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={scrollToStream}
              className="ornate-scroll-hint"
              aria-label="Scroll to live stream"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Marquee Ticker */}
      <div className="ornate-ticker">
        <div className="ornate-ticker-track">
          <div className="ornate-ticker-content">
            {tickerMessage} &nbsp;&nbsp;✦&nbsp;&nbsp; {tickerMessage} &nbsp;&nbsp;✦&nbsp;&nbsp;
          </div>
          <div className="ornate-ticker-content" aria-hidden="true">
            {tickerMessage} &nbsp;&nbsp;✦&nbsp;&nbsp; {tickerMessage} &nbsp;&nbsp;✦&nbsp;&nbsp;
          </div>
        </div>
      </div>

      {/* Invitation card section */}
      <section className="ornate-invitation-section">
        <div className="ornate-invitation-card">
          <p className="ornate-invitation-text">{invitationLine}</p>
        </div>
      </section>

      {/* Teaser Video (optional) */}
      {teaserEmbed ? (
        <section className="ornate-container my-12">
          <div className="ornate-section-heading">
            <h2>Pre-Wedding Highlights</h2>
          </div>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border-4 border-[#d4af37]/30 shadow-2xl bg-black aspect-video">
            <iframe
              src={teaserEmbed}
              title="Pre-wedding highlight"
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      {/* Live Stream / Player Section */}
      <section id="ornate-stream-section" className="ornate-container py-12 scroll-mt-6">
        <div className="ornate-section-heading">
          <h2>Live Stream</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className={cn("space-y-6", allowChat && showChat ? "lg:col-span-8" : "lg:col-span-12")}>
            <div className="overflow-hidden rounded-2xl border-2 border-[#d4af37]/40 shadow-2xl bg-black">
              {streamPlayer}
            </div>
            {detailsPanel}
          </div>

          {allowChat && showChat && liveChat ? (
            <div className="lg:col-span-4">
              <div className="sticky top-20 rounded-2xl border-2 border-[#d4af37]/40 bg-white/80 p-4 shadow-xl backdrop-blur-md">
                {liveChat}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Photo Gallery Section */}
      {gallerySection}

      {/* Footer & Photographer Credit */}
      <footer className="ornate-footer">
        {photographerCredit}
        <p className="mt-8 text-xs text-[#3f2028]/50">
          Streamed with love · White-label live broadcast
        </p>
      </footer>
    </div>
  )
}
