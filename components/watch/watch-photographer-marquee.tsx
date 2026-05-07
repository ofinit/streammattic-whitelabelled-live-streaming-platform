"use client"

import { cn } from "@/lib/utils"

export type WatchPhotographerMarqueeTheme =
  | "default"
  | "wedding"
  | "theHeart"
  | "garden"
  | "midnight"
  | "coastal"
  | "celestial"
  | "traditionalHindu"
  | "corporateTech"
  | "memorial"

function marqueeBarClass(theme: WatchPhotographerMarqueeTheme): string {
  switch (theme) {
    case "wedding":
      return "border border-amber-800/70 bg-amber-950 text-amber-50 shadow-lg"
    case "theHeart":
      return "border border-rose-900/55 bg-rose-950 text-rose-50 shadow-lg"
    case "garden":
      return "border border-emerald-900/50 bg-emerald-950 text-emerald-50 shadow-lg"
    case "midnight":
      return "border border-amber-500/45 bg-black text-amber-100 shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
    case "coastal":
      return "border border-teal-800/55 bg-[#005f66] text-white shadow-lg"
    case "celestial":
      return "border border-yellow-400/35 bg-[#12162c] text-yellow-50 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    case "traditionalHindu":
      return "border border-amber-700/65 bg-[#4a151d] text-amber-100 shadow-lg"
    case "corporateTech":
      return "border border-blue-500/35 bg-neutral-950 text-sky-100 shadow-lg"
    case "memorial":
      return "border border-[#c9a961]/55 bg-[#1e2935] text-[#fdf6e3] shadow-lg"
    case "default":
    default:
      return "border border-zinc-800 bg-zinc-950 text-zinc-50 shadow-md"
  }
}

export function WatchPhotographerMarquee({
  message,
  theme,
  className,
}: {
  message: string
  theme: WatchPhotographerMarqueeTheme
  className?: string
}) {
  const text = message.trim()
  if (!text) return null

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg",
        marqueeBarClass(theme),
        className,
      )}
      role="region"
      aria-label="Announcement"
    >
      <style jsx global>{`
        @keyframes watchPhotographerMarqueeSlide {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .watch-photographer-marquee-track {
          display: flex;
          width: max-content;
          animation: watchPhotographerMarqueeSlide 52s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .watch-photographer-marquee-track {
            animation: none;
            width: auto;
            max-width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }
          .watch-photographer-marquee-track span {
            white-space: normal;
          }
          .watch-photographer-marquee-duplicate {
            display: none;
          }
        }
        .watch-photographer-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="watch-photographer-marquee-track py-3">
        <span className="inline-block whitespace-nowrap px-10 text-center font-sans text-base font-semibold leading-snug tracking-wide md:text-lg">
          {text}
        </span>
        <span
          aria-hidden
          className="watch-photographer-marquee-duplicate inline-block whitespace-nowrap px-10 text-center font-sans text-base font-semibold leading-snug tracking-wide md:text-lg"
        >
          {text}
        </span>
      </div>
    </div>
  )
}
