"use client"

import { useMemo, useState, useEffect } from "react"
import { ChevronDown, Play, Sparkles } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import "@/styles/wedding-south-indian-arch-template.css"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

function splitCoupleTitle(title: string): { first: string; second: string } | null {
  const m = title.match(/^(.+?)\s*[&+]\s*(.+)$/)
  if (!m) return null
  return { first: m[1].trim(), second: m[2].trim() }
}

function ArchLotusFlower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor">
      {/* Decorative Traditional Indian Lotus Flower */}
      <path d="M50,15 C45,30 35,40 30,55 C40,55 45,45 50,25 C55,45 60,55 70,55 C65,40 55,30 50,15 Z" />
      <path d="M50,32 C40,45 28,52 20,68 C32,68 40,58 46,45 C43,58 40,68 50,78 C60,68 57,58 54,45 C60,58 68,68 80,68 C72,52 60,45 50,32 Z" opacity="0.85" />
      <path d="M50,50 C44,60 32,70 12,78 C28,78 38,70 44,60 C40,72 38,82 50,88 C62,82 60,72 56,60 C62,70 72,78 88,78 C68,70 56,60 50,50 Z" opacity="0.7" />
      {/* Bottom green leaf stand */}
      <path d="M25,80 C35,88 65,88 75,80 C60,82 40,82 25,80 Z" fill="#2d5f2d" />
    </svg>
  )
}

function ArchGarlandAccent() {
  return (
    <svg viewBox="0 0 400 60" className="w-full h-full animate-pulse" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hanging marigold flower garlands */}
      {/* Left side garland string */}
      <path d="M10,0 Q30,45 70,35 T130,25 T190,15" stroke="#d4af37" strokeWidth="2" strokeDasharray="3 3" />
      {/* Right side garland string */}
      <path d="M390,0 Q370,45 330,35 T270,25 T210,15" stroke="#d4af37" strokeWidth="2" strokeDasharray="3 3" />
      
      {/* Golden flowers dots along the path */}
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
      
      {/* Central hanging tassel */}
      <line x1="200" y1="0" x2="200" y2="40" stroke="#d4af37" strokeWidth="1.5" />
      <circle cx="200" cy="35" r="7" fill="#ff6600" />
      <polygon points="196,40 204,40 200,55" fill="#ffcc00" />
    </svg>
  )
}

export function WeddingSouthIndianArchTemplate({
  eventTitle = "Alekhya & Srikanth Rao",
  eventDescription = "We solicit your gracious virtual presence with family and friends on this auspicious occasion.",
  heroImageUrl,
}: TemplateProps) {
  const hero = heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-south-indian-arch") || ""
  const coupleParts = useMemo(() => splitCoupleTitle(eventTitle), [eventTitle])

  // Get initials for monogram
  const initials = useMemo(() => {
    if (coupleParts) {
      return {
        first: coupleParts.first.charAt(0).toUpperCase(),
        second: coupleParts.second.charAt(0).toUpperCase(),
      }
    }
    const clean = eventTitle.replace(/weds|&|\+/gi, "").trim().split(/\s+/)
    if (clean.length >= 2) {
      return { first: clean[0].charAt(0).toUpperCase(), second: clean[1].charAt(0).toUpperCase() }
    }
    return { first: "A", second: "S" }
  }, [eventTitle, coupleParts])

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState({ days: 45, hours: 14, minutes: 35, seconds: 48 })

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const scrollToStream = () =>
    document.getElementById("arch-preview-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="wedding-south-indian-arch-skin">
      {/* Decorative Pillars and Arch elements */}
      <div className="arch-frame-top" />
      <div className="arch-pillar-left" />
      <div className="arch-pillar-right" />

      {/* Hero Section */}
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
            <img src={hero} alt={eventTitle} />
          </div>
          <div className="arch-garland-accent">
            <ArchGarlandAccent />
          </div>
        </div>

        <div className="text-center z-10 px-4">
          <p className="arch-kicker">Welcome</p>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4af37] mb-2">To The</p>
          
          <h1 className="arch-title">
            {coupleParts ? (
              <>
                {coupleParts.first}
                <span className="arch-names-weds font-serif italic text-[#ff9900] font-normal my-2 block">weds</span>
                {coupleParts.second}
              </>
            ) : (
              eventTitle
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

          <div className="arch-date-box">
            Save The Date
          </div>

          <div className="arch-countdown-container">
            <p className="arch-countdown-title">The Big Day Is Coming</p>
            <div className="arch-countdown-timer">
              <div className="arch-countdown-item">
                <span className="arch-countdown-num">{String(timeLeft.days).padStart(2, "0")}</span>
                <span className="arch-countdown-label">Days</span>
              </div>
              <span className="arch-countdown-sep">:</span>
              <div className="arch-countdown-item">
                <span className="arch-countdown-num">{String(timeLeft.hours).padStart(2, "0")}</span>
                <span className="arch-countdown-label">Hrs</span>
              </div>
              <span className="arch-countdown-sep">:</span>
              <div className="arch-countdown-item">
                <span className="arch-countdown-num">{String(timeLeft.minutes).padStart(2, "0")}</span>
                <span className="arch-countdown-label">Mins</span>
              </div>
              <span className="arch-countdown-sep">:</span>
              <div className="arch-countdown-item">
                <span className="arch-countdown-num">{String(timeLeft.seconds).padStart(2, "0")}</span>
                <span className="arch-countdown-label">Secs</span>
              </div>
            </div>
          </div>

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

      {/* Marquee message banner */}
      <div className="arch-marquee">
        <div className="arch-marquee-track">
          <span className="px-8">Live Streaming Starts Soon · Welcome to family and friends · Bless the couple · </span>
          <span className="px-8" aria-hidden>Live Streaming Starts Soon · Welcome to family and friends · Bless the couple · </span>
          <span className="px-8" aria-hidden>Live Streaming Starts Soon · Welcome to family and friends · Bless the couple · </span>
        </div>
      </div>

      {/* Live Stream Section */}
      <section id="arch-preview-stream" className="arch-section">
        <div className="arch-container">
          <div className="arch-section-heading">
            <h2>Watch Live</h2>
            <p>{eventDescription}</p>
          </div>

          <div className="arch-stream-card">
            <div className="arch-stream-wrapper bg-gradient-to-br from-[#4a0012] to-[#800020] flex items-center justify-center text-white">
              <div className="text-center p-6">
                <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-4 border border-white/20">
                  <Play className="w-8 h-8 text-white fill-current" />
                </div>
                <h3 className="font-serif text-lg text-amber-100">Live stream will play here</h3>
              </div>
            </div>
            <p className="arch-card-text">{eventDescription}</p>
          </div>
        </div>
      </section>

      {/* Teaser section */}
      <section className="arch-section bg-[#fff0f3]/40">
        <div className="arch-container">
          <div className="arch-section-heading">
            <h2>Wedding Teaser</h2>
            <p>A quick sneak peek of our beautiful moments</p>
          </div>
          <div className="arch-teaser-frame">
            <iframe
              title="Wedding teaser video"
              src="https://www.youtube.com/embed/RJZbC9iLAqk?rel=0"
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Footer credits with lotuses */}
      <footer className="arch-footer">
        {/* Floating Lotuses */}
        <div className="arch-lotuses-footer">
          <ArchLotusFlower className="arch-lotus-flower" />
          <ArchLotusFlower className="arch-lotus-flower arch-lotus-flower-2" />
          <ArchLotusFlower className="arch-lotus-flower arch-lotus-flower-3" />
        </div>

        <div className="relative z-10">
          <h2>Thank You</h2>
          <p>Template Preview · Traditional South Indian Arch</p>
        </div>
      </footer>
    </div>
  )
}
