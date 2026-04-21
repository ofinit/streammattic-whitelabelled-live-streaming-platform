"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import "@/styles/the-heart-template.css"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/**
 * Marketing preview for tpl-wedding-the-heart ("The Heart" romantic wedding).
 * Uses the same BEM-style classes as Wedding Template 03 / watch-event-content.
 */
export function WeddingTheHeartTemplate({
  eventTitle = "Romeo & Juliet",
  eventDescription = "We're getting married — join us live with family and friends.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-the-heart") || ""

  return (
    <div className="the-heart-skin min-h-screen overflow-x-hidden">
      <div className="border-b border-rose-200/70 bg-white/90 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between font-sans">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2 text-[#96327d]">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="text-lg font-semibold text-[#881337]">The Heart Wedding</span>
          <span className="w-16" />
        </div>
      </div>

      <section
        className={hero ? "the-heart-welcome-section jarallax black-overly" : "the-heart-welcome-section jarallax black-overly the-heart-welcome-fallback"}
        style={hero ? { backgroundImage: `url(${hero})` } : undefined}
      >
        <div className="container mx-auto max-w-7xl px-4">
          <div className="the-heart-welcome-tbl">
            <div className="the-heart-welcome-tbl-c the-heart-hero-animate">
              <div className="the-heart-welcome-content">
                <h1>{eventTitle}</h1>
              </div>
              <h4 className="single-text">We&apos;re getting married</h4>
              <p className="mx-auto mt-4 max-w-xl font-sans text-base font-light leading-relaxed text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                {eventDescription}
              </p>
              <div className="the-heart-btn-holder">
                <Button variant="ghost" className="the-heart-btn pink-btn gap-2 font-sans">
                  <Play className="h-5 w-5" />
                  Watch Live Stream
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="the-heart-memoragble-days-section section-padding border-t border-rose-100/80 bg-white/80">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <div className="the-heart-section-heading">
            <h2>Watch Live</h2>
          </div>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-sm leading-relaxed text-[#96327d]">
            On the live event page, guests see the romantic hero, marquee tickers, stream, optional teaser and photo
            gallery — styled to match The Heart template (Great Vibes headings, Roboto body, #96327d accents).
          </p>
        </div>
      </section>
    </div>
  )
}
