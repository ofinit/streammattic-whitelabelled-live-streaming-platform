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
 * Marketing preview for tpl-wedding-garden (Ethereal Garden).
 * Live watch UX is implemented in watch-event-content (weddingGarden skin).
 */
export function WeddingGardenTemplate({
  eventTitle = "Emma & James",
  eventDescription = "Join us among the gardens for our ceremony — live with family and friends near and far.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-garden") || ""

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf9f6] font-garden-sans text-green-900">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(232, 180, 184, 0.28) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(135, 168, 120, 0.18) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(244, 208, 63, 0.15) 0%, transparent 50%)
          `,
        }}
      />

      <div className="border-b border-emerald-200/60 bg-white/70 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/events">
            <Button variant="ghost" size="sm" className="gap-2 text-emerald-800">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-garden-serif text-lg text-emerald-900">Ethereal Garden</span>
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_42%,rgba(4,32,28,0.82)_0%,rgba(4,32,28,0.45)_52%,transparent_72%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-emerald-100/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
            Garden wedding
          </p>
          <h1 className="mt-4 font-garden-serif text-5xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] [text-shadow:0_1px_3px_rgba(0,0,0,0.4)] md:text-7xl">
            {eventTitle}
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-emerald-50/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            {eventDescription}
          </p>

          <p className="mt-8 text-center text-sm font-semibold uppercase tracking-widest text-emerald-100 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
            June 15, 2026 · 2:00 PM
          </p>

          <Button className="mt-10 gap-2 rounded-full bg-emerald-700 px-8 py-6 text-base text-white hover:bg-emerald-800">
            <Play className="h-5 w-5" />
            Watch Live Stream
          </Button>
        </div>
      </section>

      <section className="border-t border-emerald-100 bg-white/60 px-4 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mt-2 font-garden-serif text-4xl text-emerald-950">Watch Live Stream</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-emerald-800/85">
            On the live event page, guests see the Ethereal Garden hero, schedule, glass stream frame, garden-styled
            chat, and the same template fields in the details panel — all from the event builder.
          </p>
        </div>
      </section>
    </div>
  )
}
