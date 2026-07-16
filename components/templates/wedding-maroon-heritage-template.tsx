"use client"

import { useMemo, useState, useEffect } from "react"
import { Calendar, MapPin, Gift, Play, Home, BookOpen, Clock, Image as ImageIcon, MessageSquare } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import "@/styles/wedding-maroon-heritage-template.css"

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

function GaneshaLogo() {
  return (
    <svg viewBox="0 0 100 100" className="heritage-ganesha" fill="currentColor">
      {/* Abstract elegant Ganesha symbol */}
      <path d="M50,15 C58,15 65,22 65,30 C65,38 58,45 50,45 C42,45 35,38 35,30 C35,22 42,15 50,15 Z M50,18 C43,18 38,23 38,30 C38,37 43,42 50,42 C57,42 62,37 62,30 C62,23 57,18 50,18 Z" />
      <path d="M50,42 C58,42 68,52 68,68 C68,70 66,72 64,72 C58,72 50,68 50,60 C50,68 42,72 36,72 C34,72 32,70 32,68 C32,52 42,42 50,42 Z" opacity="0.9" />
      {/* Crown/Trishul detail */}
      <path d="M50,8 L53,14 L47,14 Z" />
      <circle cx="50" cy="5" r="2" />
      {/* Trunk curves */}
      <path d="M50,38 C54,42 56,48 54,54 C52,60 48,62 48,65 C48,68 52,70 55,68 C58,66 59,60 59,54 C59,45 53,40 50,38 Z" fill="#d4af37" />
    </svg>
  )
}

export function WeddingMaroonHeritageTemplate({
  eventTitle = "Srinivas & Swathi",
  eventDescription = "We solicit your gracious virtual presence with family and friends on this auspicious occasion.",
  heroImageUrl,
}: TemplateProps) {
  const hero = heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-maroon-heritage") || ""
  const coupleParts = useMemo(() => splitCoupleTitle(eventTitle), [eventTitle])

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState({ days: 23, hours: 14, minutes: 35, seconds: 48 })

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="wedding-maroon-heritage-skin">
      {/* Top navigation */}
      <nav className="heritage-nav">
        <div className="heritage-nav-container">
          <div className="heritage-nav-logo">
            {coupleParts ? `${coupleParts.first} ♥ ${coupleParts.second}` : eventTitle}
          </div>
          <div className="heritage-nav-menu">
            <button type="button" className="heritage-nav-link heritage-nav-link-active" onClick={() => scrollToSection("home")}>Home</button>
            <button type="button" className="heritage-nav-link" onClick={() => scrollToSection("details")}>Events</button>
            <button type="button" className="heritage-nav-link" onClick={() => scrollToSection("gallery")}>Gallery</button>
            <button type="button" className="heritage-nav-link" onClick={() => scrollToSection("stream")}>Live</button>
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
              <img src={hero} alt={eventTitle} />
            </div>
          </div>

          {/* Right invitation details */}
          <div className="heritage-hero-info-card">
            <GaneshaLogo />
            <p className="heritage-shloka">|| श्री गणेशाय नमः ||</p>
            <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37] font-bold mb-4">शुभलेख</p>
            
            <div className="heritage-names">
              {coupleParts ? (
                <>
                  <span className="heritage-names-telugu font-sans block mb-1">
                    {coupleParts.first} రెడ్డి
                  </span>
                  <span className="heritage-names-weds">weds</span>
                  <span className="heritage-names-telugu font-sans block mt-1">
                    {coupleParts.second}
                  </span>
                  <span className="text-sm font-semibold tracking-wider text-zinc-500 block mt-4">
                    ({coupleParts.first} & {coupleParts.second})
                  </span>
                </>
              ) : (
                eventTitle
              )}
            </div>

            <div className="heritage-save-date-badge">Save The Date</div>
            <div className="heritage-event-date">15 June 2025 Sunday</div>
            
            {/* Countdown timer */}
            <div className="heritage-countdown-card">
              <p className="heritage-countdown-title">Big Day Is Coming</p>
              <div className="heritage-countdown-grid">
                <div className="heritage-countdown-item">
                  <span className="heritage-countdown-num">{String(timeLeft.days).padStart(2, "0")}</span>
                  <span className="heritage-countdown-label">Days</span>
                </div>
                <span className="heritage-countdown-sep">:</span>
                <div className="heritage-countdown-item">
                  <span className="heritage-countdown-num">{String(timeLeft.hours).padStart(2, "0")}</span>
                  <span className="heritage-countdown-label">Hrs</span>
                </div>
                <span className="heritage-countdown-sep">:</span>
                <div className="heritage-countdown-item">
                  <span className="heritage-countdown-num">{String(timeLeft.minutes).padStart(2, "0")}</span>
                  <span className="heritage-countdown-label">Mins</span>
                </div>
                <span className="heritage-countdown-sep">:</span>
                <div className="heritage-countdown-item">
                  <span className="heritage-countdown-num">{String(timeLeft.seconds).padStart(2, "0")}</span>
                  <span className="heritage-countdown-label">Secs</span>
                </div>
              </div>
              <button type="button" className="heritage-countdown-btn">Add to Calendar</button>
            </div>
          </div>
        </div>
      </section>

      {/* Videos Section */}
      <section id="stream" className="heritage-section bg-[#faf7f0]">
        <div className="heritage-container">
          <div className="heritage-section-heading">
            <h2>Watch Our Moments</h2>
            <p>Celebrate with us by watching the teaser and our live wedding streaming below</p>
          </div>

          <div className="heritage-video-grid">
            {/* Column 1: Pre-Wedding Teaser */}
            <div className="heritage-video-card">
              <h3 className="heritage-video-title">Pre Wedding Teaser</h3>
              <div className="heritage-video-frame">
                <iframe
                  title="Wedding teaser video"
                  src="https://www.youtube.com/embed/RJZbC9iLAqk?rel=0"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button type="button" className="heritage-video-btn">Watch on YouTube</button>
            </div>

            {/* Column 2: Live Stream */}
            <div className="heritage-video-card">
              <h3 className="heritage-video-title flex items-center justify-center gap-2">
                Our Live Streaming
                <span className="bg-red-600 text-[10px] text-white px-2 py-0.5 rounded font-sans tracking-wide">LIVE</span>
              </h3>
              <div className="heritage-video-frame bg-gradient-to-br from-[#4a0012] to-[#800020] flex items-center justify-center text-white">
                <div className="text-center p-4">
                  <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md mb-2 border border-white/20">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                  <p className="text-sm font-semibold text-amber-200">Stream Starts at Muhurat</p>
                </div>
              </div>
              <button type="button" className="heritage-video-btn" onClick={() => scrollToSection("stream")}>
                Watch Live on YouTube
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Wedding Details */}
      <section id="details" className="heritage-section bg-white">
        <div className="heritage-container">
          <div className="heritage-section-heading">
            <h2>Wedding Details</h2>
            <p>Important dates, timings, and location guidelines</p>
          </div>

          <div className="heritage-details-grid">
            {/* Card 1: Date */}
            <div className="heritage-detail-card">
              <div className="heritage-detail-icon-wrap">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="heritage-detail-label">Date</h3>
              <p className="heritage-detail-val font-semibold">Sunday</p>
              <p className="heritage-detail-val">15 June 2025</p>
              <p className="heritage-detail-val text-[#800020] font-bold mt-2">ముహూర్తం 11:23 AM</p>
            </div>

            {/* Card 2: Venue */}
            <div className="heritage-detail-card">
              <div className="heritage-detail-icon-wrap">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="heritage-detail-label">Venue</h3>
              <p className="heritage-detail-val font-semibold">Sri Venkateswara Kalyana Mandapam</p>
              <p className="heritage-detail-val">Kothapet, Siddipet,</p>
              <p className="heritage-detail-val">Telangana - 502103</p>
            </div>

            {/* Card 3: Reception */}
            <div className="heritage-detail-card">
              <div className="heritage-detail-icon-wrap">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="heritage-detail-label">Reception</h3>
              <p className="heritage-detail-val font-semibold">Sunday</p>
              <p className="heritage-detail-val">15 June 2025</p>
              <p className="heritage-detail-val text-[#800020] font-bold mt-2">సాయంత్రం 6:00 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Invite banner statement */}
      <div className="heritage-invite-banner">
        We warmly invite you to share our joy and bless the couple
      </div>

      {/* Footer */}
      <footer className="heritage-footer">
        <h2>Thank You</h2>
        <p>Template Preview · Maroon Heritage Wedding</p>
      </footer>

      {/* Bottom tabs for mobile */}
      <div className="heritage-mobile-tabs">
        <button type="button" className="heritage-tab-item heritage-tab-item-active" onClick={() => scrollToSection("home")}>
          <Home className="heritage-tab-icon" />
          <span className="heritage-tab-label">Home</span>
        </button>
        <button type="button" className="heritage-tab-item" onClick={() => scrollToSection("details")}>
          <Clock className="heritage-tab-icon" />
          <span className="heritage-tab-label">Events</span>
        </button>
        <button type="button" className="heritage-tab-item" onClick={() => scrollToSection("stream")}>
          <Play className="heritage-tab-icon" />
          <span className="heritage-tab-label">Live</span>
        </button>
        <button type="button" className="heritage-tab-item" onClick={() => scrollToSection("gallery")}>
          <ImageIcon className="heritage-tab-icon" />
          <span className="heritage-tab-label">Gallery</span>
        </button>
      </div>
    </div>
  )
}
