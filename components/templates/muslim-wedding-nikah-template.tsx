"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  MessageCircle,
  Radio,
  Send,
  Video,
  Youtube,
} from "lucide-react"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import { cn } from "@/lib/utils"

const EMERALD = "#2d5f5d"
const GOLD = "#d4af37"
const DARK_GOLD = "#b8941e"
const CREAM = "#faf8f3"
const IVORY = "#fff9f0"
const DEEP_GREEN = "#1a3c3a"
const LIGHT_GOLD = "#f4e4c1"
const TEXT_DARK = "#2c2c2c"

const MOCK_CHAT = [
  {
    id: 1,
    user: "Aisha Rahman",
    message:
      "MashaAllah! May Allah bless your marriage with love, happiness, and countless beautiful moments. Ameen!",
    time: "3 minutes ago",
  },
  {
    id: 2,
    user: "Omar Abdullah",
    message: "Alhamdulillah! What a beautiful ceremony. May Allah grant you both Jannah together. Barakallahu Lakuma!",
    time: "7 minutes ago",
  },
  {
    id: 3,
    user: "Zainab Malik",
    message: "SubhanAllah, so blessed to witness this nikah. May your marriage be filled with barakah and endless mercy.",
    time: "10 minutes ago",
  },
]

interface NikahStar {
  id: number
  left: string
  durationSec: number
  delaySec: number
  sizePx: number
  symbol: "✦" | "☪"
}

export interface MuslimWeddingNikahTemplateProps {
  eventTitle?: string
  eventDescription?: string
  heroImageUrl?: string
  previewCountdownTarget?: string | number
}

export function MuslimWeddingNikahTemplate({
  eventTitle = "Ahmad & Fatima",
  eventDescription = "Peace and blessings — join our nikah celebration live.",
  heroImageUrl,
  previewCountdownTarget,
}: MuslimWeddingNikahTemplateProps) {
  const [stars, setStars] = useState<NikahStar[]>([])
  const nextStarId = useRef(0)
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
    if (reduceMotion) {
      setStars([])
      return
    }
    const spawn = () => {
      nextStarId.current += 1
      const id = nextStarId.current
      setStars((prev) => {
        const next: NikahStar[] = [
          ...prev,
          {
            id,
            left: `${Math.random() * 100}%`,
            durationSec: Math.random() * 12 + 14,
            delaySec: Math.random() * 5,
            sizePx: Math.random() * 28 + 26,
            symbol: Math.random() > 0.5 ? "✦" : "☪",
          },
        ]
        return next.slice(-24)
      })
    }
    for (let i = 0; i < 6; i++) window.setTimeout(spawn, i * 500)
    const interval = window.setInterval(spawn, 3800)
    return () => window.clearInterval(interval)
  }, [reduceMotion])

  const nameParts = eventTitle.includes(" & ")
    ? eventTitle.split(" & ").map((s) => s.trim())
    : [eventTitle, ""]

  const heroBackdrop = heroImageUrl?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-muslim-wedding-nikah") || ""

  const scrollToCountdown = useCallback(() => {
    document.getElementById("nikah-countdown-preview")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div
      className="relative min-h-screen overflow-x-hidden font-nikah-sans text-[color:var(--nikah-text)]"
      style={{ ["--nikah-text" as string]: TEXT_DARK, backgroundColor: CREAM }}
    >
      <style jsx global>{`
        @keyframes nikahStarRise {
          0% {
            transform: translateY(105vh) rotate(0deg) scale(0.4);
            opacity: 0;
          }
          12% {
            opacity: 0.85;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-110vh) rotate(360deg) scale(1);
            opacity: 0;
          }
        }
        @keyframes nikahPatternDrift {
          0% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.08);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        @keyframes nikahGoldGlow {
          0%,
          100% {
            text-shadow:
              0 0 12px rgba(212, 175, 55, 0.45),
              0 0 24px rgba(212, 175, 55, 0.25);
          }
          50% {
            text-shadow:
              0 0 22px rgba(212, 175, 55, 0.75),
              0 0 40px rgba(212, 175, 55, 0.4);
          }
        }
        @keyframes nikahAmpTilt {
          0%,
          100% {
            transform: rotate(0deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }
        @keyframes nikahLivePulse {
          0%,
          100% {
            box-shadow: 0 5px 20px rgba(220, 38, 38, 0.4), 0 0 0 0 rgba(220, 38, 38, 0.55);
          }
          50% {
            box-shadow: 0 5px 20px rgba(220, 38, 38, 0.4), 0 0 0 14px rgba(220, 38, 38, 0);
          }
        }
        @keyframes nikahLiveBlink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        @keyframes nikahCountdownDots {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(30px, 30px);
          }
        }
        @keyframes nikahFadeUp {
          from {
            opacity: 0;
            transform: translateY(36px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          opacity: 0.035,
          backgroundImage: `repeating-linear-gradient(45deg, ${EMERALD} 0px, ${EMERALD} 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, ${GOLD} 0px, ${GOLD} 2px, transparent 2px, transparent 10px)`,
        }}
        aria-hidden
      />

      {!reduceMotion ? (
        <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden" aria-hidden>
          {stars.map((s) => (
            <span
              key={s.id}
              className="absolute text-[color:var(--nikah-gold)]"
              style={{
                ["--nikah-gold" as string]: GOLD,
                left: s.left,
                bottom: "-8%",
                fontSize: s.sizePx,
                animationName: "nikahStarRise",
                animationDuration: `${s.durationSec}s`,
                animationTimingFunction: "linear",
                animationIterationCount: "infinite",
                animationDelay: `${s.delaySec}s`,
                animationFillMode: "both",
              }}
            >
              {s.symbol}
            </span>
          ))}
        </div>
      ) : null}

      <header className="relative z-30 border-b border-white/40 bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="gap-2" style={{ color: EMERALD }}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <span className="font-nikah-display text-lg font-semibold md:text-xl" style={{ color: EMERALD }}>
            Nikah · Live Stream
          </span>
          <span className="w-14 md:w-24" />
        </div>
      </header>

      <section
        className="relative z-[3] flex min-h-[100vh] flex-col overflow-hidden px-4 py-12 text-center md:py-16"
        style={{
          background: `linear-gradient(135deg, ${EMERALD} 0%, ${DEEP_GREEN} 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            opacity: 0.12,
            backgroundImage: `radial-gradient(circle, ${GOLD} 2px, transparent 2px)`,
            backgroundSize: "50px 50px",
            animation: reduceMotion ? undefined : "nikahPatternDrift 32s linear infinite",
          }}
          aria-hidden
        />

        {heroBackdrop ? (
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25"
            style={{ backgroundImage: `url(${heroBackdrop})` }}
            aria-hidden
          />
        ) : null}

        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[100px] border-b-[3px]"
          style={{
            borderColor: GOLD,
            background: "linear-gradient(to bottom, rgba(212, 175, 55, 0.28), transparent)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[100px] border-t-[3px]"
          style={{
            borderColor: GOLD,
            background: "linear-gradient(to top, rgba(212, 175, 55, 0.28), transparent)",
          }}
          aria-hidden
        />

        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col justify-center">
          <div
            className="mx-auto w-full max-w-3xl"
            style={{ animation: reduceMotion ? undefined : "nikahFadeUp 1.2s ease-out both" }}
          >
          <p
            className="font-nikah-amiri text-2xl font-normal leading-relaxed text-[color:var(--nikah-gold)] md:text-4xl"
            dir="rtl"
            style={{
              ["--nikah-gold" as string]: GOLD,
              animation: reduceMotion ? undefined : "nikahGoldGlow 3s ease-in-out infinite",
            }}
          >
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>

          <div
            className="mx-auto mt-4 text-5xl md:text-6xl"
            style={{ color: GOLD }}
            aria-hidden
          >
            ☪
          </div>

          <h1 className="font-nikah-display mt-5 text-4xl font-semibold leading-tight text-[color:var(--nikah-ivory)] md:text-6xl [text-shadow:0_4px_18px_rgba(0,0,0,0.45)]" style={{ ["--nikah-ivory" as string]: IVORY }}>
            {nameParts[1] ? (
              <>
                {nameParts[0]}{" "}
                <span
                  className="inline-block text-[color:var(--nikah-gold)]"
                  style={{
                    ["--nikah-gold" as string]: GOLD,
                    animation: reduceMotion ? undefined : "nikahAmpTilt 3s ease-in-out infinite",
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

          <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-[color:var(--nikah-ivory)]/90 md:text-base" style={{ ["--nikah-ivory" as string]: IVORY }}>
            {eventDescription}
          </p>
          </div>
        </div>

        <button
          type="button"
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 cursor-pointer border-0 bg-transparent p-2"
          style={{ color: GOLD }}
          onClick={scrollToCountdown}
          aria-label="Scroll to countdown"
        >
          <ChevronDown className={cn("h-8 w-8", !reduceMotion && "animate-bounce")} />
        </button>
      </section>

      <div className="relative z-[3] py-10 text-center" style={{ backgroundColor: CREAM }}>
        <span className="inline-block text-4xl motion-safe:animate-[spin_12s_linear_infinite]" style={{ color: EMERALD }} aria-hidden>
          ✵
        </span>
      </div>

      <section
        id="nikah-countdown-preview"
        className="relative z-[3] overflow-hidden px-4 py-16 text-center"
        style={{ background: `linear-gradient(135deg, ${GOLD}, ${DARK_GOLD})` }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='3' fill='white' opacity='0.12'/%3E%3C/svg%3E")`,
            backgroundSize: "30px 30px",
            animation: reduceMotion ? undefined : "nikahCountdownDots 22s linear infinite",
          }}
          aria-hidden
        />
        <h2 className="relative z-[2] font-nikah-display text-3xl font-semibold md:text-5xl" style={{ color: DEEP_GREEN }}>
          {countdown.past ? "Alhamdulillah!" : "Ceremony Begins In"}
        </h2>
        <p className="relative z-[2] mt-3 font-nikah-amiri text-lg italic md:text-xl" style={{ color: DEEP_GREEN }}>
          {countdown.past ? "May Allah bless our union" : "Join us for this blessed occasion"}
        </p>
        <div className="relative z-[2] mx-auto mt-10 flex flex-wrap justify-center gap-4 md:gap-8">
          {(["d", "h", "m", "s"] as const).map((k, i) => {
            const labels = ["Days", "Hours", "Minutes", "Seconds"]
            const vals = [countdown.d, countdown.h, countdown.m, countdown.s]
            return (
              <div
                key={k}
                className="min-w-[100px] rounded-2xl border-[3px] bg-white/95 px-5 py-6 shadow-lg md:min-w-[130px] md:px-6"
                style={{ borderColor: EMERALD }}
              >
                <span className="font-nikah-display text-3xl font-bold tabular-nums md:text-4xl" style={{ color: EMERALD }}>
                  {String(vals[i]).padStart(2, "0")}
                </span>
                <div className="mt-2 font-nikah-sans text-xs font-medium uppercase tracking-widest text-[color:var(--nikah-text)]" style={{ ["--nikah-text" as string]: TEXT_DARK }}>
                  {labels[i]}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="relative z-[3] px-4 py-16 md:px-6" style={{ backgroundColor: IVORY }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="font-nikah-display text-4xl font-semibold md:text-5xl" style={{ color: EMERALD }}>
              Watch Live Stream
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-light md:text-lg">Witness our blessed union from anywhere in the world</p>
            <div
              className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full px-8 py-3 font-semibold text-white"
              style={{
                backgroundColor: "#dc2626",
                animation: reduceMotion ? undefined : "nikahLivePulse 2s ease-in-out infinite",
              }}
            >
              <span
                className="h-3.5 w-3.5 rounded-full bg-white"
                style={{ animation: reduceMotion ? undefined : "nikahLiveBlink 1.5s ease-in-out infinite" }}
              />
              STREAMING LIVE
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              className={cn("rounded-full border-2 px-6 font-nikah-sans", platform === "youtube" && "text-white")}
              style={{
                borderColor: EMERALD,
                backgroundColor: platform === "youtube" ? EMERALD : "white",
                color: platform === "youtube" ? "white" : EMERALD,
              }}
              onClick={() => setPlatform("youtube")}
            >
              <Youtube className="mr-2 h-4 w-4" />
              YouTube Live
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-2 px-6 font-nikah-sans"
              style={{
                borderColor: EMERALD,
                backgroundColor: platform === "custom" ? EMERALD : "white",
                color: platform === "custom" ? "white" : EMERALD,
              }}
              onClick={() => setPlatform("custom")}
            >
              <Video className="mr-2 h-4 w-4" />
              Custom link
            </Button>
          </div>

          {platform === "custom" ? (
            <div className="mx-auto mt-6 max-w-2xl space-y-3">
              <Input
                placeholder="Stream URL or embed…"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="rounded-xl border-2 font-nikah-sans"
                style={{ borderColor: EMERALD }}
              />
              <Button className="w-full rounded-xl font-nikah-sans" style={{ backgroundColor: EMERALD }}>
                Load stream
              </Button>
            </div>
          ) : null}

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.8fr_1fr] lg:items-start">
            <div
              className="relative overflow-hidden rounded-[20px] border-4 bg-black shadow-xl"
              style={{ borderColor: GOLD }}
            >
              <div className="flex aspect-video items-center justify-center bg-zinc-900">
                <div className="text-center text-white/80">
                  <Radio className="mx-auto h-12 w-12 opacity-80" />
                  <p className="mt-4 font-nikah-sans text-sm">Preview embed</p>
                </div>
              </div>
            </div>

            <div
              className="flex max-h-[480px] flex-col overflow-hidden rounded-[20px] border-[3px] bg-white shadow-xl lg:max-h-[none] lg:min-h-[360px]"
              style={{ borderColor: EMERALD }}
            >
              <div
                className="px-5 py-4 text-center text-white"
                style={{
                  background: `linear-gradient(135deg, ${EMERALD}, ${DEEP_GREEN})`,
                  borderBottom: `3px solid ${GOLD}`,
                }}
              >
                <h3 className="flex items-center justify-center gap-2 font-nikah-sans text-lg font-semibold">
                  <MessageCircle className="h-5 w-5" />
                  Live messages
                </h3>
                <p className="mt-1 text-sm opacity-90">Share your duas and blessings</p>
              </div>
              <ScrollArea className="min-h-[200px] flex-1 p-4">
                <div className="space-y-3 pr-2">
                  {MOCK_CHAT.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border-l-4 bg-white p-4 shadow-sm"
                      style={{ borderColor: GOLD }}
                    >
                      <p className="font-nikah-sans text-sm font-semibold" style={{ color: EMERALD }}>
                        ✦ {m.user}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed">{m.message}</p>
                      <p className="mt-2 text-xs italic text-muted-foreground">{m.time}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t-[3px] p-4" style={{ borderColor: GOLD }}>
                <div className="space-y-2">
                  <Input
                    placeholder="Your name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="rounded-xl border-2 font-nikah-sans"
                    style={{ borderColor: EMERALD }}
                  />
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Your message…"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      className="flex-1 rounded-xl border-2 font-nikah-sans"
                      style={{ borderColor: EMERALD }}
                    />
                    <Button type="button" className="rounded-xl font-nikah-sans sm:shrink-0" style={{ backgroundColor: EMERALD }}>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative z-[3] px-4 py-16 md:px-6"
        style={{ background: `linear-gradient(135deg, ${CREAM}, ${LIGHT_GOLD})` }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="font-nikah-display text-4xl font-semibold" style={{ color: EMERALD }}>
            Event details
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { icon: Calendar, title: "Date", body: "Saturday, December 31st, 2024\n15 Jumada al-Thani 1446" },
              { icon: MapPin, title: "Venue", body: "Grand Masjid Hall\n123 Islamic Center Way" },
              { icon: Clock, title: "Time", body: "Nikah: 2:00 PM\nWalima: 6:00 PM" },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border-2 bg-white p-8 text-center shadow-md transition-transform hover:-translate-y-1"
                style={{ borderColor: GOLD }}
              >
                <card.icon className="mx-auto h-10 w-10" style={{ color: EMERALD }} />
                <h3 className="font-nikah-display mt-4 text-xl font-semibold" style={{ color: EMERALD }}>
                  {card.title}
                </h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-[3] px-4 py-14 text-center text-white" style={{ backgroundColor: DEEP_GREEN }}>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(to right, ${GOLD}, ${EMERALD}, ${GOLD})` }}
          aria-hidden
        />
        <p className="text-3xl" style={{ color: GOLD }}>
          ☪ ✵ ☪
        </p>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed md:text-base">
          We are honored to have you join us for this blessed occasion. May Allah accept this nikah and bless our union with His infinite mercy.
        </p>
        <p className="font-nikah-amiri mx-auto mt-8 max-w-2xl text-lg italic leading-relaxed" style={{ color: GOLD }}>
          &ldquo;Our Lord, grant us from among our spouses and offspring comfort to our eyes and make us an example for the righteous.&rdquo;
          <br />
          <strong className="font-nikah-sans not-italic">— Surah Al-Furqan (25:74)</strong>
        </p>
        <div
          className="mx-auto mt-8 max-w-lg rounded-2xl border p-6 text-sm"
          style={{ borderColor: GOLD, backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <strong>Dua for the newlyweds</strong>
          <p className="mt-2 font-nikah-amiri italic">Barak Allahu laka wa baraka &apos;alayka wa jama&apos;a baynakuma fi khair</p>
          <p className="mt-2 text-xs opacity-90">May Allah bless you and join you together in goodness</p>
        </div>
      </footer>
    </div>
  )
}
