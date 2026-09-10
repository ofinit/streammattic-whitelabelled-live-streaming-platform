"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Play, Volume2, VolumeX, Calendar, MapPin, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import "@/styles/wedding-royal-vedic-template.css"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

export function WeddingRoyalVedicTemplate({
  eventTitle = "Aarav weds Kavya",
  eventDescription = "With the blessings of our families, we invite you to celebrate our sacred wedding.",
  heroImageUrl,
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
              {/* Monogram Logo */}
              <div className="flex items-center justify-center pt-1 pb-1 z-30 pointer-events-none transform-gpu">
                <img
                  src="/templates/vedic-heritage/logo.webp"
                  alt="Monogram Logo"
                  className="intro-monogram h-16 sm:h-20 w-auto object-contain"
                />
              </div>

              {/* Date with Gold flanking dividers & Couple Names */}
              <div className="flex flex-col items-center space-y-3 w-full transform-gpu">
                <div className="flex items-center justify-center gap-3 w-full px-4">
                  <span className="w-6 h-px bg-[#B77D27]/65" />
                  <span className="font-cinzel text-xs sm:text-sm tracking-[0.42em] text-[#95601A] uppercase font-bold">
                    14 FEB 2027
                  </span>
                  <span className="w-6 h-px bg-[#B77D27]/65" />
                </div>

                <div className="flex flex-col items-center justify-center space-y-0.5 pt-2 w-full">
                  <h1 className="font-cormorant text-5xl sm:text-6xl text-[#68401A] font-semibold tracking-[0.015em] leading-none text-center w-full">
                    {groomName}
                  </h1>
                  <div className="w-full flex justify-center items-center -my-1">
                    <span className="font-cinzel text-[10px] sm:text-xs tracking-[0.34em] text-[#A56B18] font-semibold uppercase">
                      And
                    </span>
                  </div>
                  <h1 className="font-cormorant text-5xl sm:text-6xl text-[#68401A] font-semibold tracking-[0.015em] leading-none text-center w-full">
                    {brideName}
                  </h1>
                </div>
              </div>
            </div>

            {/* Bottom Block: Invitation Line & Botanical Leaf - Slides down on open */}
            <div
              className="flex flex-col items-center pb-6 sm:pb-8 origin-bottom w-full transform-gpu"
              style={{
                transform: envelopeOpening ? "translateY(108vh)" : "translateY(0)",
                transition: envelopeOpening ? "transform 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.08s" : "none",
                willChange: "transform, opacity",
              }}
            >
              <div className="space-y-1 text-center">
                <p className="font-cormorant text-sm sm:text-base tracking-[0.32em] text-[#95601A] uppercase font-bold">
                  INVITE YOU TO CELEBRATE
                </p>
                <p className="font-cinzel text-[10px] sm:text-[11px] tracking-[0.32em] text-[#59402E] uppercase font-semibold">
                  OUR WEDDING DAY
                </p>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-center">
                <img
                  src="/templates/vedic-heritage/leaf.webp"
                  alt="Botanical Leaf Accent"
                  className="intro-leaf w-28 sm:w-36 h-auto object-contain opacity-90"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setEnvelopeOpened(true)
          }}
          className="absolute bottom-6 z-40 rounded-full border border-[#c9a46a]/40 bg-[#1a100b]/80 backdrop-blur-md px-5 py-2 text-xs font-medium tracking-wider text-[#fdfbf7] shadow-lg transition hover:bg-[#2b1911]"
        >
          Skip to Live Stream &rarr;
        </button>
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
        <picture>
          <source media="(min-width: 900px)" srcSet={hero} />
          <img
            src={hero}
            alt="Royal Vedic Temple"
            className="invitation-hero__photo"
            fetchPriority="high"
            loading="eager"
            decoding="sync"
          />
        </picture>

        {/* Ornate Inset Double Gold Frame */}
        <div className="invitation-hero__frame" aria-hidden="true" />

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

        {/* Center Hero Heading: Monogram, Sacred Knot Quote, Couple Names */}
        <header className="invitation-hero__heading">
          <img
            src="/templates/vedic-heritage/logo.webp"
            alt="Royal Vedic Monogram"
            className="invitation-hero__monogram"
            loading="eager"
          />

          <p className="invitation-hero__quote">
            “Three sacred knots, one for love,<br />
            one for trust, and one for a lifetime<br />
            of togetherness.”
          </p>

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

          {/* Mobile Countdown */}
          <div className="hero-countdown hero-countdown--mobile" aria-label="Time remaining until the wedding day">
            {[
              ["Days", 157],
              ["Hours", 4],
              ["Mins", 30],
              ["Secs", 42],
            ].map(([label, value]) => (
              <div key={label} className="hero-countdown__item">
                <strong>{String(value).padStart(2, "0")}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Desktop Countdown (positioned at bottom center above temple courtyard) */}
        <div className="hero-countdown hero-countdown--desktop" aria-label="Time remaining until the wedding day">
          {[
            ["Days", 157],
            ["Hours", 4],
            ["Mins", 30],
            ["Secs", 42],
          ].map(([label, value]) => (
            <div key={label} className="hero-countdown__item">
              <strong>{String(value).padStart(2, "0")}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stream Video Player Mockup */}
      <section className="vedic-stream-container">
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
            <div className="vedic-card text-center">
              <p className="font-vedic-cinzel text-[11px] uppercase tracking-[0.2em] text-[#8b6508] font-semibold">
                The Groom
              </p>
              <h3 className="font-vedic-bodoni text-2xl font-bold text-[#2a080c] mt-1">
                {groomName}
              </h3>
              <p className="text-xs text-[#796657] mt-2">
                Beloved son of family &amp; friends
              </p>
            </div>

            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 font-vedic-script text-4xl text-[#8b6508] bg-[#fdfbf7] w-12 h-12 rounded-full border border-[#c9a46a]/40 items-center justify-center shadow-sm">
              &amp;
            </div>

            <div className="vedic-card text-center">
              <p className="font-vedic-cinzel text-[11px] uppercase tracking-[0.2em] text-[#8b6508] font-semibold">
                The Bride
              </p>
              <h3 className="font-vedic-bodoni text-2xl font-bold text-[#2a080c] mt-1">
                {brideName}
              </h3>
              <p className="text-xs text-[#796657] mt-2">
                Beloved daughter of family &amp; friends
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wedding Details */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="vedic-card">
            <div className="flex items-center gap-3 text-[#8b6508] mb-2">
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

          <div className="vedic-card">
            <div className="flex items-center gap-3 text-[#8b6508] mb-2">
              <MapPin className="w-5 h-5 shrink-0" />
              <span className="font-vedic-cinzel text-xs tracking-wider uppercase font-semibold">
                Wedding Venue
              </span>
            </div>
            <h4 className="font-vedic-bodoni text-2xl font-bold text-[#2b120b]">
              The Grand Heritage Palace
            </h4>
            <p className="text-xs text-[#4a392f] mt-1 leading-relaxed">
              Palace Road, Bengaluru, Karnataka &bull; Virtual Live Stream
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
