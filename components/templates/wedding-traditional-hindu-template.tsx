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
 * Marketing preview for tpl-wedding-traditional-hindu (Shubh Vivah).
 * Live watch UX: `WeddingTraditionalHinduWatchView` + `weddingTraditionalHindu` skin.
 */
export function WeddingTraditionalHinduTemplate({
  eventTitle = "Vikram & Ananya",
  eventDescription = "With blessings from both families — join our live ceremony.",
  heroImageUrl,
}: TemplateProps) {
  const hero =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding-traditional-hindu") || ""

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FFF8DC] font-hindu-wedding-serif text-[#5c0a0a]">
      <div className="border-b border-amber-400/40 bg-gradient-to-r from-red-900/90 via-orange-800/85 to-red-900/90 px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2 text-amber-100 hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-hindu-wedding-display text-sm tracking-[0.2em] text-amber-200">Shubh Vivah</span>
          <span className="w-16" />
        </div>
      </div>

      <div className="relative h-[180px] w-full overflow-hidden bg-gradient-to-b from-[#FFE4B5] to-[#FFF8DC]">
        <div className="hindu-wedding-scallop absolute inset-x-0 top-0 h-[52px]" aria-hidden />
        <div className="hindu-wedding-marigold-chain absolute inset-x-0 top-[44px] h-9" aria-hidden />
        <p className="relative z-[1] pt-[120px] text-center font-hindu-wedding-display text-4xl text-amber-700">ॐ</p>
      </div>

      <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-4 pb-16 pt-6">
        {hero ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: `url(${hero})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF8DC]/90 via-orange-50/70 to-[#FFF8DC]" aria-hidden />

        <div className="relative z-[1] mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.35em] text-orange-600">Traditional Hindu Wedding</p>
          <h1 className="mt-4 font-hindu-wedding-display text-4xl font-semibold text-red-900 md:text-6xl">{eventTitle}</h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-700 md:text-lg">{eventDescription}</p>
          <p className="mt-8 text-sm text-orange-700/90">Marigold, Om, and live stream — same fields as other wedding templates.</p>
          <Button className="mt-10 gap-2 rounded-full bg-gradient-to-r from-orange-500 via-red-600 to-pink-600 px-8 py-6 text-base text-white shadow-lg">
            <Play className="h-5 w-5" />
            Watch Live Stream
          </Button>
        </div>
      </section>
    </div>
  )
}
