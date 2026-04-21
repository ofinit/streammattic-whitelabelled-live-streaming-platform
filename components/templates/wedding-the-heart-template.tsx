"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
}

/**
 * Marketing preview for tpl-wedding-the-heart ("The Heart" romantic wedding).
 * Live watch UX is implemented in watch-event-content (weddingTheHeart skin).
 */
export function WeddingTheHeartTemplate({
  eventTitle = "Romeo & Juliet",
  eventDescription = "We're getting married — join us live with family and friends.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-the-heart") || ""

  return (
    <div className="min-h-screen overflow-x-hidden bg-rose-50 font-serif text-rose-950">
      <div className="border-b border-rose-200/70 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2 text-rose-900">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="text-lg font-semibold text-rose-900">The Heart Wedding</span>
          <span className="w-16" />
        </div>
      </div>

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pt-8">
        {hero ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${hero})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 mx-auto max-w-3xl text-center [text-shadow:0_2px_12px_rgba(0,0,0,0.55)]">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-rose-100/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
            Wedding celebration
          </p>
          <h1 className="mt-4 text-5xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] md:text-7xl">
            {eventTitle}
          </h1>
          <p className="mt-6 text-lg text-rose-50/95 md:text-xl">We&apos;re getting married</p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            {eventDescription}
          </p>

          <Button className="mt-10 gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-6 text-base text-white shadow-lg hover:from-rose-600 hover:to-pink-600">
            <Play className="h-5 w-5" />
            Watch Live Stream
          </Button>
        </div>
      </section>

      <section className="border-t border-rose-100 bg-white/70 px-4 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mt-2 text-4xl font-semibold text-rose-900">Watch Live</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-rose-800/85">
            On the live event page, guests see the romantic hero, marquee tickers, stream, optional teaser and photo
            gallery — styled in rose and pink with subtle animations.
          </p>
        </div>
      </section>
    </div>
  )
}
