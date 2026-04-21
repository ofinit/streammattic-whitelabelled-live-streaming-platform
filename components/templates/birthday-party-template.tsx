"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Calendar,
  Cake,
  ChevronDown,
  Clock,
  Gift,
  MapPin,
  MessageCircle,
  Send,
  Shirt,
  Video,
  Youtube,
} from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import { cn } from "@/lib/utils"

const PARTY_PINK = "#ff6b9d"
const PARTY_PURPLE = "#c44569"
const PARTY_BLUE = "#4facfe"
const PARTY_YELLOW = "#ffd93d"
const PARTY_ORANGE = "#ff9a56"
const PARTY_GREEN = "#6bcf7f"
const TEXT_DARK = "#2d3436"
const LIGHT_BG = "#fff5f8"

const MOCK_WISHES = [
  {
    id: 1,
    user: "Jennifer R.",
    message: "Happy Birthday! May your day be filled with love, laughter, and lots of cake!",
    time: "5 min ago",
  },
  {
    id: 2,
    user: "Mike & Emily",
    message: "Wishing you the most amazing celebration — here’s to another year of adventures!",
    time: "12 min ago",
  },
  {
    id: 3,
    user: "Amanda W.",
    message: "Hope your day is as wonderful as you are! Have a blast!",
    time: "20 min ago",
  },
]

type PartyFloater = { id: number; left: string; symbol: string; duration: string; delay: string; size: number }

type PartyConfetti = {
  id: number
  left: string
  duration: string
  delay: string
  size: number
  heightMul: number
  color: string
}

export interface BirthdayPartyTemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
  honoreeName?: string
  partyHeadline?: string
  partyTagline?: string
  previewCountdownTarget?: string | number
}

export function BirthdayPartyTemplate({
  eventTitle = "Sarah's 25th Birthday Bash",
  eventDescription = "Join us live for cake, music, and unforgettable moments!",
  honoreeName = "Sarah",
  partyHeadline = "We're getting married!",
  partyTagline,
  previewCountdownTarget,
}: BirthdayPartyTemplateProps) {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [floaters, setFloaters] = useState<PartyFloater[]>([])
  const [confettiPieces, setConfettiPieces] = useState<PartyConfetti[]>([])
  const nextId = useRef(0)
  const confettiIdRef = useRef(0)
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
    return Date.now() + 14 * 86400000
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
    if (reduceMotion) {
      setFloaters([])
      setConfettiPieces([])
      return
    }
    const symbols = ["🎈", "🎉", "🎊", "🎁", "🥳"]
    const confettiColors = ["#fde047", "#7dd3fc", "#86efac", "#fb923c", "#9f1239", "#fbcfe8", "#c084fc", "#f9a8d4"]
    const makeConfetti = (): PartyConfetti => {
      confettiIdRef.current += 1
      return {
        id: confettiIdRef.current,
        left: `${Math.random() * 100}%`,
        duration: `${Math.random() * 8 + 12}s`,
        delay: `${Math.random() * 5}s`,
        size: Math.random() * 5 + 6,
        heightMul: Math.random() > 0.5 ? 1.15 : 1,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)]!,
      }
    }
    setConfettiPieces(Array.from({ length: 44 }, makeConfetti))
    const spawn = () => {
      nextId.current += 1
      const id = nextId.current
      setFloaters((prev) => {
        const next: PartyFloater[] = [
          ...prev,
          {
            id,
            left: `${Math.random() * 100}%`,
            symbol: symbols[Math.floor(Math.random() * symbols.length)]!,
            duration: `${Math.random() * 8 + 12}s`,
            delay: `${Math.random() * 4}s`,
            size: Math.random() * 18 + 22,
          },
        ]
        return next.slice(-28)
      })
      setConfettiPieces((prev) => [...prev.slice(-52), makeConfetti(), makeConfetti()])
    }
    for (let i = 0; i < 5; i++) window.setTimeout(spawn, i * 400)
    const interval = window.setInterval(spawn, 2200)
    return () => window.clearInterval(interval)
  }, [reduceMotion])

  /** Hero upload is for the live watch circular profile + OG — not layered behind the preview hero */
  const heroBackdrop = getDefaultTemplateHeroBackdropUrl("tpl-birthday-party") || ""

  const scrollToCountdown = useCallback(() => {
    document.getElementById("birthday-countdown-preview")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-birthday-sans text-[color:var(--bp-text)]"
      style={{ ["--bp-text" as string]: TEXT_DARK, backgroundColor: LIGHT_BG }}
    >
      <style jsx global>{`
        @keyframes bpFloatUp {
          0% {
            transform: translateY(105vh) translateX(0) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 0.85;
          }
          88% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(-110vh) translateX(40px) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes bpHeroIn {
          0% {
            transform: scale(0.92);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes bpPhotoFloat {
          0%,
          100% {
            transform: translateY(0) rotate(-4deg);
          }
          50% {
            transform: translateY(-12px) rotate(4deg);
          }
        }
        @keyframes bpEmojiPop {
          0%,
          100% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.15) translateY(-6px);
          }
        }
        @keyframes bpTitleGlow {
          0%,
          100% {
            text-shadow:
              3px 3px 0 ${PARTY_PURPLE},
              6px 6px 0 ${PARTY_PINK},
              9px 9px 20px rgba(0, 0, 0, 0.25);
          }
          50% {
            text-shadow:
              3px 3px 0 ${PARTY_BLUE},
              6px 6px 0 ${PARTY_YELLOW},
              9px 9px 20px rgba(0, 0, 0, 0.25);
          }
        }
        @keyframes bpAgePulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.06);
          }
        }
      `}</style>

      <header className="relative z-30 border-b border-white/50 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2" style={{ color: PARTY_PURPLE }}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-birthday-display text-lg font-semibold md:text-xl" style={{ color: PARTY_PURPLE }}>
            Birthday · Live
          </span>
          <span className="w-14 md:w-24" />
        </div>
      </header>

      <section
        className="relative z-[3] flex min-h-[100vh] flex-col overflow-hidden px-4 py-12 text-center md:py-16"
        style={{
          background: `linear-gradient(135deg, ${PARTY_PINK} 0%, ${PARTY_PURPLE} 45%, ${PARTY_BLUE} 100%)`,
        }}
      >
        {heroBackdrop ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: `url(${heroBackdrop})` }}
            aria-hidden
          />
        ) : null}

        {!reduceMotion ? (
          <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
            {confettiPieces.map((c) => (
              <span
                key={`c-${c.id}`}
                className="absolute block rounded-[1px]"
                style={{
                  left: c.left,
                  bottom: "-8%",
                  width: c.size,
                  height: c.size * c.heightMul,
                  backgroundColor: c.color,
                  animationName: "bpFloatUp",
                  animationDuration: c.duration,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDelay: c.delay,
                }}
              />
            ))}
            {floaters.map((f) => (
              <span
                key={f.id}
                className="absolute select-none"
                style={{
                  left: f.left,
                  bottom: "-10%",
                  fontSize: f.size,
                  animationName: "bpFloatUp",
                  animationDuration: f.duration,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDelay: f.delay,
                }}
              >
                {f.symbol}
              </span>
            ))}
          </div>
        ) : null}

        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-center [text-shadow:0_2px_8px_rgba(0,0,0,0.35)]">
          <div
            className="mx-auto w-full max-w-4xl px-2"
            style={{
              animation: reduceMotion ? undefined : "bpHeroIn 1s ease-out both",
            }}
          >
            <div
              className="relative mx-auto mb-6 h-[200px] w-[200px] md:h-[240px] md:w-[240px]"
              style={{ animation: reduceMotion ? undefined : "bpPhotoFloat 3s ease-in-out infinite" }}
            >
              <div
                className="absolute -top-6 left-1/2 z-10 -translate-x-1/2 text-4xl md:text-5xl"
                aria-hidden
              >
                🎉
              </div>
              <div
                className="h-full w-full rounded-full p-2 shadow-2xl"
                style={{
                  background: `linear-gradient(45deg, ${PARTY_YELLOW}, ${PARTY_ORANGE}, ${PARTY_PINK})`,
                }}
              >
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-gradient-to-br from-violet-500 to-fuchsia-600">
                  <Cake className="h-24 w-24 text-white/90 md:h-28 md:w-28" aria-hidden />
                </div>
              </div>
            </div>

            <h1
              className="font-birthday-display text-3xl uppercase tracking-wider text-white md:text-5xl"
              style={{
                animation: reduceMotion ? undefined : "bpTitleGlow 3s ease-in-out infinite",
              }}
            >
              {partyHeadline}
            </h1>

            <p
              className="font-coastal-script mt-4 text-5xl text-[#ffd93d] md:text-7xl"
              style={{ textShadow: "4px 4px 10px rgba(0,0,0,0.35)" }}
            >
              {honoreeName}
            </p>

            <div
              className="mx-auto mt-6 inline-flex items-center justify-center rounded-full border-[3px] border-white/90 px-6 py-2 backdrop-blur-md md:px-8 md:py-3"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <span
                className="text-4xl leading-none md:text-5xl"
                aria-hidden
                style={{ animation: reduceMotion ? undefined : "bpAgePulse 1.2s ease-in-out infinite" }}
              >
                🎂
              </span>
            </div>

            {partyTagline?.trim() ? (
              <p className="mt-6 text-lg font-light text-white md:text-2xl" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.25)" }}>
                {partyTagline.trim()}
              </p>
            ) : null}

            <p className={cn("text-sm text-white/95 md:text-base", partyTagline?.trim() ? "mt-4" : "mt-6")}>{eventDescription}</p>

            <div className="mt-8 flex justify-center gap-4 text-3xl md:text-4xl" aria-hidden>
              {["🎈", "🎉", "🎊", "🎁", "🥳"].map((e, i) => (
                <span
                  key={e}
                  className="inline-block"
                  style={{
                    animation: reduceMotion ? undefined : `bpEmojiPop 1.2s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                >
                  {e}
                </span>
              ))}
            </div>

            <p className="mt-6 font-birthday-display text-lg text-white/95 md:text-xl">{eventTitle}</p>
          </div>
        </div>

        <button
          type="button"
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 cursor-pointer border-0 bg-transparent p-2 text-white"
          onClick={scrollToCountdown}
          aria-label="Scroll to countdown"
        >
          <ChevronDown className={cn("h-8 w-8", !reduceMotion && "animate-bounce")} />
        </button>
      </section>

      <section
        id="birthday-countdown-preview"
        className="relative z-[3] px-4 py-16 text-center"
        style={{
          background: `linear-gradient(135deg, ${PARTY_ORANGE} 0%, ${PARTY_PINK} 100%)`,
        }}
      >
        <h2 className="font-birthday-display text-3xl text-white md:text-5xl" style={{ textShadow: "0 3px 10px rgba(0,0,0,0.2)" }}>
          {countdown.past ? "🎉 Party time! 🎉" : "🎉 Party starts in… 🎉"}
        </h2>
        <div className="mx-auto mt-10 flex flex-wrap justify-center gap-4 md:gap-8">
          {(["d", "h", "m", "s"] as const).map((k, i) => {
            const labels = ["Days", "Hours", "Minutes", "Seconds"]
            const vals = [countdown.d, countdown.h, countdown.m, countdown.s]
            return (
              <div
                key={k}
                className="min-w-[100px] rounded-2xl border-[3px] border-white/50 bg-white/20 px-5 py-6 shadow-lg backdrop-blur-md md:min-w-[130px]"
              >
                <span className="font-birthday-display text-3xl text-white md:text-5xl">
                  {String(vals[i]).padStart(2, "0")}
                </span>
                <div className="mt-2 text-xs font-semibold uppercase tracking-widest text-white/95">{labels[i]}</div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="relative z-[3] bg-white px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div className="mb-4 text-5xl motion-safe:animate-bounce" aria-hidden>
              🎊
            </div>
            <h2
              className="font-birthday-display text-4xl md:text-5xl"
              style={{
                background: `linear-gradient(135deg, ${PARTY_PINK}, ${PARTY_PURPLE}, ${PARTY_BLUE})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Party details
            </h2>
            <p className="mt-3 text-lg opacity-80">Everything you need to join the fun</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Calendar,
                title: "Date & time",
                body: "Saturday evening · Check your invite for the exact time",
                grad: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`,
              },
              {
                icon: MapPin,
                title: "Location",
                body: "Party venue or streaming link — details in your confirmation",
                grad: `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`,
              },
              {
                icon: Shirt,
                title: "Dress code",
                body: "Colorful & festive — wear something that makes you smile",
                grad: `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`,
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-3xl p-8 text-center text-white shadow-xl transition hover:-translate-y-1"
                style={{ background: card.grad }}
              >
                <card.icon className="mx-auto mb-4 h-12 w-12 opacity-95" />
                <h3 className="font-birthday-display text-xl">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed opacity-95">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative z-[3] px-4 py-20"
        style={{
          background: `linear-gradient(135deg, #667eea 0%, #764ba2 40%, #f093fb 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            🎥
          </div>
          <h2 className="font-birthday-display text-4xl text-white md:text-5xl" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
            Join the party live
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/90">Celebrate with us from anywhere in the world</p>

          <div
            className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border-2 border-white px-8 py-3 font-semibold text-white shadow-lg"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.95)",
              animation: reduceMotion ? undefined : "bpPulse 2s ease-in-out infinite",
            }}
          >
            <span className="h-3 w-3 rounded-full bg-white motion-safe:animate-pulse" />
            STREAMING LIVE
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "rounded-full border-2 border-white/60 px-6 font-semibold",
                platform === "youtube" ? "bg-white text-violet-700" : "bg-white/10 text-white",
              )}
              onClick={() => setPlatform("youtube")}
            >
              <Youtube className="mr-2 h-4 w-4" />
              YouTube
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "rounded-full border-2 border-white/60 px-6 font-semibold",
                platform === "custom" ? "bg-white text-violet-700" : "bg-white/10 text-white",
              )}
              onClick={() => setPlatform("custom")}
            >
              <Video className="mr-2 h-4 w-4" />
              Custom link
            </Button>
          </div>

          {platform === "custom" ? (
            <div className="mx-auto mt-6 max-w-lg">
              <Input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Paste stream URL…"
                className="border-white/40 bg-white/15 text-white placeholder:text-white/60"
              />
            </div>
          ) : null}

          <div className="mt-12 grid gap-8 lg:grid-cols-3 lg:items-start">
            <div className="aspect-video overflow-hidden rounded-2xl border-4 border-white bg-black shadow-2xl lg:col-span-2">
              <div className="flex h-full min-h-[220px] items-center justify-center text-white/80">
                <Video className="mr-2 h-10 w-10" />
                Preview embed
              </div>
            </div>

            <div className="flex max-h-[420px] flex-col overflow-hidden rounded-2xl border-4 border-pink-300 bg-white shadow-xl">
              <div
                className="px-4 py-4 text-center text-white"
                style={{ background: `linear-gradient(135deg, ${PARTY_PINK}, ${PARTY_PURPLE})` }}
              >
                <h3 className="font-birthday-display text-xl">Birthday wishes</h3>
                <p className="text-sm opacity-95">Leave a message!</p>
              </div>
              <ScrollArea className="flex-1 p-4" style={{ background: `linear-gradient(180deg, #fff5f8, #ffe8f0)` }}>
                {MOCK_WISHES.map((w) => (
                  <div
                    key={w.id}
                    className="mb-3 rounded-2xl border-l-4 bg-white p-4 shadow-md"
                    style={{ borderColor: PARTY_PINK }}
                  >
                    <p className="font-semibold" style={{ color: PARTY_PURPLE }}>
                      {w.user}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{w.message}</p>
                    <p className="mt-2 text-xs italic text-slate-400">{w.time}</p>
                  </div>
                ))}
              </ScrollArea>
              <div className="border-t border-pink-200 p-4">
                <Input
                  placeholder="Your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mb-2 border-pink-300"
                />
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-pink-300 px-3 py-2 text-sm"
                  placeholder="Write a wish…"
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                />
                <Button className="mt-2 w-full font-semibold text-white" style={{ background: `linear-gradient(135deg, ${PARTY_PINK}, ${PARTY_PURPLE})` }}>
                  <Gift className="mr-2 h-4 w-4" />
                  Send wish
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative z-[3] px-4 py-20"
        style={{
          background: `linear-gradient(135deg, ${PARTY_BLUE} 0%, ${PARTY_GREEN} 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-birthday-display text-4xl text-white md:text-5xl" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
            Memory lane
          </h2>
          <p className="mt-3 text-white/90">Snapshots from the celebration</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex aspect-square items-center justify-center rounded-2xl border-4 border-white bg-white/10 text-5xl text-white/50 shadow-lg"
              >
                📸
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer
        className="relative z-[3] px-4 py-16 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${TEXT_DARK} 0%, #1e272e 100%)`,
        }}
      >
        <div className="text-5xl motion-safe:animate-bounce" aria-hidden>
          🎂🎉🎈
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed opacity-95">
          Thanks for celebrating with us — your wishes make this day unforgettable!
        </p>
        <p className="font-coastal-script mt-8 text-3xl text-[#ffd93d]">
          Let&apos;s make it unforgettable!
        </p>
      </footer>

      <style jsx global>{`
        @keyframes bpPulseGlow {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 0.85;
          }
        }
        @keyframes bpPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.03);
          }
        }
      `}</style>
    </div>
  )
}
