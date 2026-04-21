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
 * Marketing preview for tpl-wedding-coastal (Coastal Breeze).
 * Live watch UX is implemented in watch-event-content (weddingCoastal skin).
 */
export function WeddingCoastalTemplate({
  eventTitle = "Luna & Marco",
  eventDescription = "Join us by the sea — live ceremony with family and friends near and far.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-coastal") || ""

  return (
    <div className="min-h-screen overflow-x-hidden coastal-sand-texture-bg font-coastal-sans text-slate-800">
      <div className="border-b border-teal-200/60 bg-white/75 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2 text-[#006d77]">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-coastal-script text-xl text-[#006d77]">Coastal Breeze</span>
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
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[100px] overflow-hidden"
          aria-hidden
        >
          <div className="coastal-wave-layer coastal-wave-layer-3" />
          <div className="coastal-wave-layer coastal-wave-layer-2" />
          <div className="coastal-wave-layer" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center [text-shadow:0_1px_8px_rgba(0,0,0,0.35)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e29578]">Beach wedding</p>
          <h1 className="mt-4 font-coastal-script text-5xl text-[#006d77] drop-shadow-sm md:text-7xl">
            {eventTitle}
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-slate-700 md:text-lg">
            {eventDescription}
          </p>

          <p className="mt-8 text-center text-sm font-semibold uppercase tracking-widest text-[#006d77]">
            July 8, 2026 · 4:00 PM
          </p>

          <Button className="mt-10 gap-2 rounded-full bg-gradient-to-br from-[#e29578] to-[#d4846a] px-8 py-6 text-base text-white shadow-lg hover:opacity-95">
            <Play className="h-5 w-5" />
            Watch Live Stream
          </Button>
        </div>
      </section>

      <section className="border-t border-teal-100 bg-white/70 px-4 py-16 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="mt-2 font-coastal-script text-4xl text-[#006d77]">Watch Live Stream</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600">
            On the live event page, guests see the coastal hero, animated waves and bubbles, sea-glass stream frame,
            “Message in a Bottle” chat, schedule, and details — driven by the same wedding template fields in the event
            builder.
          </p>
        </div>
      </section>
    </div>
  )
}
