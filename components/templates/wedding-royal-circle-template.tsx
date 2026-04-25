"use client"

import { useMemo } from "react"
import { ChevronDown, Play, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import "@/styles/wedding-royal-circle-template.css"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

const ROYAL_PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${(i * 37) % 100}%`,
  top: `${(i * 19) % 92}%`,
  size: `${8 + (i % 5) * 3}px`,
  duration: `${5 + (i % 7)}s`,
  delay: `${(i % 9) * 0.35}s`,
}))

function splitCoupleTitle(title: string): { first: string; second: string } | null {
  const m = title.match(/^(.+?)\s*[&+]\s*(.+)$/)
  if (!m) return null
  return { first: m[1].trim(), second: m[2].trim() }
}

function AnimatedKicker() {
  const text = "We're getting married"
  return (
    <p className="royal-kicker" aria-label={text}>
      {text.split("").map((char, i) => (
        <span key={`${char}-${i}`} style={{ animationDelay: `${0.18 + i * 0.045}s` }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </p>
  )
}

export function WeddingRoyalCircleTemplate({
  eventTitle = "Romeo & Juliet",
  eventDescription = "We solicit your gracious virtual presence with family and friends on this auspicious occasion.",
  heroImageUrl,
}: TemplateProps) {
  const hero = heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-royal-circle") || ""
  const coupleParts = useMemo(() => splitCoupleTitle(eventTitle), [eventTitle])

  const scrollToStream = () =>
    document.getElementById("royal-circle-preview-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })

  return (
    <div className="wedding-royal-circle-skin">
      <section
        className={hero ? "royal-hero" : "royal-hero royal-hero-fallback"}
        style={hero ? { backgroundImage: `url(${hero})` } : undefined}
      >
        <div className="royal-particles" aria-hidden>
          {ROYAL_PARTICLES.map((p) => (
            <span
              key={p.id}
              className="royal-particle"
              style={{
                ["--royal-left" as string]: p.left,
                ["--royal-top" as string]: p.top,
                ["--royal-size" as string]: p.size,
                ["--royal-duration" as string]: p.duration,
                ["--royal-delay" as string]: p.delay,
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="royal-hero-circle">
            <div className="royal-animated-circle" aria-hidden />
            <div className="royal-vector" aria-hidden />
            <div className="royal-circle-core">
              <h1 className="royal-title">
                {coupleParts ? (
                  <>
                    {coupleParts.first}
                    <br />
                    <span className="amp">&</span>
                    <br />
                    {coupleParts.second}
                  </>
                ) : (
                  eventTitle
                )}
              </h1>
            </div>
          </div>
          <AnimatedKicker />
          <p className="royal-date">Live ceremony · Watch from anywhere</p>
          <Button
            type="button"
            className="mt-8 rounded-full bg-white px-8 py-6 text-[#7b2234] shadow-xl hover:bg-white/95"
            onClick={scrollToStream}
          >
            <Radio className="mr-2 h-4 w-4" />
            Watch Live
          </Button>
        </div>

        <button type="button" className="royal-scroll" onClick={scrollToStream} aria-label="Scroll to live stream">
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      <div className="royal-marquee">
        <div className="royal-marquee-track">
          <span className="px-10 font-semibold">Live Streaming Starts at 12:00 am · Thank you!</span>
          <span className="px-10 font-semibold" aria-hidden>
            Live Streaming Starts at 12:00 am · Thank you!
          </span>
        </div>
      </div>

      <section id="royal-circle-preview-stream" className="royal-section">
        <div className="royal-container">
          <div className="royal-section-heading">
            <h2>Watch Live</h2>
            <p>{eventDescription}</p>
          </div>

          <div className="royal-card royal-stream-frame">
            <div className="relative aspect-video overflow-hidden rounded-[1rem] bg-gradient-to-br from-[#32131d] to-[#7b2234]">
              <div className="absolute left-4 top-4 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
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
            <p className="royal-invitation">{eventDescription}</p>
          </div>
        </div>
      </section>

      <section className="royal-section bg-white/60">
        <div className="royal-container">
          <div className="royal-section-heading">
            <h2>Watch Teaser</h2>
          </div>
          <div className="royal-teaser-frame">
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

      <footer className="royal-footer" style={hero ? { ["--royal-footer-image" as string]: `url(${hero})` } : undefined}>
        <h2>Thank You</h2>
        <p className="mt-4 text-sm uppercase tracking-[0.32em] text-white/80">Template preview · Wedding Template 05</p>
      </footer>
    </div>
  )
}
