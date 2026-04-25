"use client"

import { useMemo } from "react"
import { ChevronDown, Heart, Play, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import "@/styles/wedding-papercut-template.css"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

const R2_BASE = "https://pub-c5ef5a9c919b4b45bb164fa5de4a9f9d.r2.dev"
const TOP_LINE = `${R2_BASE}/e7b73-top-line.png`
const BOTTOM_LINE = `${R2_BASE}/c1170-bottom-line.png`
const SAMPLE_GALLERY = [
  `${R2_BASE}/photo-1.jpg`,
  `${R2_BASE}/photo-7.jpg`,
  `${R2_BASE}/photo-2.jpg`,
  `${R2_BASE}/photo-3.jpg`,
  `${R2_BASE}/photo-8.jpg`,
  `${R2_BASE}/photo-4.jpg`,
]

function splitCoupleTitle(title: string): string {
  return title.replace(/\s*&\s*/g, " & ")
}

function AnimatedTitle({ title }: { title: string }) {
  return (
    <h1 className="papercut-title" aria-label={title}>
      {title.split("").map((char, i) =>
        char === " " ? (
          <span key={`space-${i}`} className="papercut-title-space" aria-hidden />
        ) : (
          <span key={`${char}-${i}`} className="papercut-title-char" style={{ animationDelay: `${i * 0.045}s` }}>
            {char}
          </span>
        ),
      )}
    </h1>
  )
}

export function WeddingPapercutTemplate({
  eventTitle = "Romeo & Juliet",
  eventDescription = "We solicit your gracious virtual presence with family and friends on this auspicious occasion.",
  heroImageUrl,
}: TemplateProps) {
  const hero = heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-papercut") || ""
  const displayTitle = useMemo(() => splitCoupleTitle(eventTitle), [eventTitle])

  const scrollToStream = () =>
    document.getElementById("papercut-preview-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="wedding-papercut-skin">
      <section
        className={hero ? "papercut-hero" : "papercut-hero papercut-hero-fallback"}
        style={hero ? { backgroundImage: `url(${hero})` } : undefined}
      >
        <div className="papercut-kenburns" aria-hidden />
        <div className="papercut-hero-content">
          <img src={TOP_LINE} alt="" className="papercut-ornament" />
          <AnimatedTitle title={displayTitle} />
          <p className="papercut-subtitle">We're Getting Married!</p>
          <button type="button" className="papercut-date-pill" onClick={scrollToStream}>
            10-06-2021
          </button>
          <img src={BOTTOM_LINE} alt="" className="papercut-ornament bottom mt-8" />
        </div>
        <button type="button" className="papercut-scroll" onClick={scrollToStream} aria-label="Scroll to live stream">
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      <section className="papercut-section alt">
        <div className="papercut-container">
          <div className="papercut-heading">
            <h2>Auspicious Time: 10:00 AM</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-white/90">{eventDescription}</p>
          </div>
        </div>
      </section>

      <div className="papercut-marquee">
        <div className="papercut-marquee-track">
          <span className="px-10">Live Streaming Starts at 12:00 am · Thank you!</span>
          <span className="px-10" aria-hidden>
            Live Streaming Starts at 12:00 am · Thank you!
          </span>
        </div>
      </div>

      <section id="papercut-preview-stream" className="papercut-section">
        <div className="papercut-container">
          <div className="papercut-heading">
            <h2>Watch Live</h2>
            <div className="after" />
          </div>
          <div className="papercut-card papercut-stream-frame">
            <div className="relative aspect-video overflow-hidden rounded-[1rem] bg-gradient-to-br from-[#2b111b] via-[#6f2045] to-[#fd1c56]">
              <div className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                <Radio className="h-3 w-3" />
                LIVE
              </div>
              <div className="absolute inset-0 grid place-items-center text-center text-white">
                <div>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
                    <Play className="h-10 w-10" fill="currentColor" />
                  </div>
                  <p className="mt-4 font-serif text-xl">Stream will appear here</p>
                </div>
              </div>
            </div>
            <p className="papercut-invitation">{eventDescription}</p>
          </div>
        </div>
      </section>

      <section className="papercut-section alt">
        <div className="papercut-container">
          <div className="papercut-heading">
            <h2>Watch Teaser</h2>
            <div className="after" />
          </div>
          <div className="papercut-teaser-frame">
            <iframe
              title="Wedding teaser"
              src="https://www.youtube.com/embed/RJZbC9iLAqk?rel=0"
              className="h-full w-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="papercut-gallery-wrap papercut-section">
        <div className="papercut-container">
          <div className="papercut-heading">
            <h2>Our Gallery</h2>
            <div className="after" />
          </div>
          <div className="papercut-photo-grid">
            {SAMPLE_GALLERY.map((src) => (
              <img key={src} src={src} alt="" />
            ))}
          </div>
        </div>
      </section>

      <section className="papercut-credit">
        <span className="papercut-preloader-mark">
          <Heart className="h-8 w-8" fill="currentColor" />
        </span>
        <p className="mt-5 font-serif text-2xl text-[#a93673]">Photography by Live Events</p>
      </section>

      <footer className="papercut-footer" style={hero ? { ["--papercut-footer-image" as string]: `url(${hero})` } : undefined}>
        <h2>Thank You</h2>
        <p className="mt-4 text-sm uppercase tracking-[0.32em] text-white/80">Template preview · Wedding Template 06</p>
      </footer>
    </div>
  )
}
