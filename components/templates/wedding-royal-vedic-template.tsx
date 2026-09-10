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

  const groomName = eventTitle.split(/&|weds|and/i)[0]?.trim() || "Aarav"
  const brideName = eventTitle.split(/&|weds|and/i)[1]?.trim() || "Kavya"
  const monogram = `${groomName[0] || "A"}${brideName[0] || "K"}`

  const handleOpenEnvelope = () => {
    if (envelopeOpening || envelopeOpened) return
    setEnvelopeOpening(true)
    setTimeout(() => {
      setEnvelopeOpened(true)
    }, 750)
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
            onClick={() => setEnvelopeOpened(false)}
            className="border-[#c9a46a]/40 text-xs text-[#fdfbf7] hover:bg-[#c9a46a]/20"
          >
            Replay Envelope
          </Button>
        </div>
      </div>

      {/* Opening Envelope Overlay */}
      <div className={`vedic-envelope-overlay ${envelopeOpened ? "is-opened" : ""}`}>
        <div className="vedic-envelope-backdrop" />

        <div
          className={`vedic-envelope-stage ${envelopeOpening ? "opening" : ""}`}
          onClick={handleOpenEnvelope}
          role="button"
          tabIndex={0}
          aria-label="Open Invitation"
        >
          <div className="vedic-envelope-flap-top" />
          <div className="vedic-envelope-flap-bottom" />
          <div className="vedic-envelope-split" />

          <div className="vedic-envelope-content">
            <div className="pt-2">
              <div className="w-14 h-14 mx-auto rounded-full border border-[#c9a46a]/40 bg-[#fffaf2]/80 flex items-center justify-center shadow-sm">
                <span className="font-vedic-bodoni text-2xl font-semibold tracking-wider text-[#68401a]">
                  {monogram}
                </span>
              </div>
              <p className="font-vedic-cinzel text-[10px] tracking-[0.3em] uppercase text-[#8b6508] mt-3 font-semibold">
                — Royal Wedding Celebration —
              </p>
            </div>

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

            <div className="relative z-30 my-2">
              <div className="vedic-wax-seal">
                <svg viewBox="0 0 40 24" fill="currentColor" className="w-8 h-5 text-[#4a2e0c]">
                  <path d="M20,2 C22,7 28,9 34,7 C31,12 26,14 20,13 C14,14 9,12 6,7 C12,9 18,7 20,2 Z" />
                </svg>
              </div>
              <p className="vedic-tap-hint">Tap to Open</p>
            </div>

            <div className="pb-3 text-center">
              <p className="font-vedic-cinzel text-[9px] tracking-[0.28em] uppercase text-[#77543c] font-semibold">
                Invite you to celebrate our wedding day
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenEnvelope}
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

      {/* Hero Banner & Live Countdown */}
      <section className="vedic-hero">
        <img src={hero} alt="" className="vedic-hero-bg" />
        <div className="vedic-hero-vignette" />

        <div className="vedic-countdown-bar">
          <div className="vedic-countdown-item">
            <strong>12</strong>
            <span>Days</span>
          </div>
          <div className="vedic-countdown-item">
            <strong>08</strong>
            <span>Hours</span>
          </div>
          <div className="vedic-countdown-item">
            <strong>45</strong>
            <span>Mins</span>
          </div>
          <div className="vedic-countdown-item">
            <strong>20</strong>
            <span>Secs</span>
          </div>
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
