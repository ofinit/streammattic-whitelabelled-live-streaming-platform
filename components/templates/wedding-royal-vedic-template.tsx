"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Play, Volume2, VolumeX, Calendar, MapPin, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import "@/styles/wedding-royal-vedic-template.css"

interface TemplateProps {
  eventTitle?: string
  eventSubtitle?: string
  eventDescription?: string
  heroImageUrl?: string
  couple1ImageUrl?: string | null
  couple2ImageUrl?: string | null
  photographerLogoUrl?: string | null
  countdown?: { days: number; hours: number; minutes: number; seconds: number }
}

function VedicPortraitFrame({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 mx-auto mb-4 flex items-center justify-center">
      {/* Warm Ambient Gold Glow */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-[#f3db9f] via-[#d4a853] to-[#8c6218] opacity-35 blur-md pointer-events-none" />

      {/* Ornate Gold Filigree Halo SVG Ring */}
      <svg
        viewBox="0 0 160 160"
        className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] text-[#c9a46a] pointer-events-none"
        fill="none"
      >
        <circle cx="80" cy="80" r="76" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3.5" opacity="0.85" />
        <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
        {/* Cardinal Gold Jewels */}
        <circle cx="80" cy="4" r="3" fill="#8b6508" stroke="#fdfbf7" strokeWidth="1" />
        <circle cx="80" cy="156" r="3" fill="#8b6508" stroke="#fdfbf7" strokeWidth="1" />
        <circle cx="4" cy="80" r="3" fill="#8b6508" stroke="#fdfbf7" strokeWidth="1" />
        <circle cx="156" cy="80" r="3" fill="#8b6508" stroke="#fdfbf7" strokeWidth="1" />
        {/* Diagonal Minor Accent Beads */}
        <circle cx="26" cy="26" r="1.8" fill="#8b6508" opacity="0.75" />
        <circle cx="134" cy="26" r="1.8" fill="#8b6508" opacity="0.75" />
        <circle cx="26" cy="134" r="1.8" fill="#8b6508" opacity="0.75" />
        <circle cx="134" cy="134" r="1.8" fill="#8b6508" opacity="0.75" />
      </svg>

      {/* Triple Layered Metallic Royal Frame */}
      <div className="relative w-full h-full rounded-full p-[3px] bg-gradient-to-tr from-[#8a5b12] via-[#f7df9e] via-40% to-[#7a4c0a] shadow-[0_8px_24px_rgba(70,40,15,0.22)]">
        <div className="w-full h-full rounded-full p-[2px] bg-[#fffaf1]">
          <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-br from-[#c99a42] to-[#7c5011]">
            <div className="w-full h-full rounded-full overflow-hidden relative shadow-[inset_0_2px_6px_rgba(0,0,0,0.25)] bg-[#f7f0e3]">
              <img
                src={src}
                alt={alt}
                className="w-full h-full object-cover rounded-full transform transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WeddingRoyalVedicTemplate({
  eventTitle = "Aarav weds Kavya",
  eventSubtitle,
  eventDescription = "With the blessings of our families, we invite you to celebrate our sacred wedding.",
  heroImageUrl,
  couple1ImageUrl,
  couple2ImageUrl,
  photographerLogoUrl,
  countdown,
}: TemplateProps) {
  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const [envelopeOpening, setEnvelopeOpening] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)

  const hero =
    heroImageUrl?.trim() ||
    getDefaultTemplateHeroBackdropUrl("tpl-wedding-royal-vedic") ||
    "/templates/vedic-heritage/hero-desktop.webp"

  const groomName = eventTitle.split(/&|weds|and/i)[0]?.trim() || "Aarav Mehta"
  const brideName = eventTitle.split(/&|weds|and/i)[1]?.trim() || "Kavya Rao"
  const groomInitial = groomName ? groomName[0] : "A"
  const groomRest = groomName ? groomName.slice(1) : "arav Mehta"
  const brideInitial = brideName ? brideName[0] : "K"
  const brideRest = brideName ? brideName.slice(1) : "avya Rao"
  const monogram = `${groomName[0] || "A"}${brideName[0] || "K"}`

  const handleOpenEnvelope = () => {
    if (envelopeOpening || envelopeOpened) return
    setEnvelopeOpening(true)
    setTimeout(() => {
      setEnvelopeOpened(true)
    }, 1900)
  }

  return (
    <div className="vedic-invitation-shell">
      {/* Top Admin / Navigation Bar */}
      <div className="sticky top-0 z-50 border-b border-[#c9a46a]/40 bg-[#1e130c]/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2 text-[#fdfbf7] hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-vedic-cinzel text-sm tracking-[0.2em] uppercase text-[#e6c075]">
            Royal Vedic Heritage Wedding
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEnvelopeOpened(false)
              setEnvelopeOpening(false)
            }}
            className="border-[#c9a46a]/40 text-xs text-[#fdfbf7] hover:bg-[#c9a46a]/20"
          >
            Replay Envelope
          </Button>
        </div>
      </div>

      {/* Opening Envelope Overlay (Vedic Heritage Intro) */}
      <div
        className={`intro-splash fixed inset-0 z-50 flex w-full appearance-none items-center justify-center overflow-hidden border-0 p-0 text-[#3B281A] select-none cursor-pointer ${
          envelopeOpened ? "is-opened" : ""
        }`}
        style={{
          // @ts-ignore
          "--intro-bg": `url('${hero}')`,
        }}
        onClick={handleOpenEnvelope}
        role="button"
        tabIndex={0}
        aria-label="Open Invitation"
      >
        <div
          className="intro-envelope-stage relative w-full h-full flex flex-col justify-between items-center bg-transparent overflow-hidden shadow-2xl"
          style={{ perspective: "1400px" }}
        >
          {/* Layer 1: Split Envelope with Center Wax Seal - Fades out on open */}
          <div
            className="intro-envelope-art absolute inset-0 z-20 pointer-events-none bg-cover bg-center"
            style={{
              backgroundImage: "url('/templates/vedic-heritage/envelope-split.webp')",
              opacity: envelopeOpening ? 0 : 1,
              transition: "opacity 0.14s ease-out" + (envelopeOpening ? " 0.06s" : ""),
              willChange: "opacity",
            }}
          />

          {/* Layer 2: Top Flap with upper half seal - Slides up on open */}
          <div
            className="intro-envelope-art absolute inset-0 z-10 pointer-events-none bg-cover bg-center transform-gpu"
            style={{
              backgroundImage: "url('/templates/vedic-heritage/envelope-top-v.webp')",
              transform: envelopeOpening ? "translateY(-108%)" : "translateY(0%)",
              transition: envelopeOpening ? "transform 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.08s" : "none",
              willChange: "transform",
            }}
          />

          {/* Layer 3: Bottom Flap - Slides down on open */}
          <div
            className="intro-envelope-art absolute inset-0 z-10 pointer-events-none bg-cover bg-center transform-gpu"
            style={{
              backgroundImage: "url('/templates/vedic-heritage/envelope-bottom-v.webp')",
              transform: envelopeOpening ? "translateY(108%)" : "translateY(0%)",
              transition: envelopeOpening ? "transform 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.08s" : "none",
              willChange: "transform",
            }}
          />

          {/* Layer 4: Warm Wash */}
          <div
            className="intro-warm-wash absolute inset-0 z-[25] pointer-events-none"
            style={{
              opacity: envelopeOpening ? 0 : 1,
              transition: "opacity 0.16s ease-out",
            }}
          />

          {/* Animated Blinking Wax Seal "Tap To Open" Text */}
          <div
            className="intro-seal-tap-badge"
            style={{
              opacity: envelopeOpening ? 0 : 1,
              transition: "opacity 0.18s ease-out",
            }}
          >
            <div className="intro-seal-tap-text">
              <span>TAP</span>
              <span>TO</span>
              <span>OPEN</span>
            </div>
          </div>

          {/* Layer 5: Envelope Content - z-30 Above flaps with transparent background */}
          <div className="intro-envelope-content relative z-30 w-full h-full pt-10 pb-6 px-6 flex flex-col justify-between items-center text-center pointer-events-none bg-transparent">
            {/* Top Block: Monogram, Date, Names - Slides up on open */}
            <div
              className="flex flex-col items-center space-y-3 pt-1 origin-top w-full transform-gpu"
              style={{
                transform: envelopeOpening ? "translateY(-108vh)" : "translateY(0)",
                transition: envelopeOpening ? "transform 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.08s" : "none",
                willChange: "transform, opacity",
              }}
            >
              {/* Monogram / Photographer Logo */}
              {photographerLogoUrl ? (
                <div className="flex items-center justify-center pt-1 pb-1 z-30 pointer-events-none transform-gpu">
                  <img
                    src={photographerLogoUrl}
                    alt="Photographer Logo"
                    className="intro-monogram h-14 sm:h-16 w-auto max-w-[140px] object-contain"
                  />
                </div>
              ) : null}

              {/* Date with Gold flanking dividers & Couple Names */}
              <div className="flex flex-col items-center space-y-3 w-full transform-gpu">
                <div className="flex items-center justify-center gap-2 sm:gap-3 w-full px-2 max-w-full">
                  <span className="w-4 sm:w-6 h-px bg-[#B77D27]/65 shrink-0" />
                  <span className="font-cinzel text-[10.5px] sm:text-xs tracking-[0.22em] sm:tracking-[0.3em] text-[#95601A] uppercase font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis">
                    14 FEB 2027
                  </span>
                  <span className="w-4 sm:w-6 h-px bg-[#B77D27]/65 shrink-0" />
                </div>

                <div className="flex flex-col items-center justify-center pt-2 w-full">
                  <h1 className="font-cormorant text-4xl sm:text-5xl md:text-6xl text-[#68401A] font-semibold tracking-[0.02em] leading-tight text-center w-full pb-1">
                    {groomName}
                  </h1>
                  <div className="w-full flex justify-center items-center my-1 sm:my-1.5">
                    <span className="font-cinzel text-[11px] sm:text-xs tracking-[0.34em] text-[#A56B18] font-semibold uppercase">
                      And
                    </span>
                  </div>
                  <h1 className="font-cormorant text-4xl sm:text-5xl md:text-6xl text-[#68401A] font-semibold tracking-[0.02em] leading-tight text-center w-full pt-0.5">
                    {brideName}
                  </h1>
                </div>
              </div>
            </div>

            {/* Bottom Block: Subtitle & Botanical Leaf - Slides down on open */}
            <div
              className="flex flex-col items-center pb-16 sm:pb-20 origin-bottom w-full transform-gpu"
              style={{
                transform: envelopeOpening ? "translateY(108vh)" : "translateY(0)",
                transition: envelopeOpening ? "transform 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.08s" : "none",
                willChange: "transform, opacity",
              }}
            >
              <div className="space-y-1 text-center px-4 max-w-sm">
                <p className="font-cinzel text-[11px] sm:text-xs md:text-sm tracking-[0.22em] sm:tracking-[0.28em] text-[#845217] uppercase font-semibold leading-relaxed">
                  {eventSubtitle?.trim() || "Invite you to celebrate our wedding day"}
                </p>
              </div>

              <div className="mt-2.5 flex items-center justify-center">
                <img
                  src="/templates/vedic-heritage/leaf.webp"
                  alt="Botanical Leaf Accent"
                  className="intro-leaf w-24 sm:w-32 h-auto object-contain opacity-90"
                />
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* Floating Audio Button */}
      <button
        type="button"
        onClick={() => setIsAudioMuted(!isAudioMuted)}
        className="vedic-audio-btn"
        aria-label="Toggle Audio"
      >
        {!isAudioMuted ? (
          <div className="vedic-audio-equalizer">
            <span className="vedic-audio-bar playing" />
            <span className="vedic-audio-bar playing" />
            <span className="vedic-audio-bar playing" />
            <span className="vedic-audio-bar playing" />
          </div>
        ) : (
          <VolumeX className="w-4 h-4 text-[#8b6508]" />
        )}
      </button>

      {/* Hero Banner: Monogram, Sacred Quote, Couple Names & Countdown */}
      <section className="invitation-hero" aria-label={`Wedding celebration of ${groomName} and ${brideName}`}>
        {/* Vedic Temple Panorama backdrop */}
        {(() => {
          const isDefaultHero =
            !heroImageUrl ||
            heroImageUrl === "/templates/vedic-heritage/hero-desktop.webp" ||
            heroImageUrl === "/templates/vedic-heritage/hero-mobile.webp"
          const desktopHeroSrc = isDefaultHero ? "/templates/vedic-heritage/hero-desktop.webp" : hero
          const mobileHeroSrc = isDefaultHero ? "/templates/vedic-heritage/hero-mobile.webp" : hero
          return (
            <picture>
              <source media="(min-width: 900px)" srcSet={desktopHeroSrc} />
              <img
                src={mobileHeroSrc}
                alt="Royal Vedic Temple"
                className="invitation-hero__photo"
                fetchPriority="high"
                loading="eager"
                decoding="sync"
              />
            </picture>
          )
        })()}

        {/* Falling Leaves / Petals Micro-animation */}
        <div className="hero-falling-leaves is-active" aria-hidden="true">
          {[
            { left: "7%", delay: "0s", duration: "11s", drift: "36px", scale: 0.72 },
            { left: "16%", delay: "-5s", duration: "14s", drift: "-28px", scale: 0.5 },
            { left: "27%", delay: "-9s", duration: "12s", drift: "44px", scale: 0.62 },
            { left: "39%", delay: "-2s", duration: "15s", drift: "-38px", scale: 0.46 },
            { left: "51%", delay: "-7s", duration: "13s", drift: "32px", scale: 0.66 },
            { left: "63%", delay: "-11s", duration: "16s", drift: "-42px", scale: 0.52 },
            { left: "74%", delay: "-4s", duration: "12s", drift: "38px", scale: 0.7 },
            { left: "86%", delay: "-8s", duration: "15s", drift: "-30px", scale: 0.48 },
            { left: "94%", delay: "-1s", duration: "13s", drift: "24px", scale: 0.6 },
          ].map((l, idx) => (
            <i
              key={idx}
              style={{
                // @ts-ignore
                "--leaf-left": l.left,
                "--leaf-delay": l.delay,
                "--leaf-duration": l.duration,
                "--leaf-drift": l.drift,
                "--leaf-scale": l.scale,
              }}
            >
              <svg viewBox="0 0 30 22">
                <path className="hero-leaf__body" d="M3 18C6 7 14 2 26 3C24 12 17 19 6 19C5 19 4 19 3 18Z" fill="currentColor" fillOpacity="0.85" />
                <path className="hero-leaf__vein" d="M3 19C9 14 15 10 24 5M10 14L9 9M15 11L15 6M11 14L17 16M16 10L21 12" stroke="currentColor" strokeWidth="0.8" fill="none" />
              </svg>
            </i>
          ))}
        </div>

        {/* Center Hero Heading: Photographer Logo (if provided), Couple Names */}
        <header className="invitation-hero__heading min-h-[calc(100vh-max(4.5rem,8vh))] min-h-[calc(100svh-max(4.5rem,8vh))] md:min-h-0">
          {photographerLogoUrl ? (
            <img
              src={photographerLogoUrl}
              alt="Photographer Logo"
              className="invitation-hero__monogram max-h-16 sm:max-h-20 w-auto object-contain"
              loading="eager"
            />
          ) : null}

          <h1 className="invitation-hero__name invitation-hero__groom">
            <span className="hero-name__initial">{groomInitial}</span>
            {groomRest}
          </h1>

          <div className="invitation-hero__ampersand">
            Weds
          </div>

          <h2 className="invitation-hero__name invitation-hero__bride">
            <span className="hero-name__initial">{brideInitial}</span>
            {brideRest}
          </h2>

          {/* Event Subtitle right below Raju Weds Avantika */}
          {eventSubtitle ? (
            <p
              className={cn(
                "font-vedic-cinzel text-xs sm:text-sm uppercase tracking-[0.25em] text-[#8b6508] font-semibold mt-4 text-center max-w-xl mx-auto",
                countdown ? "mb-4 md:mb-16" : "mb-6"
              )}
            >
              {eventSubtitle}
            </p>
          ) : null}

          {/* Desktop Countdown (inside header, hidden on mobile) */}
          <div className="hero-countdown hero-countdown--desktop hidden md:grid" aria-label="Time remaining until the wedding day">
            {[
              ["Days", Math.max(0, countdown?.days ?? 0)],
              ["Hours", Math.max(0, countdown?.hours ?? 0)],
              ["Mins", Math.max(0, countdown?.minutes ?? 0)],
              ["Secs", Math.max(0, countdown?.seconds ?? 0)],
            ].map(([label, value]) => (
              <div key={label} className="hero-countdown__item">
                <strong>{String(value).padStart(2, "0")}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Mobile Countdown (positioned in courtyard red-box area, hidden on desktop) */}
        <div className="hero-countdown hero-countdown--mobile md:hidden" aria-label="Time remaining until the wedding day">
          {[
            ["Days", Math.max(0, countdown?.days ?? 0)],
            ["Hours", Math.max(0, countdown?.hours ?? 0)],
            ["Mins", Math.max(0, countdown?.minutes ?? 0)],
            ["Secs", Math.max(0, countdown?.seconds ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="hero-countdown__item">
              <strong>{String(value).padStart(2, "0")}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Stream Video Player Mockup (Inside the Temple Courtyard) */}
        <div className="vedic-stream-container">
          <div className="vedic-stream-card">
            <div className="relative z-10 w-full rounded-xl overflow-hidden shadow-sm bg-neutral-900 aspect-video flex flex-col items-center justify-center text-white">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#ba8933] flex items-center justify-center shadow-lg mb-3">
                <Play className="w-7 h-7 text-stone-900 ml-1 fill-stone-900" />
              </div>
              <p className="font-vedic-cinzel text-sm uppercase tracking-widest text-[#e6c075]">
                Live Stream Broadcast
              </p>
              <span className="text-xs text-stone-300 mt-1">
                Crystal Clear HD Video &bull; Multi-Camera View
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* With the Blessings of Our Families */}
      <section className="vedic-family-section">
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="font-vedic-cinzel text-xs font-semibold tracking-[0.25em] uppercase text-[#8b6508]">
            With the Blessings of
          </p>
          <h2 className="font-vedic-bodoni text-3xl sm:text-4xl text-[#2b120b] mt-1">
            Our Families
          </h2>

          <div className="vedic-divider">
            <span className="vedic-divider-line" />
            <span className="vedic-divider-emblem">&bull;</span>
            <span className="vedic-divider-line" />
          </div>

          <p className="font-vedic-cormorant text-lg sm:text-xl text-[#4a392f] italic max-w-xl mx-auto mb-10 leading-relaxed">
            "{eventDescription}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative">
            <div className="vedic-card text-center p-6 sm:p-8">
              {couple1ImageUrl ? (
                <VedicPortraitFrame src={couple1ImageUrl} alt={groomName} />
              ) : null}
              <h3 className="font-vedic-bodoni text-2xl sm:text-3xl font-bold text-[#2a080c]">
                {groomName}
              </h3>
            </div>

            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 font-vedic-script text-4xl sm:text-5xl text-[#8b6508] items-center justify-center pointer-events-none select-none">
              &amp;
            </div>

            <div className="vedic-card text-center p-6 sm:p-8">
              {couple2ImageUrl ? (
                <VedicPortraitFrame src={couple2ImageUrl} alt={brideName} />
              ) : null}
              <h3 className="font-vedic-bodoni text-2xl sm:text-3xl font-bold text-[#2a080c]">
                {brideName}
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Wedding Details */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="max-w-xl mx-auto">
          <div className="vedic-card text-center">
            <div className="flex items-center justify-center gap-3 text-[#8b6508] mb-2">
              <Calendar className="w-5 h-5 shrink-0" />
              <span className="font-vedic-cinzel text-xs tracking-wider uppercase font-semibold">
                Auspicious Date
              </span>
            </div>
            <h4 className="font-vedic-bodoni text-2xl font-bold text-[#2b120b]">
              Sunday, 14 February 2027
            </h4>
            <p className="font-vedic-cormorant italic text-sm text-[#796657] mt-1">
              Muhurtham Ceremony: 9:30 AM – 11:30 AM
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
