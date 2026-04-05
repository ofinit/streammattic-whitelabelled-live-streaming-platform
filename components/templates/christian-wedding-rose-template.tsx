"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, ChevronDown, MessageCircle, Radio, Send, Video, Youtube } from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import { cn } from "@/lib/utils"

const BLUSH = "#f4c2c2"
const ROSE_GOLD = "#b76e79"
const DEEP_ROSE = "#8b4f5c"
const IVORY = "#fffef7"
const GOLD = "#d4af37"
const TEXT = "#4a4a4a"

interface FloatingHeart {
  id: number
  left: string
  durationSec: number
  sizePx: number
  delaySec: number
  d0: number
  d1: number
  d2: number
  d3: number
  d4: number
}

const MOCK_CHAT = [
  {
    id: 1,
    user: "Sarah Johnson",
    message: "Congratulations to the beautiful couple! So happy to witness this special day! 💒",
    time: "2 minutes ago",
  },
  {
    id: 2,
    user: "Michael Chen",
    message: "God bless your union! May your love grow stronger each day.",
    time: "5 minutes ago",
  },
]

export interface ChristianWeddingRoseTemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
  /** Preview-only countdown target (ISO string or timestamp) */
  previewCountdownTarget?: string | number
}

export function ChristianWeddingRoseTemplate({
  eventTitle = "Romeo & Juliet",
  eventDescription = "Join us as we celebrate our marriage before God, family, and friends.",
  heroImageUrl,
  previewCountdownTarget,
}: ChristianWeddingRoseTemplateProps) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([])
  const nextHeartIdRef = useRef(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [platform, setPlatform] = useState<"youtube" | "custom">("youtube")
  const [customUrl, setCustomUrl] = useState("")
  const [chatDraft, setChatDraft] = useState("")
  const [guestName, setGuestName] = useState("")

  const targetMs = useMemo(() => {
    if (previewCountdownTarget !== undefined) {
      const t =
        typeof previewCountdownTarget === "number"
          ? previewCountdownTarget
          : Date.parse(String(previewCountdownTarget))
      if (!Number.isNaN(t)) return t
    }
    return Date.now() + 30 * 86400000
  }, [previewCountdownTarget])

  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0, past: false })

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)
    const onChange = () => setReduceMotion(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  useEffect(() => {
    const tick = () => {
      const diff = targetMs - Date.now()
      if (diff <= 0) {
        setCountdown({ d: 0, h: 0, m: 0, s: 0, past: true })
        return
      }
      setCountdown({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        past: false,
      })
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetMs])

  useEffect(() => {
    if (reduceMotion) return
    nextHeartIdRef.current = 0
    const driftPx = () => Math.round((Math.random() - 0.5) * 72)
    const makeHeart = (): FloatingHeart => {
      nextHeartIdRef.current += 1
      const durationSec = Math.random() * 5 + 8
      return {
        id: nextHeartIdRef.current,
        left: `${Math.random() * 94 + 3}%`,
        durationSec,
        sizePx: Math.random() * 36 + 44,
        delaySec: -Math.random() * durationSec,
        d0: driftPx(),
        d1: driftPx(),
        d2: driftPx(),
        d3: driftPx(),
        d4: driftPx(),
      }
    }
    setHearts(Array.from({ length: 12 }, () => makeHeart()))
    const spawn = () => {
      setHearts((prev) => {
        const durationSec = Math.random() * 5 + 8
        nextHeartIdRef.current += 1
        const h: FloatingHeart = {
          id: nextHeartIdRef.current,
          left: `${Math.random() * 94 + 3}%`,
          durationSec,
          sizePx: Math.random() * 36 + 44,
          delaySec: -Math.random() * Math.min(durationSec, 10),
          d0: driftPx(),
          d1: driftPx(),
          d2: driftPx(),
          d3: driftPx(),
          d4: driftPx(),
        }
        return [...prev, h].slice(-16)
      })
    }
    const interval = window.setInterval(spawn, 2200)
    return () => window.clearInterval(interval)
  }, [reduceMotion])

  const nameParts = eventTitle.includes(" & ")
    ? eventTitle.split(" & ").map((s) => s.trim())
    : [eventTitle, ""]

  const previewHeroBackdrop =
    heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-christian-wedding-rose") || ""

  const scrollToCountdown = useCallback(() => {
    document.getElementById("christian-rose-countdown-preview")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[color:var(--cw-text)]" style={{ ["--cw-text" as string]: TEXT, backgroundColor: IVORY }}>
      <style jsx global>{`
        @keyframes cwRoseHeartFloat {
          0% {
            top: 108%;
            opacity: 0;
            transform: translate(calc(-50% + var(--cr-d0, 0px)), 0) scale(0.96);
          }
          6% {
            opacity: 0.95;
            transform: translate(calc(-50% + var(--cr-d0, 0px)), 0) scale(0.99);
          }
          28% {
            top: 52%;
            transform: translate(calc(-50% + var(--cr-d1, 0px)), 0) scale(1.05);
          }
          50% {
            top: 28%;
            transform: translate(calc(-50% + var(--cr-d2, 0px)), 0) scale(1.08);
          }
          72% {
            top: 6%;
            opacity: 0.92;
            transform: translate(calc(-50% + var(--cr-d3, 0px)), 0) scale(1.04);
          }
          100% {
            top: -14%;
            opacity: 0;
            transform: translate(calc(-50% + var(--cr-d4, 0px)), 0) scale(1);
          }
        }
        @keyframes cwRoseFadeUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes cwRoseGlow {
          0%,
          100% {
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
          50% {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.85);
          }
        }
        @keyframes cwRoseAmpPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
        @keyframes cwRoseLivePulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.55);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(255, 68, 68, 0);
          }
        }
        @keyframes cwRoseLiveBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.35;
          }
        }
      `}</style>

      <header className="relative z-20 border-b border-white/30 bg-white/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2 text-[#8b4f5c]">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-christian-rose-script text-xl text-[#b76e79] md:text-2xl">Christian Wedding · Rose</span>
          <span className="w-14 md:w-24" />
        </div>
      </header>

      <section className="relative z-[2] flex min-h-[100vh] flex-col items-center justify-center overflow-hidden text-center bg-[#3d2528]">
        {previewHeroBackdrop ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${previewHeroBackdrop})`,
              filter: "none",
              backdropFilter: "none",
            }}
            aria-hidden
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ background: `linear-gradient(135deg, ${BLUSH} 0%, ${ROSE_GOLD} 100%)` }}
            aria-hidden
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(244, 194, 194, 0.14) 0%, rgba(183, 110, 121, 0.2) 50%, rgba(139, 79, 92, 0.16) 100%)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, transparent 45%, rgba(0,0,0,0.22) 100%)",
            backdropFilter: "none",
            WebkitBackdropFilter: "none",
          }}
          aria-hidden
        />

        {!reduceMotion ? (
          <div className="pointer-events-none absolute inset-0 z-[8] overflow-hidden" aria-hidden>
            {hearts.map((h) => (
              <span
                key={h.id}
                className="absolute text-[color:var(--cw-blush)] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                style={{
                  ["--cw-blush" as string]: BLUSH,
                  left: h.left,
                  top: "108%",
                  fontSize: h.sizePx,
                  ["--cr-d0" as string]: `${h.d0}px`,
                  ["--cr-d1" as string]: `${h.d1}px`,
                  ["--cr-d2" as string]: `${h.d2}px`,
                  ["--cr-d3" as string]: `${h.d3}px`,
                  ["--cr-d4" as string]: `${h.d4}px`,
                  animationName: "cwRoseHeartFloat",
                  animationDuration: `${h.durationSec}s`,
                  animationTimingFunction: "cubic-bezier(0.4, 0.15, 0.25, 1)",
                  animationIterationCount: "infinite",
                  animationDelay: `${h.delaySec}s`,
                }}
              >
                💕
              </span>
            ))}
          </div>
        ) : null}

        <div
          className="relative z-20 mx-auto max-w-3xl px-4 py-16"
          style={{
            animation: reduceMotion ? undefined : "cwRoseFadeUp 1.2s ease-out both",
          }}
        >
          <div
            className="mb-5 text-5xl text-[color:var(--cw-ivory)] md:text-6xl"
            style={{
              ["--cw-ivory" as string]: IVORY,
              filter:
                "drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 4px 14px rgba(0,0,0,0.8)) drop-shadow(0 0 28px rgba(0,0,0,0.55)) drop-shadow(0 0 52px rgba(0,0,0,0.35))",
              animation: reduceMotion ? undefined : "cwRoseGlow 2s ease-in-out infinite",
            }}
            aria-hidden
          >
            ✝
          </div>
          <h1
            className="font-christian-rose-script text-5xl leading-tight text-[color:var(--cw-ivory)] md:text-7xl [text-shadow:0_0_2px_rgba(0,0,0,0.95),0_2px_10px_rgba(0,0,0,0.88),0_4px_24px_rgba(0,0,0,0.72),0_8px_44px_rgba(0,0,0,0.5),0_14px_64px_rgba(0,0,0,0.32),0_1px_0_rgba(0,0,0,0.55)]"
            style={{ ["--cw-ivory" as string]: IVORY }}
          >
            {nameParts[1] ? (
              <>
                {nameParts[0]}{" "}
                <span
                  className="inline-block text-[color:var(--cw-gold)] [text-shadow:0_1px_3px_rgba(0,0,0,0.85),0_3px_14px_rgba(0,0,0,0.65),0_6px_28px_rgba(0,0,0,0.45)]"
                  style={{
                    ["--cw-gold" as string]: GOLD,
                    animation: reduceMotion ? undefined : "cwRoseAmpPulse 2s ease-in-out infinite",
                  }}
                >
                  &
                </span>{" "}
                {nameParts[1]}
              </>
            ) : (
              eventTitle
            )}
          </h1>
          <p
            className="mx-auto mt-8 max-w-2xl font-christian-rose-serif text-lg leading-relaxed text-[color:var(--cw-ivory)]/95 md:text-xl [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_4px_22px_rgba(0,0,0,0.68),0_8px_48px_rgba(0,0,0,0.42),0_0_1px_rgba(0,0,0,0.85)]"
            style={{ ["--cw-ivory" as string]: IVORY }}
          >
            {eventDescription}
          </p>
        </div>

        <button
          type="button"
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 cursor-pointer border-0 bg-transparent p-2 text-[color:var(--cw-ivory)] [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.85))_drop-shadow(0_3px_14px_rgba(0,0,0,0.55))_drop-shadow(0_0_24px_rgba(0,0,0,0.35))]"
          style={{ ["--cw-ivory" as string]: IVORY }}
          onClick={scrollToCountdown}
          aria-label="Scroll to countdown"
        >
          <ChevronDown className={cn("h-8 w-8", !reduceMotion && "animate-bounce")} />
        </button>
      </section>

      <section
        id="christian-rose-countdown-preview"
        className="relative z-[2] px-4 py-16 text-center text-white"
        style={{ background: `linear-gradient(135deg, ${DEEP_ROSE}, ${ROSE_GOLD})` }}
      >
        <h2 className="font-christian-rose-script text-4xl md:text-5xl">
          {countdown.past ? "We're celebrating! 💒" : "Ceremony Begins In..."}
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4 md:gap-8">
          {(["d", "h", "m", "s"] as const).map((k, i) => {
            const labels = ["Days", "Hours", "Minutes", "Seconds"]
            const vals = [countdown.d, countdown.h, countdown.m, countdown.s]
            return (
              <div
                key={k}
                className="min-w-[88px] rounded-2xl border-2 border-white/30 bg-white/15 px-5 py-6 backdrop-blur-md md:min-w-[120px]"
              >
                <span className="font-christian-rose-sans text-3xl font-semibold tabular-nums md:text-4xl">
                  {String(vals[i]).padStart(2, "0")}
                </span>
                <div className="mt-2 font-christian-rose-sans text-xs font-light uppercase tracking-widest">{labels[i]}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="relative z-[2] px-4 py-16 md:px-6" style={{ backgroundColor: IVORY }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-christian-rose-script text-4xl text-[#b76e79] md:text-5xl">Join Our Celebration</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center font-christian-rose-serif text-lg font-light text-[#4a4a4a]">
            Watch our special day live from anywhere in the world
          </p>

          <div className="mt-8 flex justify-center">
            <div
              className="inline-flex items-center gap-2.5 rounded-full px-5 py-2.5 font-christian-rose-sans text-sm font-medium text-white"
              style={{
                backgroundColor: "#ff4444",
                animation: reduceMotion ? undefined : "cwRoseLivePulse 1.5s ease-in-out infinite",
              }}
            >
              <span
                className="h-3 w-3 rounded-full bg-white"
                style={{ animation: reduceMotion ? undefined : "cwRoseLiveBlink 1s ease-in-out infinite" }}
              />
              LIVE STREAM
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "rounded-full border-2 border-[#b76e79] px-6 font-christian-rose-sans",
                platform === "youtube" && "bg-[#b76e79] text-white hover:bg-[#8b4f5c] hover:text-white",
              )}
              style={{ borderColor: ROSE_GOLD, color: platform === "youtube" ? IVORY : ROSE_GOLD, backgroundColor: platform === "youtube" ? ROSE_GOLD : IVORY }}
              onClick={() => setPlatform("youtube")}
            >
              <Youtube className="mr-2 h-4 w-4" />
              YouTube Live
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "rounded-full border-2 px-6 font-christian-rose-sans",
                platform === "custom" && "text-white hover:opacity-95",
              )}
              style={{
                borderColor: ROSE_GOLD,
                color: platform === "custom" ? IVORY : ROSE_GOLD,
                backgroundColor: platform === "custom" ? ROSE_GOLD : IVORY,
              }}
              onClick={() => setPlatform("custom")}
            >
              <Video className="mr-2 h-4 w-4" />
              Custom Link
            </Button>
          </div>

          {platform === "custom" ? (
            <div className="mx-auto mt-6 max-w-xl">
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste embed URL or YouTube video ID…"
                className="border-2 border-[#f4c2c2] font-christian-rose-sans"
              />
              <Button className="mt-3 w-full rounded-xl font-christian-rose-sans" style={{ backgroundColor: ROSE_GOLD }}>
                Load stream (preview)
              </Button>
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="overflow-hidden rounded-2xl bg-black shadow-xl lg:col-span-2">
              <div className="flex aspect-video items-center justify-center bg-zinc-900">
                <div className="text-center text-white/80">
                  <Radio className="mx-auto mb-3 h-12 w-12 opacity-60" />
                  <p className="font-christian-rose-sans text-sm">Stream connects on the live event page</p>
                </div>
              </div>
            </div>

            <div className="flex max-h-[min(600px,70vh)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#f4c2c2]/80 bg-white shadow-lg lg:max-h-[600px]">
              <div
                className="px-4 py-4 text-center font-christian-rose-sans font-medium text-white"
                style={{ background: `linear-gradient(135deg, ${ROSE_GOLD}, ${DEEP_ROSE})` }}
              >
                <MessageCircle className="mx-auto mb-1 h-5 w-5 opacity-95" />
                Live Chat
                <div className="mt-1 text-xs font-normal opacity-90">Share your blessings &amp; well wishes</div>
              </div>
              <ScrollArea className="min-h-0 flex-1 bg-[#fafafa] p-4">
                <div className="space-y-3">
                  {MOCK_CHAT.map((m) => (
                    <div key={m.id} className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="font-christian-rose-sans text-sm font-semibold text-[#b76e79]">{m.user}</div>
                      <p className="mt-1 font-christian-rose-serif text-sm text-[#4a4a4a]">{m.message}</p>
                      <div className="mt-1 font-christian-rose-sans text-xs text-zinc-400">{m.time}</div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t-2 border-[#f4c2c2] bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="border-2 border-[#f4c2c2] font-christian-rose-sans sm:flex-1"
                  />
                  <Input
                    placeholder="Write your message…"
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    className="border-2 border-[#f4c2c2] font-christian-rose-sans sm:flex-[2]"
                  />
                  <Button size="icon" className="h-10 w-12 shrink-0 rounded-xl" style={{ backgroundColor: ROSE_GOLD }}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
