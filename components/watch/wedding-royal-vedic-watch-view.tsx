"use client"

import type { ReactNode } from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Volume2, VolumeX, Calendar, MapPin, Sparkles, Heart, ChevronDown, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import "@/styles/wedding-royal-vedic-template.css"

export interface WeddingRoyalVedicWatchViewProps {
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
  audioUrl?: string | null
  venueName?: string
  venueAddress?: string
}

function VedicCornerOrnament() {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full">
      <path d="M0,0 L0,70 C10,65 18,50 18,40 C18,30 25,25 35,18 C45,10 60,10 70,0 L0,0 Z" fill="currentColor" fillOpacity="0.08" />
      <path d="M0,0 C15,15 25,20 40,20 C50,20 60,10 70,0" />
      <path d="M0,0 C20,25 20,45 20,60 C20,65 10,70 0,70" />
      <circle cx="10" cy="10" r="2" fill="currentColor" />
      <circle cx="20" cy="20" r="2" fill="currentColor" />
      <circle cx="30" cy="30" r="2" fill="currentColor" />
    </svg>
  )
}

function VedicFiligree() {
  return (
    <svg viewBox="0 0 80 20" fill="none" stroke="currentColor" strokeWidth="1" className="vedic-filigree">
      <path d="M10,10 C20,2 25,18 40,10 C55,2 60,18 70,10" />
      <circle cx="40" cy="10" r="2.5" fill="currentColor" />
      <circle cx="25" cy="10" r="1.5" fill="currentColor" />
      <circle cx="55" cy="10" r="1.5" fill="currentColor" />
    </svg>
  )
}

function VedicLeafMotif() {
  return (
    <svg viewBox="0 0 40 24" fill="currentColor" className="w-8 h-5 text-[#c9a46a]">
      <path d="M20,2 C22,7 28,9 34,7 C31,12 26,14 20,13 C14,14 9,12 6,7 C12,9 18,7 20,2 Z" />
      <path d="M20,13 L20,22" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

export function WeddingRoyalVedicWatchView({
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
  audioUrl,
  venueName,
  venueAddress,
}: WeddingRoyalVedicWatchViewProps) {
  const [envelopeOpened, setEnvelopeOpened] = useState(false)
  const [envelopeOpening, setEnvelopeOpening] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const effectiveAudioUrl = audioUrl?.trim() || "/templates/vedic-heritage/music.mp3"

  // Couple names parsing
  const groomName = coupleParts && coupleParts.length > 0 ? coupleParts[0].trim() : coupleHero.split(/&|weds|and/i)[0]?.trim() || "The Groom"
  const brideName = coupleParts && coupleParts.length > 1 ? coupleParts[1].trim() : coupleHero.split(/&|weds|and/i)[1]?.trim() || "The Bride"

  const monogram = useMemo(() => {
    const g = groomName ? groomName[0].toUpperCase() : "A"
    const b = brideName ? brideName[0].toUpperCase() : "K"
    return `${g}${b}`
  }, [groomName, brideName])

  // Initialize audio element
  useEffect(() => {
    if (typeof window === "undefined") return
    const audio = new Audio(effectiveAudioUrl)
    audio.loop = true
    audio.volume = 0.45
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [effectiveAudioUrl])

  const handleOpenEnvelope = () => {
    if (envelopeOpening || envelopeOpened) return
    setEnvelopeOpening(true)

    // Attempt audio playback on user gesture
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true)
      }).catch(() => {
        setIsPlayingAudio(false)
      })
    }

    setTimeout(() => {
      setEnvelopeOpened(true)
    }, 750)
  }

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) return
    if (isPlayingAudio) {
      audioRef.current.pause()
      setIsPlayingAudio(false)
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true)
      }).catch(() => {
        setIsPlayingAudio(false)
      })
    }
  }

  // Falling leaves items
  const leaves = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      left: `${8 + (i * 12) % 84}%`,
      duration: `${9 + (i % 4) * 2}s`,
      delay: `${(i * 1.5) % 6}s`,
      drift: `${(i % 2 === 0 ? 1 : -1) * (30 + (i % 3) * 15)}px`,
    }))
  }, [])

  return (
    <div className="vedic-invitation-shell">
      {globalHeaderImage}

      {/* ----------------------------------------------------------------------
          1. Interactive Opening Envelope Overlay
          ---------------------------------------------------------------------- */}
      <div className={cn("vedic-envelope-overlay", envelopeOpened && "is-opened")}>
        <div className="vedic-envelope-backdrop" />

        <div
          className={cn("vedic-envelope-stage", envelopeOpening && "opening")}
          onClick={handleOpenEnvelope}
          role="button"
          tabIndex={0}
          aria-label="Open Wedding Invitation Envelope"
        >
          {/* Top & Bottom Flaps */}
          <div className="vedic-envelope-flap-top" />
          <div className="vedic-envelope-flap-bottom" />
          <div className="vedic-envelope-split" />

          {/* Internal Parchment Card Content */}
          <div className="vedic-envelope-content">
            {/* Top Monogram */}
            <div className="pt-2">
              <div className="w-14 h-14 mx-auto rounded-full border border-[#c9a46a]/40 bg-[#fffaf2]/80 flex items-center justify-center shadow-sm">
                <span className="font-vedic-bodoni text-2xl font-semibold tracking-wider text-[#68401a]">
                  {monogram}
                </span>
              </div>
              <p className="font-vedic-cinzel text-[10px] tracking-[0.3em] uppercase text-[#8b6508] mt-3 font-semibold">
                — {primaryDateFormatted || "Wedding Celebration"} —
              </p>
            </div>

            {/* Couple Names */}
            <div className="my-auto py-4">
              <p className="font-vedic-cinzel text-xs uppercase tracking-[0.25em] text-[#95601a] mb-2 font-medium">
                The Wedding of
              </p>
              <h1 className="font-vedic-bodoni text-[#2b120b]">{groomName}</h1>
              <div className="my-1 font-vedic-script text-3xl text-[#8b6508] leading-none">
                and
              </div>
              <h1 className="font-vedic-bodoni text-[#2b120b]">{brideName}</h1>
            </div>

            {/* Wax Seal in Flap Center */}
            <div className="relative z-30 my-2">
              <button
                type="button"
                className="vedic-wax-seal"
                onClick={(e) => {
                  e.stopPropagation()
                  handleOpenEnvelope()
                }}
                aria-label="Break Wax Seal & Open Invitation"
              >
                <VedicLeafMotif />
              </button>
              <p className="vedic-tap-hint">Tap to Open</p>
            </div>

            {/* Footer Text */}
            <div className="pb-3 text-center">
              <p className="font-vedic-cinzel text-[9px] tracking-[0.28em] uppercase text-[#77543c] font-semibold">
                Invite you to celebrate our wedding day
              </p>
              <div className="mt-2 flex justify-center opacity-70">
                <VedicFiligree />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Skip Button */}
        <button
          type="button"
          onClick={handleOpenEnvelope}
          className="absolute bottom-6 z-40 rounded-full border border-[#c9a46a]/40 bg-[#1a100b]/80 backdrop-blur-md px-5 py-2 text-xs font-medium tracking-wider text-[#fdfbf7] shadow-lg transition hover:bg-[#2b1911]"
        >
          Skip to Live Stream &rarr;
        </button>
      </div>

      {/* ----------------------------------------------------------------------
          2. Floating Audio Player Button
          ---------------------------------------------------------------------- */}
      <button
        type="button"
        onClick={toggleAudio}
        className="vedic-audio-btn"
        aria-label={isPlayingAudio ? "Mute Background Music" : "Play Background Music"}
        title={isPlayingAudio ? "Mute Music" : "Play Heritage Audio"}
      >
        {isPlayingAudio ? (
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

      {/* ----------------------------------------------------------------------
          3. Hero Banner & Countdown
          ---------------------------------------------------------------------- */}
      <section className="vedic-hero">
        <img
          src={heroImageUrl || "/templates/vedic-heritage/hero-desktop.webp"}
          alt="Royal Vedic Heritage"
          className="vedic-hero-bg"
        />
        <div className="vedic-hero-vignette" />

        {/* Falling Leaves / Petals Micro-animation */}
        <div className="vedic-falling-leaves" aria-hidden="true">
          {leaves.map((l) => (
            <span
              key={l.id}
              className="vedic-falling-leaf"
              style={{
                left: l.left,
                // @ts-ignore
                "--leaf-duration": l.duration,
                "--leaf-delay": l.delay,
                "--leaf-drift": l.drift,
              }}
            >
              <svg viewBox="0 0 24 16" fill="currentColor" className="w-full h-full">
                <path d="M12,0 C14,5 20,6 24,5 C21,9 17,11 12,10 C7,11 3,9 0,5 C4,6 10,5 12,0 Z" />
              </svg>
            </span>
          ))}
        </div>

        {/* Countdown Pill Container */}
        {showCountdown && (
          <div className="vedic-countdown-bar">
            <div className="vedic-countdown-item">
              <strong>{String(countdown.days).padStart(2, "0")}</strong>
              <span>Days</span>
            </div>
            <div className="vedic-countdown-item">
              <strong>{String(countdown.hours).padStart(2, "0")}</strong>
              <span>Hours</span>
            </div>
            <div className="vedic-countdown-item">
              <strong>{String(countdown.minutes).padStart(2, "0")}</strong>
              <span>Mins</span>
            </div>
            <div className="vedic-countdown-item">
              <strong>{String(countdown.seconds).padStart(2, "0")}</strong>
              <span>Secs</span>
            </div>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------------
          4. Live Stream Player Stage (The Centerpiece)
          ---------------------------------------------------------------------- */}
      <section className="vedic-stream-container">
        <div className="vedic-stream-card">
          {/* Ornate Corner Accents */}
          <div className="vedic-stream-corner vedic-stream-corner-tl"><VedicCornerOrnament /></div>
          <div className="vedic-stream-corner vedic-stream-corner-tr"><VedicCornerOrnament /></div>
          <div className="vedic-stream-corner vedic-stream-corner-bl"><VedicCornerOrnament /></div>
          <div className="vedic-stream-corner vedic-stream-corner-br"><VedicCornerOrnament /></div>

          {/* Stream Player Embed */}
          <div className="relative z-10 w-full rounded-xl overflow-hidden shadow-sm bg-black aspect-video flex items-center justify-center">
            {streamPlayer}
          </div>
        </div>

        {/* Live Chat or Details beneath the player */}
        {allowChat && showChat && liveChat && (
          <div className="mt-4 rounded-xl border border-[#c9a46a]/30 bg-[#fdfbf7]/90 p-4 shadow-sm backdrop-blur-sm">
            {liveChat}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------------
          5. With the Blessings of Our Families
          ---------------------------------------------------------------------- */}
      <section className="vedic-family-section">
        <img
          src="/templates/vedic-heritage/family-desktop.webp"
          alt=""
          className="vedic-family-watermark"
        />

        <div className="max-w-4xl mx-auto relative z-10">
          <p className="font-vedic-cinzel text-xs font-semibold tracking-[0.25em] uppercase text-[#8b6508]">
            With the Blessings of
          </p>
          <h2 className="font-vedic-bodoni text-3xl sm:text-4xl text-[#2b120b] mt-1">
            Our Families
          </h2>

          <div className="vedic-divider">
            <span className="vedic-divider-line" />
            <VedicFiligree />
            <span className="vedic-divider-line" />
          </div>

          <p className="font-vedic-cormorant text-lg sm:text-xl text-[#4a392f] italic max-w-xl mx-auto mb-10 leading-relaxed">
            "{invitationLine || eventDescription || "With joyful hearts, we invite you to celebrate our wedding and shower your blessings."}"
          </p>

          {/* Dual Column: Bride & Groom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative">
            {/* Groom Card */}
            <div className="vedic-card text-center">
              {couple1ImageUrl ? (
                <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-[#c9a46a] overflow-hidden shadow-md">
                  <img src={couple1ImageUrl} alt={groomName} className="w-full h-full object-cover" />
                </div>
              ) : null}
              <p className="font-vedic-cinzel text-[11px] uppercase tracking-[0.2em] text-[#8b6508] font-semibold">
                The Groom
              </p>
              <h3 className="font-vedic-bodoni text-2xl font-bold text-[#2a080c] mt-1">
                {groomName}
              </h3>
              <div className="my-2 opacity-60">
                <VedicFiligree />
              </div>
              <p className="text-xs text-[#796657] leading-relaxed">
                Beloved son of family & friends
              </p>
            </div>

            {/* Center Calligraphic '&' on Desktop */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 font-vedic-script text-4xl text-[#8b6508] bg-[#fdfbf7] w-12 h-12 rounded-full border border-[#c9a46a]/40 items-center justify-center shadow-sm">
              &amp;
            </div>

            {/* Bride Card */}
            <div className="vedic-card text-center">
              {couple2ImageUrl ? (
                <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-[#c9a46a] overflow-hidden shadow-md">
                  <img src={couple2ImageUrl} alt={brideName} className="w-full h-full object-cover" />
                </div>
              ) : null}
              <p className="font-vedic-cinzel text-[11px] uppercase tracking-[0.2em] text-[#8b6508] font-semibold">
                The Bride
              </p>
              <h3 className="font-vedic-bodoni text-2xl font-bold text-[#2a080c] mt-1">
                {brideName}
              </h3>
              <div className="my-2 opacity-60">
                <VedicFiligree />
              </div>
              <p className="text-xs text-[#796657] leading-relaxed">
                Beloved daughter of family & friends
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          6. Wedding Details & Timeline Functions
          ---------------------------------------------------------------------- */}
      <section className="py-12 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <p className="font-vedic-cinzel text-xs tracking-[0.25em] uppercase text-[#8b6508] font-semibold">
            Save the Date
          </p>
          <h2 className="font-vedic-bodoni text-3xl sm:text-4xl text-[#2b120b] mt-1">
            Wedding Details
          </h2>
          <div className="vedic-divider">
            <span className="vedic-divider-line" />
            <VedicFiligree />
            <span className="vedic-divider-line" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Card */}
          <div className="vedic-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-[#8b6508] mb-2">
                <Calendar className="w-5 h-5 shrink-0" />
                <span className="font-vedic-cinzel text-xs tracking-wider uppercase font-semibold">
                  Auspicious Date
                </span>
              </div>
              <h4 className="font-vedic-bodoni text-2xl font-bold text-[#2b120b]">
                {primaryDateFormatted || "Special Wedding Day"}
              </h4>
              <p className="font-vedic-cormorant italic text-sm text-[#796657] mt-1">
                Two hearts, one beautiful beginning.
              </p>
            </div>

            {/* Additional Dates / Functions Timeline if any */}
            {eventDates && eventDates.length > 0 ? (
              <div className="mt-6 pt-4 border-t border-[#c9a46a]/25 space-y-3">
                <p className="font-vedic-cinzel text-[10px] tracking-[0.2em] uppercase text-[#8b6508] font-semibold">
                  Wedding Functions
                </p>
                <div className="space-y-2">
                  {eventDates.map((d) => (
                    <div key={d.id} className="flex justify-between items-center text-xs py-1 border-b border-[#c9a46a]/15 last:border-none">
                      <span className="font-medium text-[#2b120b]">{d.label}</span>
                      <span className="text-[#8b6508] font-mono">{d.formatted}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* Venue Card */}
          <div className="vedic-card flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-[#8b6508] mb-2">
                <MapPin className="w-5 h-5 shrink-0" />
                <span className="font-vedic-cinzel text-xs tracking-wider uppercase font-semibold">
                  Wedding Venue
                </span>
              </div>
              <h4 className="font-vedic-bodoni text-2xl font-bold text-[#2b120b]">
                {venueName || "Sacred Celebration Pavilion"}
              </h4>
              <p className="text-xs text-[#4a392f] mt-1 leading-relaxed">
                {venueAddress || "Join us virtually live from anywhere around the globe."}
              </p>
            </div>

            {venueAddress ? (
              <div className="mt-6 pt-4">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="vedic-gold-btn w-full text-center"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Get Directions
                </a>
              </div>
            ) : (
              <div className="mt-6 pt-4">
                <span className="vedic-gold-btn w-full text-center pointer-events-none opacity-80">
                  <Sparkles className="w-3.5 h-3.5" />
                  Virtual Live Stream
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          7. Photo Gallery & Teaser Section
          ---------------------------------------------------------------------- */}
      {gallerySection ? (
        <section className="py-8 px-4 max-w-5xl mx-auto">
          {gallerySection}
        </section>
      ) : null}

      {teaserEmbed ? (
        <section className="py-8 px-4 max-w-4xl mx-auto">
          <div className="vedic-card">
            <h3 className="font-vedic-bodoni text-xl text-center text-[#2b120b] mb-4">
              Wedding Teaser &amp; Highlights
            </h3>
            <div className="aspect-video w-full rounded-lg overflow-hidden">
              <iframe
                src={teaserEmbed}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Wedding Teaser"
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* ----------------------------------------------------------------------
          8. Details & Host Information Panel
          ---------------------------------------------------------------------- */}
      <section className="py-8 px-4 max-w-4xl mx-auto">
        <div className="vedic-card">
          {detailsPanel}
        </div>
      </section>

      {/* ----------------------------------------------------------------------
          9. Photographer Credits & Footer
          ---------------------------------------------------------------------- */}
      {photographerCredit && (
        <footer className="py-8 px-4 text-center border-t border-[#c9a46a]/20 bg-[#faf6f0]">
          {photographerCredit}
        </footer>
      )}
    </div>
  )
}
