"use client"

import type { LiveEvent } from "@/lib/types"
import {
  extractTemplateBannerContent,
  getBannerAccentBorder,
  getBannerThemeForCategory,
  getTemplateCategoryAndName,
} from "@/lib/template-visuals"

interface EventTemplateBannerProps {
  event: LiveEvent
  templateId: string
  templateData: Record<string, unknown>
}

/** Renders category-themed, per-template-accent banner above the video on the watch page. */
export function EventTemplateBanner({ event, templateId, templateData }: EventTemplateBannerProps) {
  const data = templateData as Record<string, string | undefined>
  const title = event.title ?? ""
  const isWedding = templateId === "tpl-wedding"
  const isGardenWedding = templateId === "tpl-wedding-garden"
  const isMidnightWedding = templateId === "tpl-wedding-midnight"
  const isCoastalWedding = templateId === "tpl-wedding-coastal"
  const isCelestialWedding = templateId === "tpl-wedding-celestial"

  const { category, name: templateName } = getTemplateCategoryAndName(templateId)
  const theme = getBannerThemeForCategory(category)
  const accentBorder = getBannerAccentBorder(templateId)
  const { headline, accent, lines } = extractTemplateBannerContent(
    templateId,
    data,
    title,
    event.description ?? "",
  )

  const detailLines = lines
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l !== headline && l !== accent)

  if (!headline && !accent && detailLines.length === 0) {
    return null
  }

  if (isGardenWedding) {
    const couple = [data.brideName, data.groomName].filter(Boolean).join(" & ")
    return (
      <div className="border-b border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-[#faf9f6] to-amber-50/80 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-emerald-300 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Ethereal Garden
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-emerald-600">Virtual celebration</span>
          </div>
          {event.subtitle?.trim() ? (
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">{event.subtitle}</p>
          ) : null}
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-emerald-950 md:text-5xl">
            {couple || headline || title || "Garden wedding"}
          </h2>
          {event.description?.trim() ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-emerald-800/90 md:text-base">{event.description}</p>
          ) : null}
          {detailLines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {detailLines.slice(0, 4).map((line, i) => (
                <span
                  key={i}
                  className="rounded-full border border-emerald-200 bg-white/85 px-3 py-1 text-xs text-emerald-800"
                >
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isCoastalWedding) {
    const couple = [data.brideName, data.groomName].filter(Boolean).join(" & ")
    return (
      <div className="border-b border-teal-200/70 bg-gradient-to-br from-[#edf6f9] via-white to-[#e6ccb2]/50 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-teal-200 bg-white/90 px-2.5 py-1 font-coastal-sans text-[10px] font-semibold uppercase tracking-[0.14em] text-[#006d77]">
              Coastal Breeze
            </span>
            <span className="font-coastal-sans text-[10px] uppercase tracking-[0.12em] text-[#e29578]">
              By the shore
            </span>
          </div>
          {event.subtitle?.trim() ? (
            <p className="font-coastal-sans text-xs font-semibold uppercase tracking-[0.28em] text-[#e29578]">
              {event.subtitle}
            </p>
          ) : null}
          <h2 className="mt-2 font-coastal-script text-3xl leading-tight text-[#006d77] md:text-5xl">
            {couple || headline || title || "Coastal wedding"}
          </h2>
          {event.description?.trim() ? (
            <p className="mt-3 max-w-3xl font-coastal-sans text-sm leading-relaxed text-slate-700 md:text-base">
              {event.description}
            </p>
          ) : null}
          {detailLines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {detailLines.slice(0, 4).map((line, i) => (
                <span
                  key={i}
                  className="rounded-full border border-teal-200/80 bg-white/90 px-3 py-1 font-coastal-sans text-xs text-[#006d77]"
                >
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isCelestialWedding) {
    const couple = [data.brideName, data.groomName].filter(Boolean).join(" & ")
    return (
      <div className="border-b border-violet-600/40 bg-gradient-to-br from-[#0b0d17] via-[#1a1f3d] to-[#0b0d17] px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-yellow-500/35 bg-black/50 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-300/90">
              Celestial Dreams
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-400/90">
              Written in the stars
            </span>
          </div>
          {event.subtitle?.trim() ? (
            <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-violet-300/85">
              {event.subtitle}
            </p>
          ) : null}
          <h2 className="mt-2 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text font-celestial-display text-3xl font-semibold leading-tight text-transparent md:text-5xl">
            {couple || headline || title || "Celestial union"}
          </h2>
          {event.description?.trim() ? (
            <p className="mt-3 max-w-3xl font-celestial-sans text-sm leading-relaxed text-zinc-400 md:text-base">
              {event.description}
            </p>
          ) : null}
          {detailLines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {detailLines.slice(0, 4).map((line, i) => (
                <span
                  key={i}
                  className="rounded border border-violet-600/40 bg-black/40 px-3 py-1 font-mono text-xs text-yellow-200/85"
                >
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isMidnightWedding) {
    const couple = [data.brideName, data.groomName].filter(Boolean).join(" & ")
    return (
      <div className="border-b border-amber-500/25 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-500/40 bg-black/60 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/90">
              Midnight Elegance
            </span>
          </div>
          {event.subtitle?.trim() ? (
            <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-amber-500/80">
              {event.subtitle}
            </p>
          ) : null}
          <h2 className="font-midnight-display mt-2 text-3xl font-normal leading-tight text-amber-100 md:text-5xl">
            {couple || headline || title || "Wedding broadcast"}
          </h2>
          {event.description?.trim() ? (
            <p className="mt-3 max-w-3xl font-mono text-sm leading-relaxed text-zinc-400 md:text-base">
              {event.description}
            </p>
          ) : null}
          {detailLines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {detailLines.slice(0, 4).map((line, i) => (
                <span
                  key={i}
                  className="rounded border border-amber-500/30 bg-black/50 px-3 py-1 font-mono text-xs text-amber-200/90"
                >
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isWedding) {
    const couple = [data.brideName, data.groomName].filter(Boolean).join(" & ")
    return (
      <div className="border-b border-rose-200/60 bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-rose-300 bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">
              Wedding
            </span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-rose-500">
              Live celebration
            </span>
          </div>
          {event.subtitle?.trim() ? (
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-rose-500">{event.subtitle}</p>
          ) : null}
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-rose-900 md:text-5xl">
            {couple || headline || title || "Wedding ceremony"}
          </h2>
          {event.description?.trim() ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-rose-700 md:text-base">{event.description}</p>
          ) : null}
          {detailLines.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {detailLines.slice(0, 4).map((line, i) => (
                <span
                  key={i}
                  className="rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-xs text-rose-700"
                >
                  {line}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`border-b px-4 py-4 md:px-6 md:py-5 ${theme.shell} ${accentBorder}`}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${theme.pill}`}
          >
            {templateName}
          </span>
          <span className={`text-[10px] uppercase tracking-wide ${theme.sub}`}>{category}</span>
        </div>

        <h2 className={`text-xl font-semibold leading-tight md:text-2xl ${theme.headline}`}>
          {headline || title || "Live event"}
        </h2>

        {accent && accent !== headline && (
          <p className={`mt-1 text-sm font-medium md:text-base ${theme.body}`}>{accent}</p>
        )}

        {detailLines.map((line, i) => (
          <p key={i} className={`mt-2 text-sm leading-relaxed md:text-base ${theme.body}`}>
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
