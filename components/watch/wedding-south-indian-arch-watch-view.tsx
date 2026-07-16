"use client"

import type { ReactNode } from "react"
import { useMemo } from "react"
import { ChevronDown, Sparkles } from "lucide-react"
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

function GaneshaLogo() {
  return (
    <svg viewBox="0 0 100 100" className="arch-monogram-ganesha" fill="currentColor">
      <path d="M50,12 C58,12 65,18 65,26 C65,33 58,40 50,40 C42,40 35,33 35,30 C35,22 42,12 50,12 Z M50,15 C44,15 39,20 39,26 C39,32 44,37 50,37 C56,37 61,32 61,26 C61,20 56,15 50,15 Z" />
      <path d="M50,37 C60,37 70,47 70,64 C70,66 68,68 66,68 C58,68 50,64 50,56 C50,64 42,72 36,72 C34,72 32,70 32,68 C32,52 42,42 50,42 Z" opacity="0.9" />
      <path d="M50,4 L55,11 L45,11 Z" fill="#d4af37" />
      <circle cx="50" cy="2" r="1.5" fill="#d4af37" />
      <path d="M50,32 Q56,37 56,43 T49,54 T55,62" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="56" cy="62" r="2.5" fill="#d4af37" />
      <path d="M43,33 L38,33 L41,31 Z" fill="#ffffff" />
    </svg>
  )
}

function KuthuVilakku() {
  return (
    <svg viewBox="0 0 80 260" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15,250 C15,235 30,230 40,230 C50,230 65,235 65,250 C60,253 20,253 15,250 Z" fill="#b8860b" />
      <path d="M10,250 L70,250 L65,255 L15,255 Z" fill="#d4af37" />
      <rect x="36" y="110" width="8" height="120" fill="#b8860b" />
      <rect x="37" y="110" width="3" height="120" fill="#f5da81" />
      <ellipse cx="40" cy="225" rx="12" ry="6" fill="#d4af37" />
      <ellipse cx="40" cy="225" rx="8" ry="3" fill="#faf2e4" />
      <ellipse cx="40" cy="180" rx="10" ry="5" fill="#d4af37" />
      <ellipse cx="40" cy="140" rx="9" ry="4" fill="#d4af37" />
      <path d="M22,110 C22,95 30,85 40,85 C50,85 58,95 58,110 C50,113 30,113 22,110 Z" fill="#b8860b" />
      <ellipse cx="40" cy="85" rx="20" ry="6" fill="#d4af37" />
      <path d="M36,80 C36,75 38,72 40,72 C42,72 44,75 44,80 L40,85 Z" fill="#b8860b" />
      <circle cx="40" cy="65" r="3" fill="#d4af37" />
      <g className="arch-lamp-flame">
        <path d="M40,42 C36,54 36,60 40,65 C44,60 44,54 40,42 Z" fill="#ff6600" />
        <path d="M40,47 C38,55 38,59 40,63 C42,59 42,55 40,47 Z" fill="#ffcc00" />
        <path d="M40,53 C39,57 39,60 40,62 C41,60 41,57 40,53 Z" fill="#ffffff" />
      </g>
    </svg>
  )
}

function BananaTreeSVG() {
  return (
    <svg viewBox="0 0 160 500" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M72,250 C72,200 76,150 78,100 L82,100 C84,150 88,200 88,250 L84,500 L76,500 Z" fill="#4d8c57" />
      <path d="M78,100 C40,70 10,110 5,160 Q30,165 78,120 Z" fill="#2d6a3e" />
      <path d="M78,100 C40,70 10,110 5,160" stroke="#a3cfbb" strokeWidth="2" />
      <path d="M82,100 C120,70 150,110 155,160 Q130,165 82,120 Z" fill="#2d6a3e" />
      <path d="M82,100 C120,70 150,110 155,160" stroke="#a3cfbb" strokeWidth="2" />
      <path d="M80,160 C30,150 5,200 0,260 Q30,265 80,185 Z" fill="#1b4324" />
      <path d="M80,160 C30,150 5,200 0,260" stroke="#a3cfbb" strokeWidth="2" />
      <path d="M80,180 C130,170 155,220 160,280 Q130,285 80,205 Z" fill="#1b4324" />
      <path d="M80,180 C130,170 155,220 160,280" stroke="#a3cfbb" strokeWidth="2" />
      <path d="M82,240 C40,240 20,300 15,370 Q45,360 82,260 Z" fill="#0f2914" />
      <path d="M82,240 C40,240 20,300 15,370" stroke="#72ba97" strokeWidth="1.5" />
      <path d="M82,260 C120,260 140,320 145,390 Q115,380 82,280 Z" fill="#0f2914" />
      <path d="M82,260 C120,260 140,320 145,390" stroke="#72ba97" strokeWidth="1.5" />
      <path d="M80,120 C80,140 85,150 85,160 L78,160 C78,150 78,140 80,120 Z" fill="#581c2d" />
      <path d="M76,160 Q80,180 84,160 C87,175 80,185 76,160 Z" fill="#581c2d" />
    </svg>
  )
}

function CeilingGarlands() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex flex-col items-center select-none" style={{ animationDelay: `${i * -0.4}s` }}>
          {[...Array(6)].map((_, j) => (
            <div
              key={j}
              className="w-5 h-5 rounded-full flex items-center justify-center -mt-1 shadow-sm"
              style={{
                backgroundColor: j % 2 === 0 ? "#ff9900" : "#ffc107",
                border: "1px solid #d4af37",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
            </div>
          ))}
          <svg viewBox="0 0 10 20" className="w-4 h-6 text-[#1b4d22] -mt-1" fill="currentColor">
            <path d="M5,0 C2,6 1,12 5,20 C9,12 8,6 5,0 Z" />
          </svg>
        </div>
      ))}
    </>
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

  const kicker = eventSubtitle || "We're getting married — tune in live"

  const tickerMessage =
    primaryDateFormatted || eventDates.length > 0
      ? [
          primaryDateFormatted ? `शुभ विवाह · ${primaryDateFormatted}` : "",
          ...eventDates.map((d) => `${(d.label || "Session").trim()} · ${d.formatted}`),
        ]
          .filter(Boolean)
          .join(" · ")
      : eventDescription || "शुभ विवाह · Live Broadcast Starts Soon"

  return (
    <div className="wedding-south-indian-arch-skin">
      {globalHeaderImage}

      {/* Saree borders */}
      <div className="arch-zari-border-left" />
      <div className="arch-zari-border-right" />

      {/* Ceiling hanging flower garlands */}
      <div className="arch-ceiling-garlands">
        <CeilingGarlands />
      </div>

      {/* Auspicious banana trees standing on both sides */}
      <div className="arch-banana-tree-left">
        <BananaTreeSVG />
      </div>
      <div className="arch-banana-tree-right">
        <BananaTreeSVG />
      </div>

      {/* Hero section */}
      <section className="arch-hero">
        {/* Monogram */}
        <div className="arch-monogram">
          <div className="arch-monogram-circle">
            <GaneshaLogo />
          </div>
        </div>

        {/* Mandap Gate container */}
        <div className="arch-mandap-gate">
          {/* Double brass lamps flanking inside the container */}
          <div className="arch-kuthuvilakku-container">
            <div className="arch-lamp-pillar"><KuthuVilakku /></div>
            <div className="arch-lamp-pillar"><KuthuVilakku /></div>
          </div>

          <div className="relative z-10 px-2">
            <p className="arch-shloka">ॐ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥</p>
            <p className="text-[10px] font-bold tracking-[0.3em] text-[#b8860b] uppercase mb-1">|| श्री गणेशाय नमः ||</p>
            <p className="arch-kicker">{kicker}</p>
            
            <div className="arch-divider">
              <span className="arch-divider-line" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest px-2">TO THE</span>
              <span className="arch-divider-line" />
            </div>

            <h1 className="arch-title">
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  {coupleParts[0]}
                  <span className="arch-names-weds">weds</span>
                  {coupleParts[1]}
                </>
              ) : (
                coupleHero
              )}
            </h1>

            <div className="arch-badge-party">
              Marriage Party
            </div>

            <div className="arch-couple-circle-wrapper my-4">
              <div className="arch-couple-circle">
                <img src={heroImageUrl} alt={coupleHero} />
              </div>
            </div>

            <div className="arch-divider">
              <span className="arch-divider-line" />
              <Sparkles className="arch-divider-emblem text-[#b8860b]" />
              <span className="arch-divider-line" />
            </div>

            {primaryDateFormatted ? (
              <div className="arch-date-box">
                {primaryDateFormatted}
              </div>
            ) : null}

            {showCountdown ? (
              <div className="arch-countdown-container">
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

            <div className="mt-6">
              <button type="button" className="arch-btn" onClick={scrollToStream}>
                Watch Live Stream
              </button>
            </div>
          </div>
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
      <section id="arch-stream-section" className="arch-section">
        <div className="arch-container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            {/* Video Player Frame */}
            <div className={cn("lg:col-span-12", allowChat && showChat && "lg:col-span-8")}>
              <div className="arch-section-heading">
                <h2>Watch Live Broadcast</h2>
                <p>Welcome! Connect from anywhere and join us live for the ceremonial union.</p>
              </div>

              <div className="arch-stream-card">
                <div className="arch-stream-wrapper bg-black">
                  {streamPlayer}
                </div>
                <p className="arch-card-text">{invitationLine}</p>
              </div>
            </div>

            {/* Wishes Live Chat */}
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

      {/* Details info section */}
      <section className="arch-section bg-[#faf2e4]/10">
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
            <div className="arch-teaser-frame max-w-3xl mx-auto">
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
        <section className="arch-section bg-[#faf2e4]/10">
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
          <div className="arch-lotus-flower"><svg viewBox="0 0 100 100" fill="currentColor"><path d="M50,15 C45,30 35,40 30,55 C40,55 45,45 50,25 C55,45 60,55 70,55 C65,40 55,30 50,15 Z" /><path d="M50,32 C40,45 28,52 20,68 C32,68 40,58 46,45 C43,58 40,68 50,78 C60,68 57,58 54,45 C60,58 68,68 80,68 C72,52 60,45 50,32 Z" opacity="0.85" /><path d="M50,50 C44,60 32,70 12,78 C28,78 38,70 44,60 C40,72 38,82 50,88 C62,82 60,72 56,60 C62,70 72,78 88,78 C68,70 56,60 50,50 Z" opacity="0.7" /><path d="M25,80 C35,88 65,88 75,80 C60,82 40,82 25,80 Z" fill="#2d5f2d" /></svg></div>
          <div className="arch-lotus-flower arch-lotus-flower-2"><svg viewBox="0 0 100 100" fill="currentColor"><path d="M50,15 C45,30 35,40 30,55 C40,55 45,45 50,25 C55,45 60,55 70,55 C65,40 55,30 50,15 Z" /><path d="M50,32 C40,45 28,52 20,68 C32,68 40,58 46,45 C43,58 40,68 50,78 C60,68 57,58 54,45 C60,58 68,68 80,68 C72,52 60,45 50,32 Z" opacity="0.85" /><path d="M50,50 C44,60 32,70 12,78 C28,78 38,70 44,60 C40,72 38,82 50,88 C62,82 60,72 56,60 C62,70 72,78 88,78 C68,70 56,60 50,50 Z" opacity="0.7" /><path d="M25,80 C35,88 65,88 75,80 C60,82 40,82 25,80 Z" fill="#2d5f2d" /></svg></div>
          <div className="arch-lotus-flower arch-lotus-flower-3"><svg viewBox="0 0 100 100" fill="currentColor"><path d="M50,15 C45,30 35,40 30,55 C40,55 45,45 50,25 C55,45 60,55 70,55 C65,40 55,30 50,15 Z" /><path d="M50,32 C40,45 28,52 20,68 C32,68 40,58 46,45 C43,58 40,68 50,78 C60,68 57,58 54,45 C60,58 68,68 80,68 C72,52 60,45 50,32 Z" opacity="0.85" /><path d="M50,50 C44,60 32,70 12,78 C28,78 38,70 44,60 C40,72 38,82 50,88 C62,82 60,72 56,60 C62,70 72,78 88,78 C68,70 56,60 50,50 Z" opacity="0.7" /><path d="M25,80 C35,88 65,88 75,80 C60,82 40,82 25,80 Z" fill="#2d5f2d" /></svg></div>
        </div>

        <div className="relative z-10">
          <h2>Thank You</h2>
          <p>Copyright © All Rights Reserved</p>
          
          {/* Kolam floor drawing */}
          <svg viewBox="0 0 120 120" className="arch-kolam-bottom" fill="none" stroke="currentColor" strokeWidth="1.5">
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
