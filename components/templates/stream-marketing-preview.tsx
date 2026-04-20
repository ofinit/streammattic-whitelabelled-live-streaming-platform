"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Play } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import { cn } from "@/lib/utils"

export interface StreamMarketingPreviewProps {
  templateId: string
  brandLabel: string
  eyebrow?: string
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
  footerBlurb?: string
  shellClassName?: string
  headerBarClassName?: string
  heroOverlayClassName?: string
  eyebrowClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  sectionClassName?: string
}

/**
 * Shared marketing preview shell for `tpl-stream-*` themes (mirrors {@link WeddingGardenTemplate}).
 * Live watch uses the default skin; hero URL comes from {@link TEMPLATE_DEFAULT_HERO_BACKDROP}.
 */
export function StreamMarketingPreview({
  templateId,
  brandLabel,
  eyebrow = "Live stream",
  eventTitle = "Event title",
  eventDescription = "Welcome to our live stream.",
  heroImageUrl,
  footerBlurb,
  shellClassName,
  headerBarClassName,
  heroOverlayClassName,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  sectionClassName,
}: StreamMarketingPreviewProps) {
  const hero = heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl(templateId) || ""

  return (
    <div className={cn("min-h-screen overflow-x-hidden", shellClassName)}>
      <div
        className={cn(
          "flex items-center justify-between border-b px-4 py-4 backdrop-blur-md",
          headerBarClassName,
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="text-sm font-medium opacity-90">{brandLabel}</span>
          <span className="w-16" aria-hidden />
        </div>
      </div>

      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pt-8">
        {hero ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${hero})` }}
          />
        ) : null}
        <div className={cn("absolute inset-0", heroOverlayClassName)} aria-hidden />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className={cn("text-xs font-semibold uppercase tracking-[0.28em]", eyebrowClassName)}>{eyebrow}</p>
          <h1 className={cn("mt-4 text-4xl font-semibold leading-tight md:text-6xl", titleClassName)}>{eventTitle}</h1>
          <p className={cn("mx-auto mt-6 max-w-xl text-base leading-relaxed md:text-lg", descriptionClassName)}>
            {eventDescription}
          </p>
          <p className={cn("mt-8 text-center text-sm font-semibold uppercase tracking-widest", eyebrowClassName)}>
            June 15, 2026 · 2:00 PM
          </p>
          <Button className="mt-10 gap-2 rounded-full px-8 py-6 text-base">
            <Play className="h-5 w-5" />
            Watch Live Stream
          </Button>
        </div>
      </section>

      <section className={cn("border-t px-4 py-16", sectionClassName)}>
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-2xl font-semibold md:text-3xl">Watch Live Stream</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm opacity-90">
            {footerBlurb ??
              "On the live event page, guests see your hero, schedule, chat, and template details from the event builder."}
          </p>
        </div>
      </section>
    </div>
  )
}
