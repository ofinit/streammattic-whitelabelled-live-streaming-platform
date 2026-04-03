"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/**
 * Marketing preview for tpl-wedding-celestial (Celestial Dreams).
 * Live watch UX is implemented in watch-event-content (weddingCelestial skin).
 */
export function WeddingCelestialTemplate({
  eventTitle = "Orion & Stella",
  eventDescription = "Join us beneath the stars — a live ceremony written in the cosmos.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-celestial") || ""

  const previewStars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 2.5 + 1}px`,
        duration: `${Math.random() * 7 + 5}s`,
        delay: `${Math.random() * 10}s`,
      })),
    [],
  )

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0d17] font-celestial-sans text-zinc-100">
      <div className="border-b border-violet-600/35 bg-black/40 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm" className="gap-2 font-mono text-yellow-300/90">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-celestial-display text-lg tracking-widest text-yellow-400">✦ Celestial</span>
          <span className="w-16" />
        </div>
      </div>

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pt-8">
        {hero ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45"
            style={{ backgroundImage: `url(${hero})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d17]/30 via-[#1a1f3d]/90 to-[#0b0d17]" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(74,14,78,0.35)_0%,transparent_55%)]"
          aria-hidden
        />

        <div className="celestial-aurora-hero z-[1]" aria-hidden />
        <div
          className="celestial-nebula-blob z-[1] h-96 w-96 bg-purple-600 top-20 -left-20 opacity-80"
          style={{ animationDelay: "4s" }}
          aria-hidden
        />
        <div
          className="celestial-nebula-blob z-[1] h-80 w-80 bg-blue-600 bottom-24 -right-20 opacity-80"
          style={{ animationDelay: "10s" }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
          {previewStars.map((s) => (
            <span
              key={s.id}
              className="celestial-star-dot"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                animationDuration: s.duration,
                animationDelay: s.delay,
              }}
            />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden motion-reduce:hidden" aria-hidden>
          <span className="celestial-shooting-star celestial-shooting-star--track1" style={{ top: "6%", left: "4%" }} />
          <span className="celestial-shooting-star celestial-shooting-star--track2" style={{ top: "22%", left: "-2%" }} />
          <span className="celestial-shooting-star celestial-shooting-star--track3" style={{ top: "38%", left: "8%" }} />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="celestial-moon-disc mx-auto" aria-hidden />
          <h1 className="mt-8 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text font-celestial-display text-5xl font-semibold uppercase tracking-tight text-transparent md:text-7xl">
            {eventTitle}
          </h1>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.35em] text-zinc-500 md:text-sm">
            Written in the stars
          </p>
          <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
            {eventDescription}
          </p>

          <p className="mt-8 font-mono text-xs uppercase tracking-widest text-violet-400/90">
            August 12, 2026 · 8:00 PM
          </p>

          <Button className="mt-10 gap-2 rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-base text-white shadow-lg hover:shadow-[0_0_28px_rgba(147,51,234,0.4)]">
            <Play className="h-5 w-5" />
            Watch Live Stream
          </Button>
        </div>
      </section>

      <section className="border-t border-violet-600/25 bg-gradient-to-b from-[#0b0d17] to-[#1a1f3d]/80 px-4 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-celestial-display text-4xl text-white">Watch Live Stream</h2>
          <p className="mx-auto mt-4 max-w-2xl font-celestial-sans text-sm text-zinc-400">
            On the live page, guests get the starfield hero, glass cosmic stream frame, scanlines, “Cosmic Messages”
            chat, schedule, and a space-themed details panel — powered by the same wedding template fields.
          </p>
        </div>
      </section>
    </div>
  )
}
