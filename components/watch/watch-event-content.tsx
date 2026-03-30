"use client"

import type { FormEvent } from "react"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import type { LiveEvent } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Radio,
  Eye,
  Users,
  MessageCircle,
  Send,
  Lock,
  Play,
  Cake,
  Calendar,
  Share2,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Settings,
  Loader2,
  Check,
  PauseCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"
import { EventTemplateBanner } from "./event-template-banner"
import { CorporateTechForwardWatchView } from "./corporate-tech-forward-watch-view"
import { WeddingTraditionalHinduWatchView } from "./wedding-traditional-hindu-watch-view"
import { MemorialServiceWatchView, formatMemorialDate } from "./memorial-service-watch-view"
import { cn } from "@/lib/utils"
import {
  cardTitleFontSizeStyle,
  googleFontsStylesheetHref,
  heroTitleFontSizeStyle,
  pageTitleFontSizeStyle,
  resolveTitleGoogleFontFamily,
  resolveTitleHeroRem,
  titleFallbackFontClass,
} from "@/lib/event-title-typography"
import { applyFaviconHrefToDocument } from "@/lib/favicon-dom"
import { getWatchPageSkin } from "@/lib/watch-template-skin"

function parseWatchTemplateData(raw: unknown): Record<string, unknown> {
  if (raw == null || raw === "") return {}
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
      return {}
    } catch {
      return {}
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  return {}
}

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: Date
}

/** Stream / chat / details chrome for wedding skins */
type WatchChromeTheme =
  | "default"
  | "wedding"
  | "garden"
  | "midnight"
  | "coastal"
  | "celestial"
  | "traditionalHindu"
  | "corporateTech"
  | "memorial"

const GALLERY_AUTO_SCROLL_MS = 4500

function WatchPhotoGallery({ urls, theme }: { urls: string[]; theme: WatchChromeTheme }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pauseAutoScrollRef = useRef(false)

  const borderClass =
    theme === "wedding"
      ? "border-amber-200/70"
      : theme === "garden"
        ? "border-emerald-200/70"
        : theme === "midnight"
          ? "border-amber-600/45"
          : theme === "coastal"
            ? "border-teal-300/70"
            : theme === "celestial"
              ? "border-violet-500/50"
              : theme === "traditionalHindu"
                ? "border-amber-400/65"
                : theme === "corporateTech"
                  ? "border-blue-500/40"
                  : theme === "memorial"
                    ? "border-[#c9a961]/70"
                    : "border-border"

  const galleryFocusRing =
    theme === "wedding"
      ? "focus-visible:ring-amber-400/80"
      : theme === "garden"
        ? "focus-visible:ring-emerald-400/80"
        : theme === "midnight"
          ? "focus-visible:ring-amber-500/60"
          : theme === "coastal"
            ? "focus-visible:ring-teal-400/80"
            : theme === "celestial"
              ? "focus-visible:ring-yellow-400/70"
              : theme === "traditionalHindu"
                ? "focus-visible:ring-amber-500/70"
                : theme === "corporateTech"
                  ? "focus-visible:ring-blue-400/70"
                  : theme === "memorial"
                    ? "focus-visible:ring-[#c9a961]/80"
                    : "focus-visible:ring-ring"

  const getStepWidth = useCallback(() => {
    const el = scrollRef.current
    if (!el) return 0
    const slide = el.querySelector<HTMLElement>("[data-gallery-slide]")
    if (!slide) return 0
    return slide.offsetWidth + 8
  }, [])

  const scrollGalleryBy = useCallback(
    (dir: -1 | 1) => {
      const el = scrollRef.current
      if (!el) return
      const step = getStepWidth()
      if (!step) return
      const maxScroll = el.scrollWidth - el.clientWidth
      let next = el.scrollLeft + dir * step
      if (next < 0) next = maxScroll
      if (next > maxScroll) next = 0
      el.scrollTo({ left: next, behavior: "smooth" })
    },
    [getStepWidth],
  )

  useEffect(() => {
    if (urls.length <= 1) return
    const el = scrollRef.current
    if (!el) return

    const id = window.setInterval(() => {
      if (pauseAutoScrollRef.current) return
      const step = getStepWidth()
      if (!step) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (maxScroll <= 0) return
      let next = el.scrollLeft + step
      if (next >= maxScroll - 2) next = 0
      el.scrollTo({ left: next, behavior: "smooth" })
    }, GALLERY_AUTO_SCROLL_MS)

    return () => window.clearInterval(id)
  }, [urls.length, getStepWidth])

  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        setLightboxIndex((i) =>
          i === null ? null : i === 0 ? urls.length - 1 : i - 1,
        )
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        setLightboxIndex((i) =>
          i === null ? null : i === urls.length - 1 ? 0 : i + 1,
        )
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxIndex, urls.length])

  const openLightbox = (i: number) => setLightboxIndex(i)
  const closeLightbox = () => setLightboxIndex(null)

  const lightboxPrev = () =>
    setLightboxIndex((i) =>
      i === null ? null : i === 0 ? urls.length - 1 : i - 1,
    )
  const lightboxNext = () =>
    setLightboxIndex((i) =>
      i === null ? null : i === urls.length - 1 ? 0 : i + 1,
    )

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => {
          pauseAutoScrollRef.current = true
        }}
        onMouseLeave={() => {
          pauseAutoScrollRef.current = false
        }}
      >
        {urls.length > 1 ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`absolute left-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full shadow-md ${
                theme === "wedding"
                  ? "border-amber-300/80 bg-[#fefae0]/95 text-stone-800 hover:bg-[#fefae0]"
                  : theme === "garden"
                    ? "border-emerald-300/80 bg-white/95 text-emerald-900 hover:bg-emerald-50"
                    : theme === "midnight"
                      ? "border-amber-500/50 bg-black/90 text-amber-200 hover:bg-amber-950/50"
                      : theme === "coastal"
                        ? "border-teal-300/80 bg-white/95 text-[#006d77] hover:bg-teal-50"
                        : theme === "celestial"
                          ? "border-yellow-500/40 bg-black/85 text-yellow-200 hover:bg-violet-950/80"
                          : theme === "traditionalHindu"
                            ? "border-amber-400/80 bg-[#FFF8DC]/95 text-red-900 hover:bg-amber-50"
                            : theme === "corporateTech"
                              ? "border-blue-500/40 bg-black/90 text-blue-200 hover:bg-blue-950/40"
                              : theme === "memorial"
                                ? "border-[#c9a961]/80 bg-[#f8f5f0]/95 text-[#2c3e50] hover:bg-[#ecf0f1]"
                                : ""
              }`}
              aria-label="Scroll gallery left"
              onClick={() => scrollGalleryBy(-1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={`absolute right-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full shadow-md ${
                theme === "wedding"
                  ? "border-amber-300/80 bg-[#fefae0]/95 text-stone-800 hover:bg-[#fefae0]"
                  : theme === "garden"
                    ? "border-emerald-300/80 bg-white/95 text-emerald-900 hover:bg-emerald-50"
                    : theme === "midnight"
                      ? "border-amber-500/50 bg-black/90 text-amber-200 hover:bg-amber-950/50"
                      : theme === "coastal"
                        ? "border-teal-300/80 bg-white/95 text-[#006d77] hover:bg-teal-50"
                        : theme === "celestial"
                          ? "border-yellow-500/40 bg-black/85 text-yellow-200 hover:bg-violet-950/80"
                          : theme === "traditionalHindu"
                            ? "border-amber-400/80 bg-[#FFF8DC]/95 text-red-900 hover:bg-amber-50"
                            : theme === "corporateTech"
                              ? "border-blue-500/40 bg-black/90 text-blue-200 hover:bg-blue-950/40"
                              : theme === "memorial"
                                ? "border-[#c9a961]/80 bg-[#f8f5f0]/95 text-[#2c3e50] hover:bg-[#ecf0f1]"
                                : ""
              }`}
              aria-label="Scroll gallery right"
              onClick={() => scrollGalleryBy(1)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        ) : null}
        <div
          ref={scrollRef}
          onTouchStart={() => {
            pauseAutoScrollRef.current = true
          }}
          onTouchEnd={() => {
            window.setTimeout(() => {
              pauseAutoScrollRef.current = false
            }, 2500)
          }}
          className={`flex gap-2 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden ${
            urls.length > 1 ? "px-10" : "px-0"
          }`}
        >
          {urls.map((url, i) => (
            <button
              key={`${i}-${url}`}
              type="button"
              data-gallery-slide
              className={`relative aspect-square w-[min(280px,78vw)] shrink-0 snap-center overflow-hidden rounded-lg border text-left transition-opacity hover:opacity-95 focus:outline-none focus-visible:ring-2 ${galleryFocusRing} ${borderClass}`}
              onClick={() => openLightbox(i)}
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <Dialog open={lightboxIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent
          showCloseButton
          className="max-h-[96vh] w-[min(96vw,1200px)] max-w-[96vw] border-none bg-zinc-950/97 p-3 shadow-2xl sm:max-w-[min(96vw,1200px)] [&>button]:text-white [&>button]:hover:bg-white/10"
        >
          <DialogTitle className="sr-only">
            {lightboxIndex !== null && urls.length > 1
              ? `Gallery image ${lightboxIndex + 1} of ${urls.length}`
              : "Gallery image"}
          </DialogTitle>
          {lightboxIndex !== null && urls[lightboxIndex] ? (
            <div className="relative flex min-h-[50vh] items-center justify-center">
              {urls.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 z-10 h-11 w-11 -translate-y-1/2 text-white hover:bg-white/15"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation()
                    lightboxPrev()
                  }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              ) : null}
              <img
                src={urls[lightboxIndex]}
                alt=""
                className="max-h-[min(85vh,900px)] w-full max-w-full object-contain"
              />
              {urls.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 z-10 h-11 w-11 -translate-y-1/2 text-white hover:bg-white/15"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation()
                    lightboxNext()
                  }}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              ) : null}
              {urls.length > 1 ? (
                <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center text-xs text-white/70">
                  {lightboxIndex + 1} / {urls.length}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Floating petals — matches reference wedding HTML (createPetals + .petal + @keyframes fall). */
interface WeddingHtmlPetal {
  id: number
  left: string
  duration: string
  delay: string
  background: string
}

interface GardenFloatingFlower {
  id: number
  left: string
  duration: string
  delay: string
  emoji: string
}

/** Gold dust — Midnight Elegance watch skin */
interface MidnightParticle {
  id: number
  left: string
  duration: string
  delay: string
}

/** Rising bubbles — Coastal Breeze watch skin */
interface CoastalBubble {
  id: number
  left: string
  size: string
  duration: string
  delay: string
}

/** Twinkling stars — Celestial Dreams watch skin */
interface CelestialStar {
  id: number
  left: string
  top: string
  size: string
  duration: string
  delay: string
}

/** Floating hearts — Christian wedding rose skin */
interface ChristianRoseHeart {
  id: number
  left: string
  duration: string
  size: number
  delay: string
  /** Horizontal sway (px) at each leg of the rise — per heart for organic drift */
  d0: number
  d1: number
  d2: number
  d3: number
  d4: number
}

/** Floating stars / crescents — Muslim Nikah watch skin */
interface NikahStarParticle {
  id: number
  left: string
  duration: string
  delay: string
  size: number
  symbol: "✦" | "☪"
}

/** Floating emoji — birthday party watch skin */
interface BirthdayFloatParticle {
  id: number
  left: string
  duration: string
  delay: string
  size: number
  symbol: string
}

/** Small square confetti — birthday party watch skin */
interface BirthdayConfettiPiece {
  id: number
  left: string
  duration: string
  delay: string
  size: number
  heightMul: number
  color: string
}

export function WatchEventContent({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<LiveEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [viewerCount, setViewerCount] = useState(0)
  const [shareCopied, setShareCopied] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [quality, setQuality] = useState("Auto")
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const replayIframeRef = useRef<HTMLIFrameElement | null>(null)
  const [isReplayPlaying, setIsReplayPlaying] = useState(false)
  const eventStatusRef = useRef<string | null>(null)
  const presenceRegistered = useRef(false)
  const countdownZeroRefetchSentRef = useRef(false)
  const [gardenFlowers, setGardenFlowers] = useState<GardenFloatingFlower[]>([])
  const [midnightParticles, setMidnightParticles] = useState<MidnightParticle[]>([])
  const [coastalBubbles, setCoastalBubbles] = useState<CoastalBubble[]>([])
  const [celestialStars, setCelestialStars] = useState<CelestialStar[]>([])
  const [roseHearts, setRoseHearts] = useState<ChristianRoseHeart[]>([])
  const roseHeartIdRef = useRef(0)
  const [nikahStars, setNikahStars] = useState<NikahStarParticle[]>([])
  const nikahStarIdRef = useRef(0)
  const [birthdayFloaters, setBirthdayFloaters] = useState<BirthdayFloatParticle[]>([])
  const birthdayFloaterIdRef = useRef(0)
  const [birthdayConfetti, setBirthdayConfetti] = useState<BirthdayConfettiPiece[]>([])
  const birthdayConfettiIdRef = useRef(0)

  const fetchWatchEvent = useCallback(async (): Promise<LiveEvent | null> => {
    try {
      const res = await fetch(`/api/watch/${eventId}`)
      if (!res.ok) return null
      const data = await res.json()
      return data.event as LiveEvent
    } catch {
      return null
    }
  }, [eventId])

  const applyPolledEvent = useCallback((ev: LiveEvent) => {
    setEvent(ev)
    setViewerCount(ev.currentViewers ?? 0)
    eventStatusRef.current = ev.status
  }, [])

  const showScheduledPageEnabled =
    event != null && (event as unknown as Record<string, unknown>).showScheduledPage === true

  // Countdown only when "scheduled page" is enabled (matches event settings / generic countdown page).
  useEffect(() => {
    if (event?.status !== "scheduled" || !event.scheduledAt || !showScheduledPageEnabled) return
    countdownZeroRefetchSentRef.current = false
    const targetMs = new Date(event.scheduledAt as unknown as string).getTime()
    const tick = () => {
      const diff = targetMs - Date.now()
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        if (!countdownZeroRefetchSentRef.current) {
          countdownZeroRefetchSentRef.current = true
          void fetchWatchEvent().then((ev) => {
            if (ev) applyPolledEvent(ev)
          })
        }
        return
      }
      countdownZeroRefetchSentRef.current = false
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [event?.status, event?.scheduledAt, showScheduledPageEnabled, fetchWatchEvent, applyPolledEvent])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.title ?? "Live Event", url })
        return
      } catch {
        // fall through to clipboard copy
      }
    }
    await navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  // Real viewer presence tracking
  useEffect(() => {
    const join = () => {
      if (presenceRegistered.current) return
      presenceRegistered.current = true
      fetch(`/api/watch/${eventId}/presence`, { method: "POST" }).catch(() => {})
    }
    const leave = () => {
      if (!presenceRegistered.current) return
      presenceRegistered.current = false
      fetch(`/api/watch/${eventId}/presence`, { method: "DELETE", keepalive: true }).catch(() => {})
    }
    join()
    window.addEventListener("beforeunload", leave)
    return () => {
      window.removeEventListener("beforeunload", leave)
      leave()
    }
  }, [eventId])

  /** Event-scoped favicon (platform → event studio → default); restore session favicon on leave. */
  useEffect(() => {
    const href = event?.faviconHref
    if (!href) return
    applyFaviconHrefToDocument(href)
    return () => {
      void fetch("/api/favicon/resolve", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { href?: string } | null) => {
          if (data?.href) applyFaviconHrefToDocument(data.href)
        })
        .catch(() => {})
    }
  }, [event?.faviconHref])

  /** Faster polls while scheduled so live/ended transitions show without long delay. */
  const watchPollIntervalMs = event?.status === "scheduled" ? 3000 : 5000

  useEffect(() => {
    let cancelled = false

    fetchWatchEvent().then((ev) => {
      if (cancelled) return
      if (ev) {
        setEvent(ev)
        eventStatusRef.current = ev.status
        setIsPasswordProtected(!!ev.isPasswordProtected)
        setIsAuthenticated(!ev.isPasswordProtected)
        setViewerCount(ev.currentViewers ?? 0)
      }
      setLoading(false)
    })

    const intervalId = setInterval(async () => {
      if (cancelled) return
      const ev = await fetchWatchEvent()
      if (!ev) return
      applyPolledEvent(ev)
      if (ev.status === "ended" || ev.status === "completed") {
        clearInterval(intervalId)
      }
    }, watchPollIntervalMs)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [eventId, fetchWatchEvent, applyPolledEvent, watchPollIntervalMs])

  // After backgrounding, sync event (status / viewers) when the tab is visible again.
  useEffect(() => {
    const onVisibleOrFocus = () => {
      if (document.visibilityState !== "visible") return
      void fetchWatchEvent().then((ev) => {
        if (ev) applyPolledEvent(ev)
      })
    }
    document.addEventListener("visibilitychange", onVisibleOrFocus)
    window.addEventListener("focus", onVisibleOrFocus)
    return () => {
      document.removeEventListener("visibilitychange", onVisibleOrFocus)
      window.removeEventListener("focus", onVisibleOrFocus)
    }
  }, [fetchWatchEvent, applyPolledEvent])

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    if ((event as unknown as Record<string, unknown>)?.password === password) {
      setIsAuthenticated(true)
      setPasswordError("")
    } else {
      setPasswordError("Incorrect password")
    }
  }

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    const message: ChatMessage = {
      id: Date.now().toString(),
      user: "You",
      message: newMessage,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, message])
    setNewMessage("")
  }

  const toggleFullscreen = () => {
    const el = videoContainerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  const watchTemplateId = useMemo(() => {
    if (!event) return ""
    const ev = event as unknown as Record<string, unknown>
    const data = parseWatchTemplateData(ev.templateData)
    const fromJson = data.templateId as string | undefined
    const fromColumn = ev.templateId as string | null | undefined
    // App stores slug-style ids (tpl-wedding) in template_data; prefer that over any legacy column value
    return (fromJson && String(fromJson).trim()) || (fromColumn && String(fromColumn).trim()) || ""
  }, [event])

  const watchSkin = getWatchPageSkin(watchTemplateId)
  const streamChrome: WatchChromeTheme =
    watchSkin === "wedding"
      ? "wedding"
      : watchSkin === "weddingGarden"
        ? "garden"
        : watchSkin === "weddingMidnight"
          ? "midnight"
          : watchSkin === "weddingCoastal"
            ? "coastal"
            : watchSkin === "weddingCelestial"
              ? "celestial"
              : watchSkin === "weddingTraditionalHindu"
                ? "traditionalHindu"
                : watchSkin === "christianWeddingRose" || watchSkin === "muslimWeddingNikah"
                  ? "wedding"
                  : watchSkin === "corporateTechForward"
                    ? "corporateTech"
                    : watchSkin === "memorialService"
                      ? "memorial"
                      : "default"

  useEffect(() => {
    if (!event) return
    const ev = event as unknown as Record<string, unknown>
    const td = parseWatchTemplateData(ev.templateData) as Record<string, unknown>
    const family = resolveTitleGoogleFontFamily(td)
    const id = "watch-page-title-google-font"
    if (!family) {
      document.getElementById(id)?.remove()
      return
    }
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement("link")
      link.id = id
      link.rel = "stylesheet"
      document.head.appendChild(link)
    }
    link.href = googleFontsStylesheetHref(family)
  }, [event, watchTemplateId])

  /** Matches reference HTML: 15 petals, random left/duration/delay/gradient, linear infinite fall. */
  const [weddingPetals, setWeddingPetals] = useState<WeddingHtmlPetal[]>([])

  useEffect(() => {
    if (watchSkin !== "wedding") {
      setWeddingPetals([])
      return
    }
    const colors = ["#ffb7b2", "#ffdac1", "#ff9aa2", "#e2f0cb"] as const
    const petals: WeddingHtmlPetal[] = Array.from({ length: 15 }, (_, i) => {
      const c1 = colors[Math.floor(Math.random() * colors.length)]!
      const c2 = colors[Math.floor(Math.random() * colors.length)]!
      return {
        id: i,
        left: `${Math.random() * 100}%`,
        duration: `${Math.random() * 5 + 8}s`,
        delay: `${Math.random() * 5}s`,
        background: `linear-gradient(45deg, ${c1}, ${c2})`,
      }
    })
    setWeddingPetals(petals)
  }, [watchSkin])

  useEffect(() => {
    if (watchSkin !== "christianWeddingRose") {
      setRoseHearts([])
      return
    }
    roseHeartIdRef.current = 0
    const driftPx = () => Math.round((Math.random() - 0.5) * 72)
    const makeHeart = (): ChristianRoseHeart => {
      roseHeartIdRef.current += 1
      const durationSec = Math.random() * 5 + 8
      return {
        id: roseHeartIdRef.current,
        left: `${Math.random() * 94 + 3}%`,
        duration: `${durationSec}s`,
        size: Math.random() * 36 + 44,
        delay: `${(-Math.random() * durationSec).toFixed(2)}s`,
        d0: driftPx(),
        d1: driftPx(),
        d2: driftPx(),
        d3: driftPx(),
        d4: driftPx(),
      }
    }
    setRoseHearts(Array.from({ length: 12 }, () => makeHeart()))
    const add = () => {
      setRoseHearts((prev) => {
        const durationSec = Math.random() * 5 + 8
        roseHeartIdRef.current += 1
        const h: ChristianRoseHeart = {
          id: roseHeartIdRef.current,
          left: `${Math.random() * 94 + 3}%`,
          duration: `${durationSec}s`,
          size: Math.random() * 36 + 44,
          delay: `${(-Math.random() * Math.min(durationSec, 10)).toFixed(2)}s`,
          d0: driftPx(),
          d1: driftPx(),
          d2: driftPx(),
          d3: driftPx(),
          d4: driftPx(),
        }
        return [...prev, h].slice(-16)
      })
    }
    const interval = window.setInterval(add, 2200)
    return () => window.clearInterval(interval)
  }, [watchSkin])

  useEffect(() => {
    if (watchSkin !== "muslimWeddingNikah") {
      setNikahStars([])
      return
    }
    nikahStarIdRef.current = 0
    const makeStar = (): NikahStarParticle => {
      nikahStarIdRef.current += 1
      const durationSec = Math.random() * 12 + 14
      return {
        id: nikahStarIdRef.current,
        left: `${Math.random() * 100}%`,
        duration: `${durationSec}s`,
        delay: `${Math.random() * 5}s`,
        size: Math.random() * 28 + 26,
        symbol: Math.random() > 0.5 ? "✦" : "☪",
      }
    }
    setNikahStars(Array.from({ length: 10 }, () => makeStar()))
    const add = () => {
      setNikahStars((prev) => [...prev.slice(-22), makeStar()])
    }
    const interval = window.setInterval(add, 3500)
    return () => window.clearInterval(interval)
  }, [watchSkin])

  useEffect(() => {
    if (watchSkin !== "birthdayParty") {
      setBirthdayFloaters([])
      setBirthdayConfetti([])
      return
    }
    birthdayFloaterIdRef.current = 0
    birthdayConfettiIdRef.current = 0
    const symbols = ["🎈", "🎉", "🎊", "🎁", "🥳"]
    const confettiColors = ["#fde047", "#7dd3fc", "#86efac", "#fb923c", "#9f1239", "#fbcfe8", "#c084fc", "#f9a8d4"]
    const make = (): BirthdayFloatParticle => {
      birthdayFloaterIdRef.current += 1
      const durationSec = Math.random() * 8 + 12
      return {
        id: birthdayFloaterIdRef.current,
        left: `${Math.random() * 100}%`,
        duration: `${durationSec}s`,
        delay: `${Math.random() * 4}s`,
        size: Math.random() * 16 + 20,
        symbol: symbols[Math.floor(Math.random() * symbols.length)]!,
      }
    }
    const makeConfetti = (): BirthdayConfettiPiece => {
      birthdayConfettiIdRef.current += 1
      const durationSec = Math.random() * 8 + 12
      return {
        id: birthdayConfettiIdRef.current,
        left: `${Math.random() * 100}%`,
        duration: `${durationSec}s`,
        delay: `${Math.random() * 5}s`,
        size: Math.random() * 5 + 6,
        heightMul: Math.random() > 0.5 ? 1.15 : 1,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)]!,
      }
    }
    setBirthdayFloaters(Array.from({ length: 12 }, () => make()))
    setBirthdayConfetti(Array.from({ length: 42 }, () => makeConfetti()))
    const add = () => {
      setBirthdayFloaters((prev) => [...prev.slice(-26), make()])
      setBirthdayConfetti((prev) => [...prev.slice(-48), makeConfetti(), makeConfetti()])
    }
    const interval = window.setInterval(add, 2800)
    return () => window.clearInterval(interval)
  }, [watchSkin])

  useEffect(() => {
    if (watchSkin !== "weddingGarden") {
      setGardenFlowers([])
      return
    }
    const emojis = ["🌸", "🌺", "🌻", "🌷", "🌹"] as const
    setGardenFlowers(
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: `${Math.random() * 10 + 10}s`,
        delay: `${Math.random() * 10}s`,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]!,
      })),
    )
  }, [watchSkin])

  useEffect(() => {
    if (watchSkin !== "weddingMidnight") {
      setMidnightParticles([])
      return
    }
    setMidnightParticles(
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: `${Math.random() * 22 + 14}s`,
        delay: `${Math.random() * 12}s`,
      })),
    )
  }, [watchSkin])

  useEffect(() => {
    if (watchSkin !== "weddingCoastal") {
      setCoastalBubbles([])
      return
    }
    setCoastalBubbles(
      Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 22 + 12}px`,
        duration: `${Math.random() * 5 + 5}s`,
        delay: `${Math.random() * 5}s`,
      })),
    )
  }, [watchSkin])

  useEffect(() => {
    if (watchSkin !== "weddingCelestial") {
      setCelestialStars([])
      return
    }
    setCelestialStars(
      Array.from({ length: 120 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: `${Math.random() * 2.5 + 1}px`,
        duration: `${Math.random() * 7 + 5}s`,
        delay: `${Math.random() * 10}s`,
      })),
    )
  }, [watchSkin])

  const REACTION_EMOJIS: Record<string, string> = {
    heart: "❤️",
    thumbsup: "👍",
    laugh: "😂",
    fire: "🔥",
    clap: "👏",
  }

  const REACTION_TYPES = [
    { type: "heart", emoji: "❤️" },
    { type: "thumbsup", emoji: "👍" },
    { type: "laugh", emoji: "😂" },
    { type: "fire", emoji: "🔥" },
    { type: "clap", emoji: "👏" },
  ] as const

  const handleReaction = (type: string) => {
    const emoji = REACTION_EMOJIS[type] ?? "❤️"
    const newEmojis = Array.from({ length: 3 }, (_, i) => ({
      id: Date.now() + i,
      emoji,
      x: 10 + Math.random() * 80,
    }))
    setFloatingEmojis(prev => [...prev, ...newEmojis])
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => !newEmojis.find(n => n.id === e.id)))
    }, 2500)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Radio className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Event Not Found</h1>
          <p className="text-muted-foreground">This event may have ended or doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  if (isPasswordProtected && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">This Event is Private</CardTitle>
            <p className="text-muted-foreground">Enter the password to watch this stream</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Enter event password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-0"
                />
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              </div>
              <Button type="submit" className="w-full">
                <Play className="mr-2 h-4 w-4" />
                Watch Stream
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const evRawTop = event as unknown as Record<string, unknown>
  const templateId = watchTemplateId
  const templateData = parseWatchTemplateData(evRawTop.templateData)
  /** Include tpl-default so event title uses template default (or custom) font + size from Design settings */
  const showTemplateBanner = !!templateId?.trim()

  const titleMeta = templateData as Record<string, unknown>
  const googleTitleFont = resolveTitleGoogleFontFamily(titleMeta)
  const titleHeroRem = resolveTitleHeroRem(titleMeta, watchTemplateId)

  type EventDate = { id: string; label: string; scheduledAt: string; timezone: string; sortOrder: number }
  const eventDates: EventDate[] = Array.isArray(evRawTop.eventDates)
    ? (evRawTop.eventDates as EventDate[]).sort((a, b) => a.sortOrder - b.sortOrder)
    : []

  const formatExtraDate = (d: EventDate) => {
    const dt = new Date(d.scheduledAt)
    const tz = d.timezone && d.timezone !== "UTC" ? d.timezone : undefined
    const dateStr = dt.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric" })
    const timeStr = dt.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
    const tzLabel = tz ? new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortGeneric" })
      .formatToParts(dt).find(p => p.type === "timeZoneName")?.value ?? "" : "UTC"
    return `${dateStr} · ${timeStr} ${tzLabel}`
  }

  // Wedding (and other themed) layouts include their own scheduled hero + countdown — don't replace with the generic scheduled-only page.
  if (
    event.status === "scheduled" &&
    showScheduledPageEnabled &&
    watchSkin !== "wedding" &&
    watchSkin !== "weddingGarden" &&
    watchSkin !== "weddingMidnight" &&
    watchSkin !== "weddingCoastal" &&
    watchSkin !== "weddingCelestial" &&
    watchSkin !== "weddingTraditionalHindu" &&
    watchSkin !== "christianWeddingRose" &&
    watchSkin !== "muslimWeddingNikah" &&
    watchSkin !== "birthdayParty" &&
    watchSkin !== "corporateTechForward" &&
    watchSkin !== "memorialService"
  ) {
    const tz = evRawTop.timezone as string | undefined
    const tzId = tz && tz !== "UTC" ? tz : undefined
    const d = new Date(event.scheduledAt as unknown as string)
    const dateStr = d.toLocaleDateString("en-US", { timeZone: tzId, weekday: "long", year: "numeric", month: "long", day: "numeric" })
    const timeStr = d.toLocaleTimeString("en-US", { timeZone: tzId, hour: "2-digit", minute: "2-digit" })
    const tzLabel = tzId
      ? new Intl.DateTimeFormat("en-US", { timeZone: tzId, timeZoneName: "shortGeneric" })
          .formatToParts(d).find(p => p.type === "timeZoneName")?.value ?? tzId.split("/").pop()?.replace("_", " ")
      : "UTC"

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="relative w-full aspect-video max-h-[60vh] bg-gradient-to-br from-primary/20 via-background to-primary/5 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative flex items-center justify-center">
            <span className="absolute h-40 w-40 rounded-full bg-primary/10 animate-ping [animation-duration:2s]" />
            <span className="absolute h-28 w-28 rounded-full bg-primary/15 animate-ping [animation-duration:2s] [animation-delay:0.5s]" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 border border-primary/30">
              <Radio className="h-9 w-9 text-primary" />
            </div>
          </div>
          <div className="absolute top-4 left-4">
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Calendar className="h-3 w-3 mr-1" /> Scheduled
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-2xl mx-auto w-full">
          <div className="text-center space-y-1">
            <h1
              className={cn("font-bold", titleFallbackFontClass(watchTemplateId, !!googleTitleFont))}
              style={{
                ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                ...pageTitleFontSizeStyle(titleHeroRem),
              }}
            >
              {event.title}
            </h1>
            {event.description && <p className="text-muted-foreground">{event.description}</p>}
          </div>

          {eventDates.length > 0 && (
            <div className="w-full max-w-sm border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule</p>
              </div>
              <ul className="divide-y divide-border">
                {eventDates.map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                    <span className="text-sm font-medium truncate">{d.label || "Session"}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatExtraDate(d)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {event.scheduledAt && (
            <div className="text-center space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Live stream starts on</p>
              <p className="text-xl font-semibold">{dateStr}</p>
              <p className="text-base font-medium">
                {timeStr}
                <span className="ml-2 text-sm font-normal text-muted-foreground">{tzLabel}</span>
              </p>
            </div>
          )}

          {event.scheduledAt && (
            <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
              {[
                { label: "Days",    value: countdown.days },
                { label: "Hours",   value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3">
                  <span className="text-3xl font-bold tabular-nums">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
                </div>
              ))}
            </div>
          )}

          <Button className="gap-2" onClick={handleShare}>
            {shareCopied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {shareCopied ? "Link Copied!" : "Share Event"}
          </Button>
        </div>
      </div>
    )
  }

  if ((event.status as string) === "on_break") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="relative w-full aspect-video max-h-[60vh] bg-gradient-to-br from-orange-950/40 via-background to-orange-900/10 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent" />
          <div className="relative flex items-center justify-center">
            <span className="absolute h-48 w-48 rounded-full bg-orange-500/10 animate-ping [animation-duration:2s]" />
            <span className="absolute h-32 w-32 rounded-full bg-orange-500/15 animate-ping [animation-duration:2s] [animation-delay:0.6s]" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-orange-500/20 border border-orange-500/40">
              <PauseCircle className="h-10 w-10 text-orange-400 animate-pulse" />
            </div>
          </div>
          <div className="absolute top-4 left-4">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 gap-1">
              <PauseCircle className="h-3 w-3" /> On Break
            </Badge>
          </div>
          <div className="absolute top-4 right-4">
            <Badge className="border border-zinc-500/40 bg-zinc-600/90 text-white gap-1">
              <span className="h-2 w-2 rounded-full bg-zinc-200 animate-pulse inline-block" />
              LIVE
            </Badge>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center px-4 py-8 gap-4 max-w-2xl mx-auto w-full text-center">
          <div className="space-y-1">
            <h1
              className={cn("font-bold", titleFallbackFontClass(watchTemplateId, !!googleTitleFont))}
              style={{
                ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                ...pageTitleFontSizeStyle(titleHeroRem),
              }}
            >
              {event.title}
            </h1>
            {event.description && <p className="text-muted-foreground">{event.description}</p>}
          </div>
          {eventDates.length > 0 && (
            <div className="w-full max-w-sm border border-border rounded-lg overflow-hidden text-left">
              <div className="px-3 py-2 bg-muted/40 border-b border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Schedule</p>
              </div>
              <ul className="divide-y divide-border">
                {eventDates.map((d) => (
                  <li key={d.id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                    <span className="text-sm font-medium truncate">{d.label || "Session"}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatExtraDate(d)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="space-y-1 py-2">
            <p className="text-xl font-semibold text-orange-400">Be Right Back</p>
            <p className="text-muted-foreground text-sm">The streamer is on a short break. We&apos;ll resume shortly — stay tuned!</p>
          </div>
          <Button className="gap-2 mt-2" onClick={handleShare}>
            {shareCopied ? <Check className="h-4 w-4 text-green-400" /> : <Share2 className="h-4 w-4" />}
            {shareCopied ? "Link Copied!" : "Share Event"}
          </Button>
        </div>
      </div>
    )
  }

  const isEnded = event.status === "completed" || event.status === "ended"
  const showRecording = evRawTop.showRecording === true
  const replayBroadcastId = evRawTop.youtubeBroadcastId as string | undefined
  const hasReplay = showRecording && (
    (event.streamType === "youtube_api" && replayBroadcastId) ||
    (event.streamType === "youtube" && event.youtubeUrl)
  )

  const sendReplayCommand = (command: "playVideo" | "pauseVideo") => {
    const iframe = replayIframeRef.current
    if (!iframe || !iframe.contentWindow) return
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: command, args: [] }),
      "*",
    )
  }

  let replaySrc: string | null = null
  if (isEnded && hasReplay) {
    if (event.streamType === "youtube_api" && replayBroadcastId) {
      replaySrc = `https://www.youtube.com/embed/${replayBroadcastId}?rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`
    } else if (event.streamType === "youtube" && event.youtubeUrl) {
      replaySrc = (event.youtubeUrl as string).replace("watch?v=", "embed/") + "?rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1"
    }
  }

  const heroImageUrl =
    (evRawTop.heroImageUrl as string | undefined) ||
    (evRawTop.heroImage as string | undefined)
  const playerImageUrl = evRawTop.playerImageUrl as string | undefined
  const photoGalleryUrls = (evRawTop.photoGalleryUrls as string[] | undefined) || []
  const photographerLogoUrl = evRawTop.photographerLogoUrl as string | undefined
  const photographerContact = (evRawTop.photographerContact as { name?: string; phone?: string; email?: string; website?: string } | undefined) || {}
  const photographerWebsiteRaw =
    typeof photographerContact.website === "string" ? photographerContact.website.trim() : ""
  const photographerWebsitePublicUrl =
    photographerWebsiteRaw.length > 0
      ? /^https?:\/\//i.test(photographerWebsiteRaw)
        ? photographerWebsiteRaw
        : `https://${photographerWebsiteRaw}`
      : ""
  const validityExpiresAt = evRawTop.validityExpiresAt as string | undefined
  const tzForDate = (evRawTop.timezone as string) || "UTC"
  const primaryDateFormatted = event.scheduledAt
    ? (() => {
        const d = new Date(event.scheduledAt as unknown as string)
        const tz = tzForDate !== "UTC" ? tzForDate : undefined
        const dateStr = d.toLocaleDateString("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", year: "numeric" })
        const timeStr = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
        const tzLabel = tz ? new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortGeneric" }).formatToParts(d).find(p => p.type === "timeZoneName")?.value ?? tz : "UTC"
        return `${dateStr} · ${timeStr} ${tzLabel}`
      })()
    : ""

  /** Mock player: date line + time line (same tz rules as primaryDateFormatted) */
  const streamPlaceholderSchedule: { dateLine: string; timeLine: string } | null = event.scheduledAt
    ? (() => {
        const d = new Date(event.scheduledAt as unknown as string)
        const tz = tzForDate !== "UTC" ? tzForDate : undefined
        const dateLine = d.toLocaleDateString("en-US", {
          timeZone: tz,
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        const timeStr = d.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit" })
        const tzLabel = tz
          ? new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortGeneric" })
              .formatToParts(d)
              .find((p) => p.type === "timeZoneName")?.value ?? tz
          : "UTC"
        return { dateLine, timeLine: `${timeStr} ${tzLabel}` }
      })()
    : null

  const DEFAULT_STREAM_SHELL = "relative aspect-video w-full bg-black"
  const WEDDING_STREAM_SHELL =
    "relative aspect-video w-full rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-950 via-rose-950/40 to-zinc-900 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] border border-white/10"
  const GARDEN_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-3xl border border-white/55 bg-white/15 shadow-[0_8px_32px_rgba(22,101,52,0.18)] backdrop-blur-md"
  const MIDNIGHT_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-none border border-[#d4af37]/35 bg-zinc-950 shadow-[0_0_32px_rgba(212,175,55,0.12)]"
  const COASTAL_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-3xl border border-white/60 bg-white/40 shadow-[0_8px_32px_rgba(0,109,119,0.15)] backdrop-blur-md"
  const CELESTIAL_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-3xl border border-[rgba(255,215,0,0.22)] bg-[#1a1f3d]/75 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
  const CORPORATE_TECH_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-2xl border border-blue-500/35 bg-zinc-950 shadow-[0_12px_48px_rgba(0,102,255,0.14)] backdrop-blur-sm"
  const TRADITIONAL_HINDU_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-3xl border-[3px] border-amber-400/85 bg-gradient-to-br from-red-950/95 via-orange-950/90 to-amber-950/95 shadow-[0_12px_48px_rgba(185,28,28,0.22)] backdrop-blur-sm"
  const MEMORIAL_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-2xl border-[3px] border-[#c9a961] bg-gradient-to-br from-[#1e3c72]/40 via-[#2a5298]/30 to-[#34495e]/40 shadow-[0_15px_50px_rgba(0,0,0,0.35)]"
  const CHRISTIAN_ROSE_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-2xl border border-[#f4c2c2]/90 bg-black shadow-[0_12px_40px_rgba(139,79,92,0.28)]"
  const NIKAH_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-[20px] border-4 border-[#d4af37] bg-black shadow-[0_15px_50px_rgba(0,0,0,0.35)]"
  const BIRTHDAY_STREAM_SHELL =
    "relative aspect-video w-full overflow-hidden rounded-2xl border-4 border-pink-300 bg-black shadow-[0_20px_50px_rgba(255,107,157,0.28)]"

  /** Garden / coastal shells are light/frosted — use dark type (readable on glass bg) */
  const streamPlaceholderTitleClass =
    streamChrome === "garden" || streamChrome === "coastal"
      ? streamChrome === "garden"
        ? "text-lg font-semibold text-emerald-950"
        : "font-coastal-sans text-lg font-semibold text-[#006d77]"
      : "text-lg font-medium text-white"
  const streamPlaceholderSubClass =
    streamChrome === "garden" || streamChrome === "coastal"
      ? streamChrome === "garden"
        ? "text-sm font-medium text-emerald-900/90"
        : "font-coastal-sans text-sm font-medium text-[#0f766e]/90"
      : "text-sm text-white/60"

  const renderStreamPlayer = (shellClassName: string) => (
    <div ref={videoContainerRef} className={shellClassName}>
          <div className="absolute inset-0 flex items-center justify-center">
            {isEnded && hasReplay && replaySrc ? (
              <div className="group relative h-full w-full">
                <iframe
                  ref={replayIframeRef}
                  className="h-full w-full"
                  src={replaySrc}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <button
                  type="button"
                  className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 focus:outline-none focus-visible:opacity-100"
                  onClick={() => {
                    const next = !isReplayPlaying
                    sendReplayCommand(next ? "playVideo" : "pauseVideo")
                    setIsReplayPlaying(next)
                  }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {isReplayPlaying ? (
                      <PauseCircle className="h-10 w-10" />
                    ) : (
                      <Play className="h-10 w-10 translate-x-0.5" />
                    )}
                  </div>
                </button>
              </div>
            ) : isEnded ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center px-8 absolute inset-0 bg-black">
                {playerImageUrl ? (
                  <img src={playerImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                ) : null}
                <div className="relative flex flex-col items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <Radio className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-white">This stream has ended</p>
                    <p className="text-sm text-white/50">Thanks for watching!</p>
                  </div>
                  <div className="flex items-center gap-2 text-white/50 text-sm">
                    <Eye className="h-4 w-4" />
                    <span>{(event.totalViews ?? 0).toLocaleString()} total views</span>
                  </div>
                </div>
              </div>
            ) : event.streamType === "youtube" && event.youtubeUrl ? (
              <iframe
                className="h-full w-full"
                src={(event.youtubeUrl as string).replace("watch?v=", "embed/") + "?autoplay=1&mute=1&controls=0&rel=0&iv_load_policy=3&modestbranding=1"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : event.streamType === "youtube_api" && evRawTop.youtubeBroadcastId ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${evRawTop.youtubeBroadcastId}?autoplay=1&mute=1&controls=0&rel=0&iv_load_policy=3&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : event.streamType === "youtube_api" ? (
              <div className="flex flex-col items-center justify-center gap-4 text-center px-8 absolute inset-0">
                {playerImageUrl && <img src={playerImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                <div className="relative flex flex-col items-center gap-4">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <span
                      className="absolute h-[4.5rem] w-[4.5rem] rounded-full bg-red-500/35 animate-ping [animation-duration:2s]"
                      aria-hidden
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-red-500/45 bg-red-950/50 shadow-[0_0_28px_rgba(239,68,68,0.45)]">
                      <Radio className="h-10 w-10 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse [animation-duration:1.5s]" />
                    </div>
                  </div>
                  <p className={streamPlaceholderTitleClass}>Stream Starting Soon</p>
                  <p
                    className={cn(
                      streamPlaceholderSubClass,
                      (streamChrome === "garden" || streamChrome === "coastal") && "max-w-sm text-center",
                    )}
                  >
                    The YouTube broadcast is being set up. Please wait a moment and refresh.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 absolute inset-0">
                {playerImageUrl && <img src={playerImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
                <div className="relative flex flex-col items-center gap-4">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <span
                      className="absolute h-[4.5rem] w-[4.5rem] rounded-full bg-red-500/35 animate-ping [animation-duration:2s]"
                      aria-hidden
                    />
                    <span
                      className="absolute h-16 w-16 rounded-full bg-red-600/25 animate-pulse"
                      aria-hidden
                    />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-red-500/45 bg-red-950/50 shadow-[0_0_28px_rgba(239,68,68,0.45)]">
                      <Radio className="h-10 w-10 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)] animate-pulse [animation-duration:1.5s]" />
                    </div>
                  </div>
                  <div className="flex max-w-lg flex-col items-center gap-1 px-2 text-center">
                    {streamPlaceholderSchedule ? (
                      <>
                        <p className={streamPlaceholderTitleClass}>{streamPlaceholderSchedule.dateLine}</p>
                        <p className={streamPlaceholderSubClass}>{streamPlaceholderSchedule.timeLine}</p>
                      </>
                    ) : (
                      <>
                        <p className={streamPlaceholderTitleClass}>Date to be announced</p>
                        <p className={streamPlaceholderSubClass}>Time to be announced</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute left-4 top-4 flex items-center gap-2">
            {isEnded && hasReplay ? (
              <Badge variant="secondary" className="bg-black/60 text-white border-white/20">
                Recording
              </Badge>
            ) : isEnded ? (
              <Badge variant="secondary" className="bg-black/60 text-white/70 border-white/20">
                Ended
              </Badge>
            ) : (
              <>
                <Badge className="border border-zinc-500/50 bg-zinc-600 text-white shadow-none">
                  <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-zinc-200" />
                  LIVE
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    streamChrome === "wedding"
                      ? "border-rose-200/60 bg-rose-900/45 text-rose-50"
                      : streamChrome === "garden"
                        ? "border-emerald-200/50 bg-emerald-950/50 text-emerald-50"
                        : streamChrome === "midnight"
                          ? "border-amber-500/40 bg-black/70 font-mono text-xs text-amber-100"
                          : streamChrome === "coastal"
                            ? "border-white/60 bg-white/70 font-coastal-sans text-xs text-[#006d77]"
                            : streamChrome === "celestial"
                              ? "border-yellow-500/35 bg-black/65 font-mono text-xs text-yellow-200/90"
                              : streamChrome === "traditionalHindu"
                                ? "border-amber-400/70 bg-[#FFF8DC]/90 font-hindu-wedding-display text-xs text-red-900"
                                : streamChrome === "corporateTech"
                                  ? "border-blue-500/35 bg-black/70 font-corporate-tech-display text-xs text-blue-100"
                                    : streamChrome === "memorial"
                                    ? "border-[#c9a961]/70 bg-black/60 font-memorial-display text-xs text-[#f5e6c8]"
                                    : "border-white/30 bg-black/50 text-white"
                  }
                >
                  <Eye className="mr-1 h-3 w-3" />
                  {viewerCount.toLocaleString()}
                </Badge>
              </>
            )}
          </div>

          {!isEnded && floatingEmojis.map((e) => (
            <span
              key={e.id}
              className="pointer-events-none absolute bottom-16 text-2xl select-none animate-[floatUp_2.5s_ease-out_forwards]"
              style={{ left: `${e.x}%` }}
            >
              {e.emoji}
            </span>
          ))}

          <div
            className={`absolute bottom-0 left-0 right-0 p-4 ${
              streamChrome === "wedding"
                ? "bg-gradient-to-t from-rose-950/80 via-rose-900/40 to-transparent"
                : streamChrome === "garden"
                  ? "bg-gradient-to-t from-emerald-950/85 via-emerald-900/35 to-transparent"
                  : streamChrome === "midnight"
                    ? "bg-gradient-to-t from-black via-zinc-950/70 to-transparent"
                    : streamChrome === "coastal"
                      ? "bg-gradient-to-t from-[#006d77]/90 via-[#0d9488]/35 to-transparent"
                      : streamChrome === "celestial"
                        ? "bg-gradient-to-t from-[#0b0d17] via-violet-950/75 to-transparent"
                        : streamChrome === "traditionalHindu"
                          ? "bg-gradient-to-t from-red-950/90 via-orange-950/55 to-transparent"
                          : streamChrome === "corporateTech"
                            ? "bg-gradient-to-t from-[#0a0a0a] via-blue-950/50 to-transparent"
                            : streamChrome === "memorial"
                              ? "bg-gradient-to-t from-[#1e3c72]/95 via-[#2a5298]/45 to-transparent"
                              : "bg-gradient-to-t from-black/80 to-transparent"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-white hover:bg-white/20"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                {event.allowReactions ? (
                  <div
                    className={`flex min-w-0 items-center gap-0.5 border-l pl-2 sm:pl-3 ${
                      streamChrome === "default" ? "border-white/20" : "border-white/25"
                    }`}
                  >
                    <span className="mr-0.5 hidden text-[10px] font-semibold uppercase tracking-wide text-white/55 sm:inline">
                      React
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {REACTION_TYPES.map(({ type, emoji }) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleReaction(type)}
                          className={`shrink-0 select-none rounded-md px-1.5 py-1 text-lg transition-transform duration-100 active:scale-125 sm:text-xl ${
                            streamChrome === "default" ? "text-white hover:bg-white/20" : "text-white hover:bg-white/15"
                          }`}
                          title={type}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2 relative">
                {event.streamType !== "youtube_api" && event.streamType !== "youtube_embed" && event.streamType !== "third_party" && (
                  <div className="relative">
                    <Button
                      variant="ghost" size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={() => setShowSettings(s => !s)}
                    >
                      <Settings className={`h-5 w-5 transition-transform duration-300 ${showSettings ? "rotate-45" : ""}`} />
                    </Button>
                    {showSettings && (
                      <div className="absolute bottom-10 right-0 w-44 rounded-lg border border-white/10 bg-black/90 backdrop-blur-sm p-2 text-white text-sm shadow-xl z-50">
                        <p className="text-xs text-white/50 px-2 py-1 uppercase tracking-wide">Quality</p>
                        {["Auto", "1080p", "720p", "480p", "360p"].map(q => (
                          <button
                            key={q}
                            onClick={() => { setQuality(q); setShowSettings(false) }}
                            className={`w-full text-left px-2 py-1.5 rounded hover:bg-white/10 flex items-center justify-between ${quality === q ? "text-primary" : ""}`}
                          >
                            {q}
                            {quality === q && <Check className="h-3 w-3" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost" size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
    </div>
  )

  const renderLiveChatBody = () => {
    const chatSkin: WatchChromeTheme = streamChrome === "memorial" ? "wedding" : streamChrome

    const headerClass =
      chatSkin === "wedding"
        ? "border-transparent bg-gradient-to-r from-amber-600 to-orange-500 text-white"
        : chatSkin === "garden"
          ? "border-transparent bg-emerald-700 text-white"
          : chatSkin === "midnight"
            ? "border-b border-amber-500/25 bg-black text-amber-100"
            : chatSkin === "coastal"
              ? "border-b border-teal-400/30 bg-gradient-to-r from-[#006d77] to-[#4a9d96] text-white"
              : chatSkin === "celestial"
                ? "border-b border-violet-500/30 bg-gradient-to-r from-purple-950/90 via-[#1a1f3d] to-indigo-950/90 text-yellow-100"
                : chatSkin === "traditionalHindu"
                  ? "border-b border-amber-500/40 bg-gradient-to-r from-red-700 via-orange-600 to-rose-700 text-amber-50"
                  : chatSkin === "corporateTech"
                    ? "border-b border-blue-500/25 bg-gradient-to-r from-slate-950 via-blue-950/60 to-slate-950 text-sky-50"
                    : "border-border"
    const titleClass =
      chatSkin === "default"
        ? "text-foreground"
        : chatSkin === "midnight"
          ? "text-amber-100"
          : chatSkin === "celestial"
            ? "font-celestial-display tracking-[0.06em] text-yellow-300/95"
            : chatSkin === "traditionalHindu"
              ? "font-hindu-wedding-display tracking-tight text-amber-100"
              : chatSkin === "corporateTech"
                ? "font-corporate-tech-display tracking-tight text-sky-100"
                : "text-white"
    const iconClass =
      chatSkin === "default"
        ? "text-primary"
        : chatSkin === "midnight"
          ? "text-amber-400"
          : chatSkin === "celestial"
            ? "text-yellow-400"
            : chatSkin === "traditionalHindu"
              ? "text-amber-200"
              : chatSkin === "corporateTech"
                ? "text-blue-400"
                : "text-white"
    const metaClass =
      chatSkin === "default"
        ? "text-muted-foreground"
        : chatSkin === "midnight"
          ? "text-amber-400/80"
          : chatSkin === "celestial"
            ? "text-violet-300/85"
            : chatSkin === "traditionalHindu"
              ? "text-amber-200/90"
              : chatSkin === "corporateTech"
                ? "text-zinc-400"
                : "text-white/90"
    const scrollBg =
      chatSkin === "wedding"
        ? "bg-stone-50"
        : chatSkin === "garden"
          ? "bg-emerald-50/60"
          : chatSkin === "midnight"
            ? "bg-zinc-950"
            : chatSkin === "coastal"
              ? "bg-[#edf6f9]/95"
              : chatSkin === "celestial"
                ? "bg-[#0b0d17]"
                : chatSkin === "traditionalHindu"
                  ? "bg-orange-50/95"
                  : chatSkin === "corporateTech"
                    ? "bg-[#0a0a0a]"
                    : ""
    const avFallback =
      chatSkin === "wedding"
        ? "bg-rose-200 text-rose-800 text-xs"
        : chatSkin === "garden"
          ? "bg-emerald-200 text-emerald-900 text-xs"
          : chatSkin === "midnight"
            ? "bg-amber-950/60 font-mono text-amber-200 text-xs"
            : chatSkin === "coastal"
              ? "bg-[#83c5be]/55 font-coastal-sans text-[#006d77] text-xs"
              : chatSkin === "celestial"
                ? "bg-violet-950/70 font-mono text-yellow-200/90 text-xs"
                : chatSkin === "traditionalHindu"
                  ? "bg-amber-200/90 font-hindu-wedding-display text-red-900 text-xs"
                  : chatSkin === "corporateTech"
                    ? "bg-slate-800 font-corporate-tech-display text-blue-200 text-xs"
                    : "bg-primary/20 text-primary text-xs"
    const msgUser =
      chatSkin === "wedding"
        ? "text-rose-900"
        : chatSkin === "garden"
          ? "text-emerald-950"
          : chatSkin === "midnight"
            ? "font-mono text-xs font-semibold text-amber-200"
            : chatSkin === "coastal"
              ? "font-coastal-sans text-sm font-semibold text-[#006d77]"
              : chatSkin === "celestial"
                ? "font-mono text-xs font-semibold text-yellow-300/90"
                : chatSkin === "traditionalHindu"
                  ? "font-hindu-wedding-display text-sm font-semibold text-red-900"
                  : chatSkin === "corporateTech"
                    ? "font-corporate-tech-display text-sm font-semibold text-sky-200"
                    : "text-foreground"
    const msgTime =
      chatSkin === "wedding"
        ? "text-rose-600/70"
        : chatSkin === "garden"
          ? "text-emerald-700/80"
          : chatSkin === "midnight"
            ? "font-mono text-[10px] text-amber-600/70"
            : chatSkin === "coastal"
              ? "font-coastal-sans text-xs text-slate-500"
              : chatSkin === "celestial"
                ? "font-mono text-[10px] text-violet-500/80"
                : chatSkin === "traditionalHindu"
                  ? "font-hindu-wedding-serif text-xs text-red-800/70"
                  : chatSkin === "corporateTech"
                    ? "font-corporate-tech-display text-[10px] text-zinc-500"
                    : "text-muted-foreground"
    const msgBody =
      chatSkin === "wedding"
        ? "text-rose-800/85"
        : chatSkin === "garden"
          ? "text-emerald-900/85"
          : chatSkin === "midnight"
            ? "font-mono text-sm text-zinc-300"
            : chatSkin === "coastal"
              ? "font-coastal-sans text-sm text-slate-700"
              : chatSkin === "celestial"
                ? "font-mono text-sm text-zinc-300"
                : chatSkin === "traditionalHindu"
                  ? "font-hindu-wedding-serif text-sm text-red-950/90"
                  : chatSkin === "corporateTech"
                    ? "font-sans text-sm text-zinc-300"
                    : "text-muted-foreground"
    const formBorder =
      chatSkin === "wedding"
        ? "border-rose-200/70 bg-white"
        : chatSkin === "garden"
          ? "border-emerald-200/80 bg-white/95"
          : chatSkin === "midnight"
            ? "border-t border-amber-500/20 bg-black"
            : chatSkin === "coastal"
              ? "border-t border-teal-200/80 bg-white/85"
              : chatSkin === "celestial"
                ? "border-t border-violet-600/30 bg-black/35"
                : chatSkin === "traditionalHindu"
                  ? "border-t border-amber-400/70 bg-white/90"
                  : chatSkin === "corporateTech"
                    ? "border-t border-blue-500/20 bg-black/50"
                    : "border-border"
    const inputClass =
      chatSkin === "wedding"
        ? "flex-1 rounded-full border-rose-200 bg-white shadow-sm"
        : chatSkin === "garden"
          ? "flex-1 rounded-full border-emerald-200 bg-white shadow-sm"
          : chatSkin === "midnight"
            ? "flex-1 border border-amber-500/30 bg-black/80 font-mono text-sm text-amber-100 placeholder:text-zinc-600"
            : chatSkin === "coastal"
              ? "flex-1 rounded-full border border-teal-200 bg-white font-coastal-sans text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
              : chatSkin === "celestial"
                ? "flex-1 border border-violet-600/40 bg-black/40 font-mono text-sm text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-yellow-500/40"
                : chatSkin === "traditionalHindu"
                  ? "flex-1 rounded-full border border-amber-400/80 bg-white font-hindu-wedding-serif text-sm text-red-950 shadow-sm placeholder:text-red-900/40 focus-visible:ring-amber-500/40"
                  : chatSkin === "corporateTech"
                    ? "flex-1 border border-white/10 bg-black/60 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-blue-500/40"
                    : "flex-1 bg-secondary border-0"
    const sendBtn =
      chatSkin === "wedding"
        ? "rounded-full bg-amber-600 hover:bg-amber-700 text-white"
        : chatSkin === "garden"
          ? "rounded-full bg-emerald-700 hover:bg-emerald-800 text-white"
          : chatSkin === "midnight"
            ? "border border-amber-500/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25"
            : chatSkin === "coastal"
              ? "rounded-full bg-gradient-to-br from-[#e29578] to-[#d4846a] text-white hover:opacity-95"
              : chatSkin === "celestial"
                ? "border border-yellow-500/35 bg-gradient-to-r from-purple-700 to-indigo-800 text-yellow-100 hover:opacity-95"
                : chatSkin === "traditionalHindu"
                  ? "rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-95"
                  : chatSkin === "corporateTech"
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : ""

    const chatTitle =
      streamChrome === "wedding"
        ? "Live Wishes"
        : streamChrome === "garden"
          ? "Garden Messages"
          : streamChrome === "midnight"
            ? "Live Channel"
            : streamChrome === "coastal"
              ? "Message in a Bottle"
              : streamChrome === "celestial"
                ? "Cosmic Messages"
                : streamChrome === "traditionalHindu"
                  ? "Blessings & Wishes"
                  : streamChrome === "memorial"
                    ? "Condolences"
                    : streamChrome === "corporateTech"
                        ? "Live discussion"
                        : "Live Chat"
    const chatPlaceholder =
      streamChrome === "wedding"
        ? "Send your wishes..."
        : streamChrome === "garden"
          ? "Send love..."
          : streamChrome === "midnight"
            ? "> Transmit message..."
            : streamChrome === "coastal"
              ? "Cast your message..."
              : streamChrome === "celestial"
                ? "Transmit..."
                : streamChrome === "traditionalHindu"
                  ? "Send your blessings..."
                  : streamChrome === "memorial"
                    ? "Share a memory…"
                    : streamChrome === "corporateTech"
                        ? "Join the conversation..."
                        : "Send a message..."

    const chatMessageList = (
      <div className="space-y-4">
        {chatMessages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className={avFallback}>
                {msg.user.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${msgUser}`}>{msg.user}</span>
                <span className={`text-xs ${msgTime}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className={`text-sm ${msgBody}`}>{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
    )

    return (
    <>
      <div className={`flex items-center justify-between border-b p-4 ${headerClass}`}>
        <div className="flex items-center gap-2">
          <MessageCircle className={`h-5 w-5 ${iconClass}`} />
          <span className={`font-medium ${titleClass}`}>{chatTitle}</span>
        </div>
        <div className={`flex items-center gap-1 text-sm ${metaClass}`}>
          <Users className="h-4 w-4" />
          <span>{viewerCount}</span>
        </div>
      </div>

      {streamChrome === "corporateTech" ? (
        <div
          className={`min-h-0 flex-1 overflow-y-auto p-4 ${scrollBg} [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.35)_transparent]`}
        >
          {chatMessageList}
        </div>
      ) : (
        <ScrollArea className={`flex-1 p-4 ${scrollBg}`}>{chatMessageList}</ScrollArea>
      )}

      <form onSubmit={handleSendMessage} className={`border-t p-4 ${formBorder}`}>
        <div className="flex gap-2">
          <Input
            placeholder={chatPlaceholder}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className={inputClass}
          />
          <Button type="submit" size="icon" className={sendBtn}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </>
    )
  }

  const weddingFields = templateData as Record<string, string | undefined>
  const coupleHero =
    [weddingFields.brideName, weddingFields.groomName].filter(Boolean).join(" & ") || event.title
  const heroFromEvent = typeof heroImageUrl === "string" ? heroImageUrl.trim() : ""
  const couplePhotoRaw = weddingFields.couplePhoto
  const couplePhotoTrimmed = typeof couplePhotoRaw === "string" ? couplePhotoRaw.trim() : ""
  /** Funeral & birthday: hero image is for the circular profile + OG only — not a full-bleed hero background */
  const heroBackdropUrl =
    watchTemplateId === "tpl-funeral"
      ? ""
      : watchTemplateId === "tpl-birthday-party"
        ? couplePhotoTrimmed || getDefaultTemplateHeroBackdropUrl(watchTemplateId) || ""
        : heroFromEvent || couplePhotoTrimmed || getDefaultTemplateHeroBackdropUrl(watchTemplateId) || ""
  const eventSubtitle = (evRawTop.subtitle as string | undefined)?.trim() || ""
  /** Hero line below divider: event description only — no static or template fallbacks */
  const weddingHeroDescription = typeof event.description === "string" ? event.description.trim() : ""
  const coupleParts = coupleHero.includes(" & ") ? coupleHero.split(" & ").map((s) => s.trim()) : null
  const renderDetailsPanel = (detailsTheme: WatchChromeTheme) => {
    const hideGenericHeader =
      detailsTheme === "wedding" ||
      detailsTheme === "garden" ||
      detailsTheme === "midnight" ||
      detailsTheme === "coastal" ||
      detailsTheme === "celestial" ||
      detailsTheme === "traditionalHindu" ||
      detailsTheme === "corporateTech" ||
      detailsTheme === "memorial" ||
      watchSkin === "birthdayParty"
    const panelShell =
      detailsTheme === "wedding"
        ? "border-amber-200/50 bg-[#fefae0]"
        : detailsTheme === "garden"
          ? "border-emerald-200/50 bg-[#faf9f6]"
          : detailsTheme === "midnight"
            ? "border-amber-500/25 bg-zinc-950 text-zinc-100"
            : detailsTheme === "coastal"
              ? "border-teal-200/55 bg-[#edf6f9] text-slate-800 [&_h3]:text-[#006d77]"
              : detailsTheme === "celestial"
                ? "border-violet-600/35 bg-[#0b0d17] text-zinc-200 [&_h3]:text-yellow-300/90"
                : detailsTheme === "traditionalHindu"
                  ? "border-amber-400/55 bg-[#FFF8DC] text-red-950 [&_h3]:text-red-800"
                  : detailsTheme === "corporateTech"
                    ? "border-blue-500/30 bg-[#0a0a0a] text-zinc-200 [&_h3]:text-sky-300"
                    : detailsTheme === "memorial"
                      ? "border-[#c9a961]/40 bg-[#f8f5f0] text-[#2c3e50] [&_h3]:text-[#c9a961]"
                      : "border-border"
    const galleryBorder =
      detailsTheme === "wedding"
        ? "border-amber-200/60"
        : detailsTheme === "garden"
          ? "border-emerald-200/60"
          : detailsTheme === "midnight"
            ? "border-amber-500/25"
            : detailsTheme === "coastal"
              ? "border-teal-200/65"
              : detailsTheme === "celestial"
                ? "border-violet-600/40"
                : detailsTheme === "traditionalHindu"
                  ? "border-amber-400/65"
                  : detailsTheme === "corporateTech"
                    ? "border-blue-500/35"
                    : detailsTheme === "memorial"
                      ? "border-[#c9a961]/55"
                      : "border-border"
    const shareBtn =
      detailsTheme === "wedding"
        ? "border-amber-300/80 bg-white/50 text-amber-950 hover:bg-white/70"
        : detailsTheme === "garden"
          ? "border-emerald-300/80 bg-white/70 text-emerald-950 hover:bg-emerald-50"
          : detailsTheme === "midnight"
            ? "border-amber-500/40 bg-black/50 font-mono text-amber-100 hover:bg-amber-950/30"
            : detailsTheme === "coastal"
              ? "border-teal-300/80 bg-white/80 font-coastal-sans text-[#006d77] hover:bg-white"
              : detailsTheme === "celestial"
                ? "border-yellow-500/35 bg-black/50 font-mono text-yellow-200/90 hover:bg-violet-950/40"
                : detailsTheme === "traditionalHindu"
                  ? "border-amber-400/70 bg-white/90 font-hindu-wedding-display text-red-900 hover:bg-amber-50"
                  : detailsTheme === "corporateTech"
                    ? "border-blue-500/35 bg-black/50 font-corporate-tech-display text-sky-200 hover:bg-blue-950/30"
                    : detailsTheme === "memorial"
                      ? "border-[#c9a961]/70 bg-white/80 font-memorial-display text-[#2c3e50] hover:bg-white"
                      : "border-border bg-transparent"
    const photoNameClass =
      detailsTheme === "wedding"
        ? "font-medium text-stone-900"
        : detailsTheme === "garden"
          ? "font-medium text-emerald-950"
          : detailsTheme === "midnight"
            ? "font-medium text-amber-100"
            : detailsTheme === "coastal"
              ? "font-coastal-sans font-medium text-[#006d77]"
              : detailsTheme === "celestial"
                ? "font-celestial-display font-medium text-yellow-200/95"
                : detailsTheme === "traditionalHindu"
                  ? "font-hindu-wedding-display font-medium text-red-900"
                  : detailsTheme === "corporateTech"
                    ? "font-corporate-tech-display font-medium text-sky-200"
                    : detailsTheme === "memorial"
                      ? "font-memorial-serif font-medium text-[#34495e]"
                      : "font-medium text-foreground"
    const photoLinksClass =
      detailsTheme === "wedding"
        ? "flex flex-wrap gap-x-3 gap-y-1 text-stone-700"
        : detailsTheme === "garden"
          ? "flex flex-wrap gap-x-3 gap-y-1 text-emerald-800"
          : detailsTheme === "midnight"
            ? "flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm text-amber-300/90"
            : detailsTheme === "coastal"
              ? "flex flex-wrap gap-x-3 gap-y-1 font-coastal-sans text-sm text-slate-700"
              : detailsTheme === "celestial"
                ? "flex flex-wrap gap-x-3 gap-y-1 font-mono text-sm text-violet-200/85"
                : detailsTheme === "traditionalHindu"
                  ? "flex flex-wrap gap-x-3 gap-y-1 font-hindu-wedding-serif text-sm text-red-900/85"
                  : detailsTheme === "corporateTech"
                    ? "flex flex-wrap gap-x-3 gap-y-1 font-sans text-sm text-zinc-400"
                    : detailsTheme === "memorial"
                      ? "flex flex-wrap gap-x-3 gap-y-1 font-memorial-serif text-sm text-[#5a6c7d]"
                      : "flex flex-wrap gap-x-3 gap-y-0 text-muted-foreground"

    return (
    <div className={`border-b p-4 lg:p-6 ${panelShell}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          {!hideGenericHeader ? (
            <>
              <h1
                className={cn(
                  "font-bold",
                  "text-foreground",
                  titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
                )}
                style={{
                  ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                  ...cardTitleFontSizeStyle(titleHeroRem),
                }}
              >
                {event.title}
              </h1>
              {eventSubtitle ? (
                <p className="mt-1 text-sm font-medium leading-snug text-foreground/90">{eventSubtitle}</p>
              ) : null}
              {event.description && (
                <p className="mt-1 text-muted-foreground">{event.description}</p>
              )}
              {(eventDates.length > 0 || primaryDateFormatted) && (
                <div className="mt-3 max-w-md overflow-hidden rounded-lg border border-border">
                  <div className="border-b border-border bg-muted/40 px-3 py-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Schedule</p>
                  </div>
                  <ul className="divide-y divide-border">
                    {event.scheduledAt && (
                      <li className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="truncate text-sm font-medium">Main event</span>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">{primaryDateFormatted}</span>
                      </li>
                    )}
                    {eventDates.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="truncate text-sm font-medium">{d.label || "Session"}</span>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">{formatExtraDate(d)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
          {validityExpiresAt && (
            <p className="mt-2 text-xs text-muted-foreground">
              Event valid until {new Date(validityExpiresAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" className={shareBtn} onClick={handleShare}>
            {shareCopied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Share2 className="mr-2 h-4 w-4" />}
            {shareCopied ? "Copied!" : "Share"}
          </Button>
          {event.allowChat ? (
            <Button variant="outline" className="border-border bg-transparent lg:hidden" onClick={() => setShowChat(!showChat)}>
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </Button>
          ) : null}
        </div>
      </div>

      {photoGalleryUrls.length > 0 && (
        <div className={`mt-6 border-t pt-4 ${galleryBorder}`}>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Photo gallery</h3>
          <WatchPhotoGallery urls={photoGalleryUrls} theme={detailsTheme} />
        </div>
      )}

      {(photographerLogoUrl ||
        photographerContact.name ||
        photographerContact.phone ||
        photographerContact.email ||
        photographerContact.website) && (
        <div className={`mt-6 flex flex-wrap items-center gap-4 border-t pt-4 ${galleryBorder}`}>
          {photographerLogoUrl && (
            <img src={photographerLogoUrl} alt="Photographer" className="h-12 w-auto object-contain" />
          )}
          <div className="text-sm">
            {photographerContact.name && (
              <p className={photoNameClass}>
                {photographerContact.name}
              </p>
            )}
            <div className={photoLinksClass}>
              {photographerContact.phone && (
                <a href={`tel:${photographerContact.phone}`} className="hover:underline">
                  {photographerContact.phone}
                </a>
              )}
              {photographerContact.email && (
                <a href={`mailto:${photographerContact.email}`} className="hover:underline">
                  {photographerContact.email}
                </a>
              )}
              {photographerWebsitePublicUrl ? (
                <a
                  href={photographerWebsitePublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-full break-all hover:underline"
                  title={photographerWebsitePublicUrl}
                >
                  {photographerWebsitePublicUrl}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  if (watchSkin === "wedding") {
    const scrollToStream = () =>
      document.getElementById("wedding-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })

    return (
      <div className="relative flex min-h-screen flex-col bg-[#fefae0] font-wedding text-stone-800">
        <style jsx global>{`
          /* Same motion as reference HTML @keyframes fall (renamed to avoid global name collisions) */
          @keyframes watchWeddingHtmlPetalFall {
            0% {
              transform: translateY(0) rotate(0deg) translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateY(110vh) rotate(720deg) translateX(100px);
              opacity: 0;
            }
          }
        `}</style>
        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
          {weddingPetals.map((petal) => (
            <span
              key={petal.id}
              className="fixed top-[-10%] h-5 w-5 opacity-80"
              style={{
                left: petal.left,
                background: petal.background,
                borderRadius: "50% 0 50% 50%",
                animation: `watchWeddingHtmlPetalFall ${petal.duration} linear ${petal.delay} infinite`,
                zIndex: 1,
                pointerEvents: "none",
              }}
            />
          ))}
        </div>

        <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
          {heroBackdropUrl ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${heroBackdropUrl})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-rose-900 via-amber-900/90 to-stone-900" />
          )}
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-20 mx-auto max-w-4xl px-4 text-center text-white">
            {eventSubtitle ? (
              <p className="text-sm font-light uppercase tracking-[0.3em] md:text-base">{eventSubtitle}</p>
            ) : null}
            <h1
              className={cn(
                "mt-4 font-bold leading-tight drop-shadow-lg",
                titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
              )}
              style={{
                ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                ...heroTitleFontSizeStyle(titleHeroRem),
              }}
            >
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  {coupleParts[0]}{" "}
                  <span
                    className={cn(
                      "inline-block italic text-red-300",
                      titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
                    )}
                    style={
                      googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : undefined
                    }
                  >
                    &
                  </span>{" "}
                  {coupleParts[1]}
                </>
              ) : (
                coupleHero
              )}
            </h1>
            {weddingHeroDescription ? (
              <>
                <div className="mx-auto mt-6 h-1 w-24 bg-white/90" />
                <p className="mt-8 text-lg font-light text-white/95 md:text-2xl">{weddingHeroDescription}</p>
              </>
            ) : null}

            {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
              <div className="mt-10 flex flex-wrap justify-center gap-3 md:gap-6">
                {[
                  { label: "Days", value: countdown.days },
                  { label: "Hours", value: countdown.hours },
                  { label: "Minutes", value: countdown.minutes },
                  { label: "Seconds", value: countdown.seconds },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="min-w-[76px] rounded-2xl bg-white/95 px-4 py-3 shadow-lg md:min-w-[100px] md:px-5 md:py-4"
                  >
                    <p className="text-2xl font-bold tabular-nums text-stone-800 md:text-3xl">
                      {String(item.value).padStart(2, "0")}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            ) : event.scheduledAt && primaryDateFormatted ? (
              <div className="mx-auto mt-10 max-w-xl space-y-1.5 px-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200/90">
                  Live streaming — event date &amp; time
                </p>
                <p className="text-sm font-medium leading-snug text-white/95 md:text-base">{primaryDateFormatted}</p>
              </div>
            ) : null}

            <Button
              asChild
              className="mt-12 h-auto cursor-pointer rounded-full bg-white px-8 py-2.5 text-base font-semibold text-stone-900 shadow-xl hover:bg-white/95"
            >
              <a
                href="#wedding-stream"
                className="inline-flex cursor-pointer items-center justify-center no-underline text-inherit"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToStream()
                }}
              >
                Watch Live Stream
              </a>
            </Button>
          </div>
          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce text-white">
            <ChevronDown className="h-7 w-7 opacity-80" />
          </div>
        </section>

        <section id="wedding-stream" className="scroll-mt-4 bg-gradient-to-b from-orange-50 to-white px-4 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-8 flex w-full max-w-2xl list-none flex-col items-center gap-4 px-2">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li className="text-center text-sm font-semibold uppercase tracking-widest text-amber-700">
                      Main event · {primaryDateFormatted}
                    </li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li
                      key={d.id}
                      className="text-center text-sm font-semibold uppercase tracking-widest text-amber-700"
                    >
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="bg-gradient-to-r from-amber-700 via-orange-500 to-rose-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
                Watch Live Stream
              </h2>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:items-start",
                event.allowChat ? "lg:grid-cols-3" : "",
              )}
            >
              <div
                className={cn(
                  "space-y-6",
                  event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl",
                )}
              >
                {renderStreamPlayer(WEDDING_STREAM_SHELL)}
                {weddingHeroDescription ? (
                  <div className="rounded-xl border border-amber-200/50 bg-white p-6 text-center shadow-md">
                    <h3
                      className={cn(
                        "font-bold whitespace-pre-wrap text-[#8b2635]",
                        titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
                      )}
                      style={{
                        ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                        ...cardTitleFontSizeStyle(titleHeroRem),
                      }}
                    >
                      {weddingHeroDescription}
                    </h3>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-rose-200/80 bg-white shadow-xl lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10">{renderDetailsPanel("wedding")}</div>
      </div>
    )
  }

  if (watchSkin === "weddingGarden") {
    const scrollToGardenStream = () =>
      document.getElementById("garden-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
    /** Always fall back to tpl-wedding-garden default Unsplash hero when event has no hero/couple photo */
    const gardenHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-wedding-garden") || ""

    return (
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#faf9f6] font-garden-sans text-emerald-950">
        <style jsx global>{`
          @keyframes watchGardenFlowerFall {
            0% {
              transform: translateY(-100px) translateX(0);
              opacity: 0;
            }
            10% {
              opacity: 0.65;
            }
            90% {
              opacity: 0.65;
            }
            100% {
              transform: translateY(110vh) translateX(50px);
              opacity: 0;
            }
          }
        `}</style>

        <div
          className="pointer-events-none fixed inset-0 -z-0"
          aria-hidden
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(232, 180, 184, 0.28) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(135, 168, 120, 0.16) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(244, 208, 63, 0.14) 0%, transparent 50%)
            `,
          }}
        />

        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
          {gardenFlowers.map((f) => (
            <span
              key={f.id}
              className="fixed top-[-8%] text-2xl opacity-70"
              style={{
                left: f.left,
                animation: `watchGardenFlowerFall ${f.duration} linear ${f.delay} infinite`,
              }}
            >
              {f.emoji}
            </span>
          ))}
        </div>

        <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
          {gardenHeroBackdrop ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${gardenHeroBackdrop})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900" />
          )}
          {/* Darken center for readable type; keep photo visible at edges (not washed-out cream) */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/45"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_50%_42%,rgba(4,32,28,0.82)_0%,rgba(4,32,28,0.45)_52%,transparent_72%)]"
            aria-hidden
          />
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            {eventSubtitle ? (
              <p className="text-xs font-medium uppercase tracking-[0.35em] text-emerald-100/95 md:text-sm [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]">
                {eventSubtitle}
              </p>
            ) : null}

            <h1
              className={cn(
                "mt-4 font-garden-serif font-semibold leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] [text-shadow:0_1px_3px_rgba(0,0,0,0.4)]",
                titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
              )}
              style={{
                ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                ...heroTitleFontSizeStyle(titleHeroRem),
              }}
            >
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  {coupleParts[0]}{" "}
                  <span
                    className="inline-block text-rose-300 animate-pulse drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
                    style={
                      googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : undefined
                    }
                  >
                    &
                  </span>{" "}
                  {coupleParts[1]}
                </>
              ) : (
                coupleHero
              )}
            </h1>

            {weddingHeroDescription ? (
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-emerald-50/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                {weddingHeroDescription}
              </p>
            ) : null}

            <div className={cn("mx-auto max-w-2xl", weddingHeroDescription ? "mt-8" : "mt-6")}>
              {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label} className="min-w-[72px] text-center">
                      <p className="text-2xl font-bold tabular-nums text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] md:text-3xl">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : primaryDateFormatted ? (
                <p className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-100 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]">
                  {primaryDateFormatted}
                </p>
              ) : (
                <p className="text-center font-garden-serif text-lg text-emerald-100/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]">
                  Date &amp; time TBA
                </p>
              )}
            </div>

            <Button
              asChild
              className="mt-10 h-auto rounded-full bg-emerald-700 px-8 py-3 text-base font-semibold text-white shadow-lg hover:bg-emerald-800"
            >
              <a
                href="#garden-stream"
                className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToGardenStream()
                }}
              >
                <Play className="h-5 w-5" />
                Watch Live Stream
              </a>
            </Button>
          </div>
          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-emerald-200 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            <ChevronDown className="h-7 w-7 animate-bounce opacity-90" />
          </div>
        </section>

        <section id="garden-stream" className="scroll-mt-4 bg-gradient-to-b from-emerald-50 to-white px-4 py-16 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-8 flex w-full max-w-2xl list-none flex-col items-center gap-4 px-2">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-700">
                      Main event · {primaryDateFormatted}
                    </li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li
                      key={d.id}
                      className="text-center text-sm font-semibold uppercase tracking-widest text-emerald-700"
                    >
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="mt-2 font-garden-serif text-4xl text-emerald-950 md:text-5xl">Watch Live Stream</h2>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:items-start",
                event.allowChat ? "lg:grid-cols-3" : "",
              )}
            >
              <div className={cn("space-y-6", event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
                {renderStreamPlayer(GARDEN_STREAM_SHELL)}
                {weddingHeroDescription ? (
                  <div className="rounded-xl border border-emerald-200/60 bg-white p-6 text-center shadow-md">
                    <h3
                      className={cn(
                        "whitespace-pre-wrap text-emerald-900",
                        titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
                      )}
                      style={{
                        ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                        ...cardTitleFontSizeStyle(titleHeroRem),
                      }}
                    >
                      {weddingHeroDescription}
                    </h3>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-emerald-200/80 bg-white/90 shadow-xl backdrop-blur-sm lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6">{renderDetailsPanel("garden")}</div>
      </div>
    )
  }

  if (watchSkin === "christianWeddingRose") {
    const scrollToChristianRoseStream = () =>
      document.getElementById("christian-rose-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
    const roseHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-christian-wedding-rose") || ""

    const roseStripActive =
      event.status === "scheduled" && !!event.scheduledAt && showScheduledPageEnabled
    const roseStripPast =
      roseStripActive && new Date(event.scheduledAt as unknown as string).getTime() <= Date.now()
    const roseShowCountdown = roseStripActive && !roseStripPast

    return (
      <div
        className="relative flex min-h-screen flex-col overflow-x-hidden text-[#4a4a4a]"
        style={{ backgroundColor: "#fffef7" }}
      >
        <style jsx global>{`
          @keyframes watchChristianRoseHeartFloat {
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
        `}</style>

        <section className="relative z-[2] flex min-h-[88vh] flex-col items-center justify-center overflow-hidden text-center bg-[#3d2528]">
          {roseHeroBackdrop ? (
            <div
              className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${roseHeroBackdrop})`,
                filter: "none",
                backdropFilter: "none",
              }}
              aria-hidden
            />
          ) : (
            <div
              className="absolute inset-0 z-0"
              style={{ background: "linear-gradient(135deg, #f4c2c2 0%, #b76e79 100%)" }}
              aria-hidden
            />
          )}
          {/* Translucent rose tint only (no backdrop blur — keeps photo sharp) */}
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

          <div className="pointer-events-none absolute inset-0 z-[8] overflow-hidden motion-reduce:hidden" aria-hidden>
            {roseHearts.map((h) => (
              <span
                key={h.id}
                className="absolute text-[#f4c2c2] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                style={{
                  left: h.left,
                  top: "108%",
                  fontSize: h.size,
                  ["--cr-d0" as string]: `${h.d0}px`,
                  ["--cr-d1" as string]: `${h.d1}px`,
                  ["--cr-d2" as string]: `${h.d2}px`,
                  ["--cr-d3" as string]: `${h.d3}px`,
                  ["--cr-d4" as string]: `${h.d4}px`,
                  animationName: "watchChristianRoseHeartFloat",
                  animationDuration: h.duration,
                  animationTimingFunction: "cubic-bezier(0.4, 0.15, 0.25, 1)",
                  animationIterationCount: "infinite",
                  animationDelay: h.delay,
                }}
              >
                💕
              </span>
            ))}
          </div>

          <div className="relative z-20 mx-auto max-w-4xl px-4 py-12">
            <div
              className="mb-4 text-4xl text-[#fffef7] md:text-5xl"
              style={{
                filter:
                  "drop-shadow(0 1px 2px rgba(0,0,0,0.95)) drop-shadow(0 4px 14px rgba(0,0,0,0.8)) drop-shadow(0 0 28px rgba(0,0,0,0.55)) drop-shadow(0 0 52px rgba(0,0,0,0.35))",
              }}
              aria-hidden
            >
              ✝
            </div>

            {eventSubtitle ? (
              <p className="text-xs font-medium uppercase tracking-[0.28em] text-[#fffef7]/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.92),0_3px_18px_rgba(0,0,0,0.72),0_6px_36px_rgba(0,0,0,0.48),0_0_1px_rgba(0,0,0,0.9)]">
                {eventSubtitle}
              </p>
            ) : null}

            <h1
              className={cn(
                "mt-3 font-christian-rose-script font-normal leading-tight text-[#fffef7]",
                titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
              )}
              style={{
                ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                ...heroTitleFontSizeStyle(titleHeroRem),
                textShadow:
                  "0 0 2px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.88), 0 4px 24px rgba(0,0,0,0.72), 0 8px 44px rgba(0,0,0,0.5), 0 14px 64px rgba(0,0,0,0.32), 0 1px 0 rgba(0,0,0,0.55)",
              }}
            >
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  {coupleParts[0]}{" "}
                  <span
                    className="inline-block animate-pulse text-[#d4af37] [text-shadow:0_1px_3px_rgba(0,0,0,0.85),0_3px_14px_rgba(0,0,0,0.65),0_6px_28px_rgba(0,0,0,0.45)]"
                    style={
                      googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : undefined
                    }
                  >
                    &
                  </span>{" "}
                  {coupleParts[1]}
                </>
              ) : (
                coupleHero
              )}
            </h1>

            {weddingHeroDescription ? (
              <p className="mx-auto mt-8 max-w-2xl font-christian-rose-serif text-lg leading-relaxed text-[#fffef7]/95 md:text-xl [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_4px_22px_rgba(0,0,0,0.68),0_8px_48px_rgba(0,0,0,0.42),0_0_1px_rgba(0,0,0,0.85)]">
                {weddingHeroDescription}
              </p>
            ) : null}

            <div className={cn("mx-auto max-w-2xl", weddingHeroDescription ? "mt-8" : "mt-6")}>
              {roseShowCountdown ? (
                <div className="flex flex-wrap justify-center gap-4 md:gap-6">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label} className="min-w-[72px] text-center">
                      <p className="font-christian-rose-sans text-2xl font-bold tabular-nums text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.85),0_3px_16px_rgba(0,0,0,0.65),0_6px_32px_rgba(0,0,0,0.42)] md:text-3xl">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 font-christian-rose-sans text-[10px] font-semibold uppercase tracking-wider text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.88),0_2px_12px_rgba(0,0,0,0.58),0_4px_24px_rgba(0,0,0,0.35)]">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : primaryDateFormatted ? (
                <p className="text-center font-christian-rose-sans text-sm font-semibold uppercase tracking-widest text-[#fffef7] [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_3px_18px_rgba(0,0,0,0.68),0_6px_36px_rgba(0,0,0,0.44),0_0_1px_rgba(0,0,0,0.85)]">
                  {primaryDateFormatted}
                </p>
              ) : (
                <p className="text-center font-christian-rose-serif text-lg text-[#fffef7]/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.88),0_4px_20px_rgba(0,0,0,0.62),0_8px_40px_rgba(0,0,0,0.38)]">
                  Date &amp; time TBA
                </p>
              )}
            </div>

            <Button
              asChild
              className="mt-10 h-auto rounded-full border-0 px-8 py-3 font-christian-rose-sans text-base font-semibold text-[#fffef7] shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
              style={{ backgroundColor: "#b76e79" }}
            >
              <a
                href="#christian-rose-stream"
                className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline [text-shadow:0_1px_3px_rgba(0,0,0,0.75),0_2px_14px_rgba(0,0,0,0.45)]"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToChristianRoseStream()
                }}
              >
                <Play className="h-5 w-5" />
                Watch Live Stream
              </a>
            </Button>
          </div>

          <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-[#fffef7] [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.85))_drop-shadow(0_3px_14px_rgba(0,0,0,0.55))_drop-shadow(0_0_24px_rgba(0,0,0,0.35))]">
            <ChevronDown className="h-7 w-7 animate-bounce opacity-90" />
          </div>
        </section>

        {showScheduledPageEnabled && event.status === "scheduled" && event.scheduledAt ? (
          <section
            id="christian-rose-countdown"
            className="relative z-[2] scroll-mt-4 px-4 py-14 text-center text-white"
            style={{ background: "linear-gradient(135deg, #8b4f5c, #b76e79)" }}
          >
            <h2 className="font-christian-rose-script text-3xl md:text-4xl">
              {roseStripPast
                ? "We're celebrating! 💒"
                : roseShowCountdown
                  ? "Ceremony Begins In..."
                  : primaryDateFormatted
                    ? "Save the Date"
                    : "Join Us"}
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:gap-6">
              {(["Days", "Hours", "Minutes", "Seconds"] as const).map((label, i) => {
                const vals = [countdown.days, countdown.hours, countdown.minutes, countdown.seconds]
                const v = roseShowCountdown ? vals[i] : 0
                return (
                  <div
                    key={label}
                    className="min-w-[80px] rounded-2xl border-2 border-white/30 bg-white/15 px-4 py-5 backdrop-blur-md md:min-w-[110px] md:px-6 md:py-6"
                  >
                    <span className="font-christian-rose-sans text-2xl font-semibold tabular-nums md:text-3xl">
                      {String(v).padStart(2, "0")}
                    </span>
                    <div className="mt-2 font-christian-rose-sans text-[10px] font-light uppercase tracking-widest md:text-xs">
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            {!roseShowCountdown && primaryDateFormatted ? (
              <p className="mt-6 font-christian-rose-sans text-sm text-white/90">{primaryDateFormatted}</p>
            ) : null}
          </section>
        ) : null}

        <section
          id="christian-rose-stream"
          className="scroll-mt-4 px-4 py-14 md:px-6"
          style={{ backgroundColor: "#fffef7" }}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-6 flex w-full max-w-2xl list-none flex-col items-center gap-3 px-2">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li className="text-center font-christian-rose-sans text-xs font-semibold uppercase tracking-widest text-[#b76e79] md:text-sm">
                      Main event · {primaryDateFormatted}
                    </li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li
                      key={d.id}
                      className="text-center font-christian-rose-sans text-xs font-semibold uppercase tracking-widest text-[#b76e79] md:text-sm"
                    >
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="font-christian-rose-script text-4xl text-[#b76e79] md:text-5xl">Watch Live Stream</h2>
            </div>

            <div className={cn("grid grid-cols-1 gap-8 lg:items-start", event.allowChat ? "lg:grid-cols-3" : "")}>
              <div className={cn("space-y-6", event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
                {renderStreamPlayer(CHRISTIAN_ROSE_STREAM_SHELL)}
                {weddingHeroDescription ? (
                  <div
                    className="rounded-2xl border border-[#f4c2c2]/80 p-6 text-center shadow-md"
                    style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
                  >
                    <h3
                      className={cn(
                        "whitespace-pre-wrap text-[#8b4f5c]",
                        titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
                      )}
                      style={{
                        ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                        ...cardTitleFontSizeStyle(titleHeroRem),
                      }}
                    >
                      {weddingHeroDescription}
                    </h3>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#f4c2c2]/90 bg-white shadow-xl lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6">{renderDetailsPanel("wedding")}</div>
      </div>
    )
  }

  if (watchSkin === "muslimWeddingNikah") {
    const nikahEmerald = "#2d5f5d"
    const nikahGold = "#d4af37"
    const nikahDarkGold = "#b8941e"
    const nikahCream = "#faf8f3"
    const nikahIvory = "#fff9f0"
    const nikahDeep = "#1a3c3a"

    const scrollToNikahCountdown = () =>
      document.getElementById("nikah-countdown")?.scrollIntoView({ behavior: "smooth", block: "start" })
    const scrollToNikahStream = () =>
      document.getElementById("nikah-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
    const nikahHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-muslim-wedding-nikah") || ""

    const nikahStripActive =
      event.status === "scheduled" && !!event.scheduledAt && showScheduledPageEnabled
    const nikahStripPast =
      nikahStripActive && new Date(event.scheduledAt as unknown as string).getTime() <= Date.now()
    const nikahShowCountdown = nikahStripActive && !nikahStripPast

    return (
      <div
        className="relative flex min-h-screen flex-col overflow-x-hidden font-nikah-sans"
        style={{ backgroundColor: nikahCream, color: "#2c2c2c" }}
      >
        <style jsx global>{`
          @keyframes watchNikahStarRise {
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
          @keyframes watchNikahPattern {
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
          @keyframes watchNikahBismillahGlow {
            0%,
            100% {
              text-shadow: 0 0 12px rgba(212, 175, 55, 0.45), 0 0 24px rgba(212, 175, 55, 0.25);
            }
            50% {
              text-shadow: 0 0 22px rgba(212, 175, 55, 0.75), 0 0 40px rgba(212, 175, 55, 0.4);
            }
          }
          @keyframes watchNikahAmp {
            0%,
            100% {
              transform: rotate(0deg);
            }
            50% {
              transform: rotate(5deg);
            }
          }
        `}</style>

        <div
          className="pointer-events-none fixed inset-0 z-[1]"
          style={{
            opacity: 0.035,
            backgroundImage: `repeating-linear-gradient(45deg, ${nikahEmerald} 0px, ${nikahEmerald} 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, ${nikahGold} 0px, ${nikahGold} 2px, transparent 2px, transparent 10px)`,
          }}
          aria-hidden
        />

        <section
          className="relative z-[3] flex min-h-[88vh] flex-col overflow-hidden px-4 py-12 text-center md:py-16"
          style={{ background: `linear-gradient(135deg, ${nikahEmerald} 0%, ${nikahDeep} 100%)` }}
        >
          <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden motion-reduce:hidden" aria-hidden>
            {nikahStars.map((s) => (
              <span
                key={s.id}
                className="absolute"
                style={{
                  left: s.left,
                  bottom: "-8%",
                  color: nikahGold,
                  fontSize: s.size,
                  animationName: "watchNikahStarRise",
                  animationDuration: s.duration,
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: s.delay,
                }}
              >
                {s.symbol}
              </span>
            ))}
          </div>

          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              opacity: 0.12,
              backgroundImage: `radial-gradient(circle, ${nikahGold} 2px, transparent 2px)`,
              backgroundSize: "50px 50px",
              animation: "watchNikahPattern 32s linear infinite",
            }}
            aria-hidden
          />

          {nikahHeroBackdrop ? (
            <div
              className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25"
              style={{ backgroundImage: `url(${nikahHeroBackdrop})` }}
              aria-hidden
            />
          ) : null}

          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[72px] border-b-[3px] md:h-[100px]"
            style={{
              borderColor: nikahGold,
              background: "linear-gradient(to bottom, rgba(212, 175, 55, 0.28), transparent)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[72px] border-t-[3px] md:h-[100px]"
            style={{
              borderColor: nikahGold,
              background: "linear-gradient(to top, rgba(212, 175, 55, 0.28), transparent)",
            }}
            aria-hidden
          />

          <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col justify-center">
            <div className="mx-auto w-full max-w-3xl">
            <p
              className="font-nikah-amiri text-2xl font-normal leading-relaxed md:text-3xl lg:text-4xl"
              dir="rtl"
              style={{ color: nikahGold, animation: "watchNikahBismillahGlow 3s ease-in-out infinite" }}
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>

            <div className="mt-3 text-4xl md:text-5xl" style={{ color: nikahGold }} aria-hidden>
              ☪
            </div>

            {eventSubtitle ? (
              <p className="mt-3 font-nikah-sans text-xs font-semibold uppercase tracking-[0.28em] text-[#fff9f0]/95 [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                {eventSubtitle}
              </p>
            ) : null}

            <h1
              className={cn(
                "mt-3 font-nikah-display font-semibold leading-tight text-[#fff9f0] [text-shadow:0_4px_18px_rgba(0,0,0,0.45)]",
                titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
              )}
              style={{
                ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                ...heroTitleFontSizeStyle(titleHeroRem),
              }}
            >
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  {coupleParts[0]}{" "}
                  <span
                    className="inline-block"
                    style={{
                      color: nikahGold,
                      animation: "watchNikahAmp 3s ease-in-out infinite",
                      ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                    }}
                  >
                    &
                  </span>{" "}
                  {coupleParts[1]}
                </>
              ) : (
                coupleHero
              )}
            </h1>

            {weddingHeroDescription ? (
              <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-[#fff9f0]/90 md:text-base">
                {weddingHeroDescription}
              </p>
            ) : null}

            {primaryDateFormatted ? (
              <p className="mt-6 font-nikah-sans text-xs font-semibold uppercase tracking-widest text-[#fff9f0]/95 [text-shadow:0_2px_8px_rgba(0,0,0,0.45)] md:text-sm">
                {primaryDateFormatted}
              </p>
            ) : null}

            <Button
              asChild
              className="mt-8 h-auto rounded-full border-0 px-8 py-3 font-nikah-sans text-base font-semibold text-white shadow-lg"
              style={{ backgroundColor: nikahEmerald }}
            >
              <a
                href="#nikah-stream"
                className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToNikahStream()
                }}
              >
                <Play className="h-5 w-5" />
                Watch Live Stream
              </a>
            </Button>
            </div>
          </div>

          <button
            type="button"
            className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 cursor-pointer border-0 bg-transparent p-2 motion-reduce:hidden"
            style={{ color: nikahGold }}
            onClick={scrollToNikahCountdown}
            aria-label="Scroll to countdown"
          >
            <ChevronDown className="h-7 w-7 animate-bounce opacity-90" />
          </button>
        </section>

        {showScheduledPageEnabled && event.status === "scheduled" && event.scheduledAt ? (
          <section
            id="nikah-countdown"
            className="relative z-[3] scroll-mt-4 px-4 py-14 text-center"
            style={{ background: `linear-gradient(135deg, ${nikahGold}, ${nikahDarkGold})` }}
          >
            <h2 className="font-nikah-display text-3xl font-semibold md:text-4xl" style={{ color: nikahDeep }}>
              {nikahStripPast
                ? "Alhamdulillah!"
                : nikahShowCountdown
                  ? "Ceremony begins in…"
                  : primaryDateFormatted
                    ? "Save the date"
                    : "Join us"}
            </h2>
            <p className="mt-2 font-nikah-amiri text-base italic md:text-lg" style={{ color: nikahDeep }}>
              {nikahStripPast ? "May Allah bless our union" : "Join us for this blessed occasion"}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:gap-6">
              {(["Days", "Hours", "Minutes", "Seconds"] as const).map((label, i) => {
                const vals = [countdown.days, countdown.hours, countdown.minutes, countdown.seconds]
                const v = nikahShowCountdown ? vals[i] : 0
                return (
                  <div
                    key={label}
                    className="min-w-[80px] rounded-2xl border-[3px] bg-white/95 px-4 py-5 shadow-md md:min-w-[110px] md:px-6 md:py-6"
                    style={{ borderColor: nikahEmerald }}
                  >
                    <span className="font-nikah-display text-2xl font-bold tabular-nums md:text-3xl" style={{ color: nikahEmerald }}>
                      {String(v).padStart(2, "0")}
                    </span>
                    <div className="mt-2 font-nikah-sans text-[10px] font-medium uppercase tracking-widest text-[#2c2c2c] md:text-xs">
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            {!nikahShowCountdown && primaryDateFormatted ? (
              <p className="mt-6 font-nikah-sans text-sm" style={{ color: nikahDeep }}>
                {primaryDateFormatted}
              </p>
            ) : null}
          </section>
        ) : null}

        <section id="nikah-stream" className="scroll-mt-4 px-4 py-14 md:px-6" style={{ backgroundColor: nikahIvory }}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-6 flex w-full max-w-2xl list-none flex-col items-center gap-3 px-2">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li className="font-nikah-sans text-xs font-semibold uppercase tracking-widest md:text-sm" style={{ color: nikahEmerald }}>
                      Main event · {primaryDateFormatted}
                    </li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li
                      key={d.id}
                      className="font-nikah-sans text-xs font-semibold uppercase tracking-widest md:text-sm"
                      style={{ color: nikahEmerald }}
                    >
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="font-nikah-display text-4xl md:text-5xl" style={{ color: nikahEmerald }}>
                Watch Live Stream
              </h2>
            </div>

            <div className={cn("grid grid-cols-1 gap-8 lg:items-start", event.allowChat ? "lg:grid-cols-3" : "")}>
              <div className={cn("space-y-6", event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
                {renderStreamPlayer(NIKAH_STREAM_SHELL)}
                {weddingHeroDescription ? (
                  <div
                    className="rounded-2xl border-2 p-6 text-center shadow-md"
                    style={{ borderColor: nikahGold, backgroundColor: "rgba(255,255,255,0.98)" }}
                  >
                    <h3
                      className={cn("whitespace-pre-wrap", titleFallbackFontClass(watchTemplateId, !!googleTitleFont))}
                      style={{
                        color: nikahEmerald,
                        ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                        ...cardTitleFontSizeStyle(titleHeroRem),
                      }}
                    >
                      {weddingHeroDescription}
                    </h3>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-[20px] border-[3px] bg-white shadow-xl lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                  style={{ borderColor: nikahEmerald }}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6">{renderDetailsPanel("wedding")}</div>
      </div>
    )
  }

  if (watchSkin === "birthdayParty") {
    const bpPink = "#ff6b9d"
    const bpPurple = "#c44569"
    const bpBlue = "#4facfe"
    const bpYellow = "#ffd93d"
    const bpLight = "#fff5f8"

    const honoreeDisplay =
      String(weddingFields.honoreeName ?? "").trim() ||
      String(weddingFields.hostName ?? "").trim() ||
      event.title.split(/[–—|]/)[0]?.trim() ||
      event.title

    const rawPartyHeadline = String(weddingFields.partyHeadline ?? "").trim()
    const partyHeadlineBp =
      rawPartyHeadline || eventSubtitle || "We're getting married!"
    const partyTaglineBp = String(weddingFields.partyTagline ?? "").trim()
    const showBirthdaySubtitleLine =
      eventSubtitle.trim() !== "" &&
      eventSubtitle.trim().toLowerCase() !== partyHeadlineBp.trim().toLowerCase()

    const birthdayHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-birthday-party") || ""
    const birthdayPhotoUrl = couplePhotoTrimmed || heroFromEvent

    const bpStripActive =
      event.status === "scheduled" && !!event.scheduledAt && showScheduledPageEnabled
    const bpStripPast =
      bpStripActive && new Date(event.scheduledAt as unknown as string).getTime() <= Date.now()
    const bpShowCountdown = bpStripActive && !bpStripPast

    const scrollBirthdayCountdown = () =>
      document.getElementById("birthday-countdown")?.scrollIntoView({ behavior: "smooth", block: "start" })
    const scrollBirthdayStream = () =>
      document.getElementById("birthday-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })

    return (
      <div
        className="relative flex min-h-screen flex-col overflow-x-hidden font-birthday-sans text-[#2d3436]"
        style={{ backgroundColor: bpLight }}
      >
        <style jsx global>{`
          @keyframes watchBirthdayFloat {
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
              transform: translateY(-110vh) translateX(36px) rotate(360deg);
              opacity: 0;
            }
          }
          @keyframes bpPhotoFloat {
            0%,
            100% {
              transform: translateY(0) rotate(-4deg);
            }
            50% {
              transform: translateY(-10px) rotate(4deg);
            }
          }
        `}</style>

        <section
          className="relative z-[3] flex min-h-[88vh] flex-col overflow-hidden px-4 py-12 text-center md:py-16"
          style={{
            background: `linear-gradient(135deg, ${bpPink} 0%, ${bpPurple} 45%, ${bpBlue} 100%)`,
            color: "#2d3436",
          }}
        >
          {birthdayHeroBackdrop ? (
            <div
              className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25"
              style={{ backgroundImage: `url(${birthdayHeroBackdrop})` }}
              aria-hidden
            />
          ) : null}

          <div
            className="pointer-events-none absolute inset-0 z-[1] opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 0%, transparent 45%),
                radial-gradient(circle at 80% 70%, rgba(255,255,255,0.15) 0%, transparent 50%)
              `,
            }}
            aria-hidden
          />

          {/* Emoji + square confetti above the soft gradient wash so they stay visible */}
          <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden motion-reduce:hidden" aria-hidden>
            {birthdayConfetti.map((c) => (
              <span
                key={`c-${c.id}`}
                className="absolute block rounded-[1px]"
                style={{
                  left: c.left,
                  bottom: "-8%",
                  width: c.size,
                  height: c.size * c.heightMul,
                  backgroundColor: c.color,
                  animationName: "watchBirthdayFloat",
                  animationDuration: c.duration,
                  animationTimingFunction: "ease-in-out",
                  animationIterationCount: "infinite",
                  animationDelay: c.delay,
                }}
              />
            ))}
            {birthdayFloaters.map((f) => (
              <span
                key={f.id}
                className="absolute select-none"
                style={{
                  left: f.left,
                  bottom: "-10%",
                  fontSize: f.size,
                  animationName: "watchBirthdayFloat",
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

          <div className="relative z-20 flex min-h-0 w-full flex-1 flex-col justify-center">
            <div className="mx-auto w-full max-w-4xl px-2">
              <div className="relative mx-auto mb-6 h-[180px] w-[180px] motion-safe:animate-[bpPhotoFloat_3s_ease-in-out_infinite] md:h-[220px] md:w-[220px]">
                <div className="absolute -top-5 left-1/2 z-10 -translate-x-1/2 text-4xl" aria-hidden>
                  🎉
                </div>
                <div
                  className="h-full w-full rounded-full p-1.5 shadow-2xl md:p-2"
                  style={{
                    background: `linear-gradient(45deg, ${bpYellow}, #ff9a56, ${bpPink})`,
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-gradient-to-br from-violet-500 to-fuchsia-600">
                    {birthdayPhotoUrl ? (
                      <img src={birthdayPhotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Cake className="h-20 w-20 text-white/90 md:h-24 md:w-24" aria-hidden />
                    )}
                  </div>
                </div>
              </div>

              <h1
                className={cn(
                  "font-birthday-display text-2xl uppercase tracking-wider text-white md:text-4xl",
                  titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
                )}
                style={{
                  ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                  textShadow: `3px 3px 0 ${bpPurple}, 6px 6px 0 ${bpPink}, 8px 8px 18px rgba(0,0,0,0.25)`,
                }}
              >
                {partyHeadlineBp}
              </h1>

              <p
                className="font-coastal-script mt-4 text-4xl text-[#ffd93d] md:text-6xl"
                style={{ textShadow: "3px 3px 10px rgba(0,0,0,0.35)" }}
              >
                {honoreeDisplay}
              </p>

              <div
                className="mx-auto mt-5 inline-flex items-center justify-center rounded-full border-[3px] border-white/90 px-5 py-2 backdrop-blur-md md:px-7 md:py-2.5"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <span
                  className="text-3xl leading-none motion-safe:animate-pulse md:text-4xl"
                  aria-hidden
                  style={{ animationDuration: "1.2s" }}
                >
                  🎂
                </span>
              </div>

              {partyTaglineBp ? (
                <p className="mt-5 text-base font-light text-white md:text-xl" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.25)" }}>
                  {partyTaglineBp}
                </p>
              ) : null}

              {weddingHeroDescription ? (
                <p
                  className={cn(
                    "mx-auto max-w-xl text-sm text-white/95 md:text-base",
                    partyTaglineBp ? "mt-4" : "mt-5",
                  )}
                >
                  {weddingHeroDescription}
                </p>
              ) : null}

              {primaryDateFormatted ? (
                <p className="mt-4 font-semibold uppercase tracking-widest text-white/95 [text-shadow:0_2px_8px_rgba(0,0,0,0.35)] text-xs md:text-sm">
                  {primaryDateFormatted}
                </p>
              ) : null}

              {showBirthdaySubtitleLine ? (
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/90 md:text-sm">
                  {eventSubtitle}
                </p>
              ) : null}

              <div className="mt-6 flex justify-center gap-3 text-2xl md:text-3xl" aria-hidden>
                {["🎈", "🎉", "🎊", "🎁", "🥳"].map((e) => (
                  <span key={e}>{e}</span>
                ))}
              </div>

              <Button
                asChild
                className="mt-8 h-auto rounded-full border-0 px-8 py-3 font-semibold text-white shadow-lg"
                style={{ backgroundColor: bpPurple }}
              >
                <a
                  href="#birthday-stream"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollBirthdayStream()
                  }}
                >
                  <Play className="h-5 w-5" />
                  Watch Live Stream
                </a>
              </Button>
            </div>
          </div>

          <button
            type="button"
            className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 cursor-pointer border-0 bg-transparent p-2 text-white motion-reduce:hidden"
            onClick={() => {
              if (showScheduledPageEnabled && event.scheduledAt) scrollBirthdayCountdown()
              else scrollBirthdayStream()
            }}
            aria-label="Scroll down"
          >
            <ChevronDown className="h-7 w-7 animate-bounce opacity-90" />
          </button>
        </section>

        {showScheduledPageEnabled && event.status === "scheduled" && event.scheduledAt ? (
          <section
            id="birthday-countdown"
            className="relative z-[3] scroll-mt-4 px-4 py-14 text-center"
            style={{ background: `linear-gradient(135deg, #ff9a56 0%, ${bpPink} 100%)` }}
          >
            <h2 className="font-birthday-display text-3xl font-semibold text-white md:text-4xl">
              {bpStripPast ? "🎉 Party time! 🎉" : bpShowCountdown ? "Party starts in…" : "Save the date"}
            </h2>
            <p className="mt-2 font-birthday-sans text-base italic text-white/95">
              {bpStripPast ? "Thanks for celebrating!" : "Join us for cake and fun"}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 md:gap-6">
              {(["Days", "Hours", "Minutes", "Seconds"] as const).map((label, i) => {
                const vals = [countdown.days, countdown.hours, countdown.minutes, countdown.seconds]
                const v = bpShowCountdown ? vals[i] : 0
                return (
                  <div
                    key={label}
                    className="min-w-[80px] rounded-2xl border-[3px] bg-white/95 px-4 py-5 shadow-md md:min-w-[110px] md:px-6 md:py-6"
                    style={{ borderColor: bpPink }}
                  >
                    <span className="font-birthday-display text-2xl font-bold tabular-nums text-[#2d3436] md:text-3xl">
                      {String(v).padStart(2, "0")}
                    </span>
                    <div className="mt-2 text-[10px] font-medium uppercase tracking-widest text-[#2d3436]/80 md:text-xs">
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
            {!bpShowCountdown && primaryDateFormatted ? (
              <p className="mt-6 text-sm text-[#2d3436]">{primaryDateFormatted}</p>
            ) : null}
          </section>
        ) : null}

        <section id="birthday-stream" className="scroll-mt-4 px-4 py-14 md:px-6" style={{ backgroundColor: bpLight, color: "#2d3436" }}>
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-6 flex w-full max-w-2xl list-none flex-col items-center gap-3 px-2">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li className="text-xs font-semibold uppercase tracking-widest md:text-sm" style={{ color: bpPurple }}>
                      Main event · {primaryDateFormatted}
                    </li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li
                      key={d.id}
                      className="text-xs font-semibold uppercase tracking-widest md:text-sm"
                      style={{ color: bpPurple }}
                    >
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="font-birthday-display text-4xl md:text-5xl" style={{ color: bpPurple }}>
                Watch Live Stream
              </h2>
            </div>

            <div className={cn("grid grid-cols-1 gap-8 lg:items-start", event.allowChat ? "lg:grid-cols-3" : "")}>
              <div className={cn("space-y-6", event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
                {renderStreamPlayer(BIRTHDAY_STREAM_SHELL)}
                {weddingHeroDescription ? (
                  <div
                    className="rounded-2xl border-2 border-pink-200 bg-white p-6 text-center shadow-md"
                    style={{ borderColor: bpPink }}
                  >
                    <h3
                      className={cn("whitespace-pre-wrap text-[#2d3436]", titleFallbackFontClass(watchTemplateId, !!googleTitleFont))}
                      style={{
                        ...(googleTitleFont ? { fontFamily: `"${googleTitleFont}", system-ui, sans-serif` } : {}),
                        ...cardTitleFontSizeStyle(titleHeroRem),
                      }}
                    >
                      {weddingHeroDescription}
                    </h3>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-2xl border-[3px] bg-white shadow-xl lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                  style={{ borderColor: bpPink }}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6">{renderDetailsPanel("default")}</div>
      </div>
    )
  }

  if (watchSkin === "weddingMidnight") {
    const scrollToMidnightStream = () =>
      document.getElementById("midnight-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
    const midnightHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-wedding-midnight") || ""

    return (
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#0a0a0a] font-midnight-sans text-zinc-100">
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.14]"
          aria-hidden
          style={{
            backgroundImage: `
              linear-gradient(rgba(212, 175, 55, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212, 175, 55, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
          }}
        />
        <div
          className="pointer-events-none fixed inset-0 z-[5] opacity-[0.07]"
          aria-hidden
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.25))",
            backgroundSize: "100% 4px",
          }}
        />

        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
          {midnightParticles.map((p) => (
            <span
              key={p.id}
              className="fixed top-[-4%] h-1 w-1 rounded-full bg-[#d4af37]"
              style={{
                left: p.left,
                animation: `midnightParticleFloat ${p.duration} linear ${p.delay} infinite`,
              }}
            />
          ))}
        </div>

        <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
          {midnightHeroBackdrop ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45"
              style={{ backgroundImage: `url(${midnightHeroBackdrop})` }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/75 to-[#0a0a0a]" />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,0.14)_0%,transparent_58%)]"
            aria-hidden
          />

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            {eventSubtitle ? (
              <p className="midnight-typing-caret font-midnight-sans text-xs font-medium uppercase tracking-[0.35em] text-amber-500/85 md:text-sm">
                {eventSubtitle}
              </p>
            ) : null}

            {/* Always Italiana for couple display; title Google Font is not applied here (was replacing serif with sans). */}
            <h1
              className="mt-6 font-midnight-display font-normal leading-[1.08] tracking-tight"
              style={heroTitleFontSizeStyle(titleHeroRem)}
            >
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  <span className="midnight-gold-shimmer-text midnight-name-glitch block font-midnight-display">
                    {coupleParts[0]}
                  </span>
                  <span className="midnight-name-glitch my-1 block font-midnight-display text-2xl text-zinc-400 md:text-3xl">
                    &
                  </span>
                  <span className="midnight-gold-shimmer-text midnight-name-glitch block font-midnight-display">
                    {coupleParts[1]}
                  </span>
                </>
              ) : (
                <span className="midnight-gold-shimmer-text midnight-name-glitch font-midnight-display">
                  {coupleHero}
                </span>
              )}
            </h1>

            <div className="mx-auto mt-8 h-px w-36 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />

            {weddingHeroDescription ? (
              <p className="mx-auto mt-8 max-w-2xl font-midnight-sans text-sm font-medium leading-relaxed text-zinc-400 md:text-base">
                {weddingHeroDescription}
              </p>
            ) : null}

            <div className={cn("mx-auto max-w-2xl", weddingHeroDescription ? "mt-10" : "mt-8")}>
              {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border border-amber-500/25 bg-black/40 px-3 py-4 backdrop-blur-sm"
                    >
                      <p className="font-midnight-display text-2xl tabular-nums text-amber-100 md:text-3xl">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 font-midnight-sans text-[10px] font-semibold uppercase tracking-widest text-amber-500/70">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : primaryDateFormatted ? (
                <p className="font-midnight-sans text-sm font-semibold uppercase tracking-widest text-amber-200/90">
                  {primaryDateFormatted}
                </p>
              ) : (
                <p className="font-midnight-sans text-sm font-medium text-amber-200/70">Date &amp; time TBA</p>
              )}
            </div>

            <Button
              asChild
              className="mt-12 h-auto rounded-none border border-amber-500/45 bg-black/60 px-10 py-3 font-midnight-sans text-sm font-semibold uppercase tracking-[0.2em] text-amber-200 shadow-[0_0_24px_rgba(212,175,55,0.18)] hover:bg-amber-500/10"
            >
              <a
                href="#midnight-stream"
                className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToMidnightStream()
                }}
              >
                <Play className="h-5 w-5" />
                Watch Live Stream
              </a>
            </Button>
          </div>

          <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-amber-500/60">
            <ChevronDown className="h-7 w-7 animate-bounce" />
          </div>
        </section>

        <section
          id="midnight-stream"
          className="scroll-mt-4 border-t border-amber-500/15 bg-gradient-to-b from-black to-zinc-950 px-4 py-16 md:px-6"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-8 flex w-full max-w-2xl list-none flex-col items-center gap-3 px-2 font-midnight-sans text-xs font-semibold uppercase tracking-widest text-amber-500/80">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li>Main event · {primaryDateFormatted}</li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li key={d.id}>
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="midnight-gold-shimmer-text midnight-name-glitch font-midnight-display mt-2 text-4xl font-normal md:text-5xl">
                Watch Live Stream
              </h2>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:items-start",
                event.allowChat ? "lg:grid-cols-3" : "",
              )}
            >
              <div className={cn("space-y-6", event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
                {renderStreamPlayer(MIDNIGHT_STREAM_SHELL)}
                {weddingHeroDescription ? (
                  <div className="border border-amber-500/25 bg-black/50 p-6 text-center backdrop-blur-sm">
                    <p className="font-midnight-sans text-sm font-medium leading-relaxed text-zinc-300">
                      {weddingHeroDescription}
                    </p>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-none border border-amber-500/35 bg-black/90 shadow-[0_0_28px_rgba(0,0,0,0.5)] lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">{renderDetailsPanel("midnight")}</div>
      </div>
    )
  }

  if (watchSkin === "weddingCoastal") {
    const scrollToCoastalStream = () =>
      document.getElementById("coastal-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
    const coastalHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-wedding-coastal") || ""

    return (
      <div className="relative flex min-h-screen flex-col overflow-x-hidden coastal-sand-texture-bg font-coastal-sans text-slate-800">
        <div className="pointer-events-none fixed inset-0 z-[2] overflow-hidden" aria-hidden>
          {coastalBubbles.map((b) => (
            <span
              key={b.id}
              className="fixed rounded-full"
              style={{
                left: b.left,
                width: b.size,
                height: b.size,
                bottom: "-100px",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.85), rgba(131,197,190,0.35))",
                animation: `coastalBubbleRise ${b.duration} infinite ease-in`,
                animationDelay: b.delay,
              }}
            />
          ))}
        </div>

        <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden pt-10">
          {coastalHeroBackdrop ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${coastalHeroBackdrop})` }}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-b from-[#83c5be]/40 via-[#edf6f9] to-[#e6ccb2]/50"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-[#edf6f9]/80 to-[#edf6f9]/95" aria-hidden />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-[100px] overflow-hidden"
            aria-hidden
          >
            <div className="coastal-wave-layer coastal-wave-layer-3" />
            <div className="coastal-wave-layer coastal-wave-layer-2" />
            <div className="coastal-wave-layer" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <p className="text-2xl motion-safe:animate-[pulse_3s_ease-in-out_infinite]" aria-hidden>
              🐚
            </p>

            <h1
              className="mt-4 font-coastal-script font-normal leading-[1.1] tracking-tight text-[#006d77]"
              style={heroTitleFontSizeStyle(titleHeroRem)}
            >
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  {coupleParts[0]}{" "}
                  <span className="text-[#e29578]">&</span> {coupleParts[1]}
                </>
              ) : (
                coupleHero
              )}
            </h1>

            {eventSubtitle ? (
              <p className="mt-4 text-lg font-medium text-[#e29578] md:text-xl">{eventSubtitle}</p>
            ) : null}

            {primaryDateFormatted ? (
              <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-slate-600 md:text-base">
                <span className="motion-safe:animate-[spin_8s_linear_infinite]" aria-hidden>
                  ⭐
                </span>
                <span className="text-slate-400">•</span>
                <span>{primaryDateFormatted}</span>
                <span className="text-slate-400">•</span>
                <span className="motion-safe:animate-[spin_8s_linear_infinite]" aria-hidden>
                  ⭐
                </span>
              </p>
            ) : null}

            {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
              <div className="mx-auto mt-8 inline-block rounded-3xl border border-white/50 bg-white/70 p-6 shadow-[0_8px_32px_rgba(0,109,119,0.12)] backdrop-blur-md">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label} className="min-w-[72px] text-center">
                      <p className="text-2xl font-bold tabular-nums text-[#006d77] md:text-3xl">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {weddingHeroDescription ? (
              <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                {weddingHeroDescription}
              </p>
            ) : null}

            <Button
              asChild
              className="mt-10 h-auto rounded-full bg-gradient-to-br from-[#e29578] to-[#d4846a] px-10 py-3 font-coastal-sans text-base font-semibold text-white shadow-lg transition hover:opacity-95"
            >
              <a
                href="#coastal-stream"
                className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline text-inherit"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToCoastalStream()
                }}
              >
                <Play className="h-5 w-5" />
                Watch Live Stream
              </a>
            </Button>
          </div>

          <div className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2 text-[#006d77]/70">
            <ChevronDown className="h-7 w-7 animate-bounce" />
          </div>
        </section>

        <section
          id="coastal-stream"
          className="scroll-mt-4 bg-gradient-to-b from-[#edf6f9] to-[#e6ccb2] px-4 py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-8 flex w-full max-w-2xl list-none flex-col items-center gap-4 px-2">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li className="text-center text-sm font-semibold uppercase tracking-widest text-[#e29578]">
                      Main event · {primaryDateFormatted}
                    </li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li
                      key={d.id}
                      className="text-center text-sm font-semibold uppercase tracking-widest text-[#006d77]"
                    >
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="mt-2 font-coastal-script text-4xl text-[#006d77] md:text-5xl">Watch Live Stream</h2>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:items-start",
                event.allowChat ? "lg:grid-cols-3" : "",
              )}
            >
              <div className={cn("space-y-6", event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
                {renderStreamPlayer(COASTAL_STREAM_SHELL)}
                {weddingHeroDescription ? (
                  <div className="rounded-2xl border border-white/55 bg-white/70 p-6 text-center shadow-md backdrop-blur-md">
                    <p className="font-coastal-sans text-sm font-medium leading-relaxed text-slate-700 md:text-base">
                      {weddingHeroDescription}
                    </p>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-teal-200/80 bg-white/90 shadow-[0_8px_32px_rgba(0,109,119,0.12)] backdrop-blur-sm lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">{renderDetailsPanel("coastal")}</div>
      </div>
    )
  }

  if (watchSkin === "corporateTechForward") {
    const cFields = weddingFields
    const heroSubtitle =
      eventSubtitle ||
      (cFields.companyTagline ?? "").trim() ||
      "Live summit"
    const heroBlurb =
      (cFields.eventTagline ?? "").trim() ||
      (typeof event.description === "string" ? event.description.trim() : "") ||
      "Join innovators and teams for our live broadcast experience."
    const corpLogoHero =
      typeof cFields.companyLogo === "string" ? cFields.companyLogo.trim() : ""
    /**
     * Don't use `heroBackdropUrl` alone: it already falls back to the default image, which would
     * skip template `companyLogo`. Order: event hero → company logo → default Unsplash.
     */
    const corpHeroBackdrop =
      heroFromEvent ||
      corpLogoHero ||
      getDefaultTemplateHeroBackdropUrl(watchTemplateId) ||
      getDefaultTemplateHeroBackdropUrl("tpl-corporate-tech-forward") ||
      ""
    const corpHeroBackdropIsCustom = !!(heroFromEvent || corpLogoHero)

    return (
      <CorporateTechForwardWatchView
        event={event}
        heroSubtitle={heroSubtitle}
        heroBlurb={heroBlurb}
        heroBackdropUrl={corpHeroBackdrop}
        heroBackdropIsCustom={corpHeroBackdropIsCustom}
        primaryDateFormatted={primaryDateFormatted}
        eventDates={eventDates}
        formatExtraDate={formatExtraDate}
        showScheduledPageEnabled={showScheduledPageEnabled}
        countdown={countdown}
        allowChat={!!event.allowChat}
        showChat={showChat}
        renderStreamPlayer={renderStreamPlayer}
        renderLiveChatBody={renderLiveChatBody}
        detailsPanel={
          <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">{renderDetailsPanel("corporateTech")}</div>
        }
        streamShellClassName={CORPORATE_TECH_STREAM_SHELL}
        eventDescriptionBelowStream={weddingHeroDescription}
      />
    )
  }

  if (watchSkin === "weddingCelestial") {
    const scrollToCelestialStream = () =>
      document.getElementById("celestial-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })
    const celestialHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-wedding-celestial") || ""
    const celestialQuote = (weddingFields.customMessage ?? "").trim()

    return (
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#0b0d17] font-celestial-sans text-zinc-100">
        <section className="relative z-10 flex min-h-[88vh] items-center justify-center overflow-hidden pt-12">
          {celestialHeroBackdrop ? (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
              style={{ backgroundImage: `url(${celestialHeroBackdrop})` }}
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d17]/20 via-[#1a1f3d]/85 to-[#0b0d17]" aria-hidden />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(74,14,78,0.35)_0%,transparent_55%)]"
            aria-hidden
          />

          <div className="celestial-aurora-hero z-[1]" aria-hidden />
          <div
            className="celestial-nebula-blob z-[1] h-96 w-96 bg-purple-600 top-20 -left-20"
            style={{ animationDelay: "2s" }}
            aria-hidden
          />
          <div
            className="celestial-nebula-blob z-[1] h-80 w-80 bg-blue-600 bottom-24 -right-20"
            style={{ animationDelay: "10s" }}
            aria-hidden
          />

          <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
            {celestialStars.map((s) => (
              <span
                key={s.id}
                className="celestial-star-dot"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  animationDuration: s.duration,
                  animationDelay: s.delay,
                }}
              />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden motion-reduce:hidden" aria-hidden>
            <span className="celestial-shooting-star celestial-shooting-star--track1" style={{ top: "6%", left: "4%" }} />
            <span className="celestial-shooting-star celestial-shooting-star--track2" style={{ top: "22%", left: "-2%" }} />
            <span className="celestial-shooting-star celestial-shooting-star--track3" style={{ top: "38%", left: "8%" }} />
          </div>

          <svg
            className="pointer-events-none absolute left-1/2 top-8 z-[4] h-48 w-full max-w-lg -translate-x-1/2 opacity-40 md:top-12 md:h-56"
            viewBox="0 0 400 200"
            aria-hidden
          >
            <circle cx="50" cy="100" r="3" fill="#ffd700" className="animate-pulse [animation-duration:4.5s]" />
            <circle cx="150" cy="50" r="3" fill="#ffd700" className="animate-pulse [animation-duration:4.5s] [animation-delay:0.8s]" />
            <circle cx="250" cy="80" r="3" fill="#ffd700" className="animate-pulse [animation-duration:4.5s] [animation-delay:1.6s]" />
            <circle cx="350" cy="100" r="3" fill="#ffd700" className="animate-pulse [animation-duration:4.5s] [animation-delay:2.4s]" />
            <line
              x1="50"
              y1="100"
              x2="150"
              y2="50"
              stroke="rgba(255,215,0,0.35)"
              strokeWidth="1"
              fill="none"
              style={{
                strokeDasharray: 400,
                strokeDashoffset: 400,
                animation: "celestialDrawLine 5.5s ease-out forwards",
              }}
            />
            <line
              x1="150"
              y1="50"
              x2="250"
              y2="80"
              stroke="rgba(255,215,0,0.35)"
              strokeWidth="1"
              fill="none"
              style={{
                strokeDasharray: 400,
                strokeDashoffset: 400,
                animation: "celestialDrawLine 5.5s ease-out 0.8s forwards",
              }}
            />
            <line
              x1="250"
              y1="80"
              x2="350"
              y2="100"
              stroke="rgba(255,215,0,0.35)"
              strokeWidth="1"
              fill="none"
              style={{
                strokeDasharray: 400,
                strokeDashoffset: 400,
                animation: "celestialDrawLine 5.5s ease-out 1.6s forwards",
              }}
            />
          </svg>

          <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
            <div className="celestial-moon-disc mx-auto shadow-2xl" aria-hidden />

            <h1
              className="mt-8 bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 bg-clip-text font-celestial-display font-semibold leading-[1.05] tracking-tight text-transparent"
              style={heroTitleFontSizeStyle(titleHeroRem)}
            >
              {coupleParts && coupleParts.length === 2 ? (
                <>
                  <span className="uppercase">{coupleParts[0]}</span>{" "}
                  <span className="text-yellow-500/90">&</span>{" "}
                  <span className="uppercase">{coupleParts[1]}</span>
                </>
              ) : (
                <span className="uppercase">{coupleHero}</span>
              )}
            </h1>

            {eventSubtitle ? (
              <p className="mt-6 text-sm font-medium uppercase tracking-[0.35em] text-zinc-400 md:text-base">
                {eventSubtitle}
              </p>
            ) : null}

            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-[rgba(255,215,0,0.2)] bg-[rgba(26,31,61,0.55)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl md:p-8">
              {celestialQuote ? (
                <p className="mb-6 text-center text-sm italic leading-relaxed text-zinc-300 md:text-base">
                  &ldquo;{celestialQuote}&rdquo;
                </p>
              ) : null}
              {event.status === "scheduled" && event.scheduledAt && showScheduledPageEnabled ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
                  {[
                    { label: "Days", value: countdown.days },
                    { label: "Hours", value: countdown.hours },
                    { label: "Minutes", value: countdown.minutes },
                    { label: "Seconds", value: countdown.seconds },
                  ].map((item) => (
                    <div key={item.label} className="text-center">
                      <p className="font-celestial-display text-2xl font-bold tabular-nums text-yellow-400 md:text-3xl">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              ) : primaryDateFormatted ? (
                <p className="text-center text-sm font-medium text-zinc-300">{primaryDateFormatted}</p>
              ) : (
                <p className="text-center text-sm font-medium text-zinc-500">Date &amp; time TBA</p>
              )}
            </div>

            {weddingHeroDescription ? (
              <p className="mx-auto mt-8 max-w-2xl text-sm leading-relaxed text-zinc-400 md:text-base">
                {weddingHeroDescription}
              </p>
            ) : null}

            <Button
              asChild
              className="mt-10 h-auto rounded-full border border-purple-400/30 bg-gradient-to-r from-purple-600 to-blue-600 px-10 py-3 font-celestial-sans text-base font-semibold text-white shadow-lg transition hover:shadow-[0_0_28px_rgba(147,51,234,0.45)]"
            >
              <a
                href="#celestial-stream"
                className="inline-flex cursor-pointer items-center justify-center gap-2 no-underline text-inherit"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToCelestialStream()
                }}
              >
                <Play className="h-5 w-5" />
                Watch Live Stream
              </a>
            </Button>
          </div>

          <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 text-yellow-500/60">
            <ChevronDown className="h-7 w-7 animate-bounce" />
          </div>
        </section>

        <section
          id="celestial-stream"
          className="relative z-10 scroll-mt-4 border-t border-violet-600/25 bg-gradient-to-b from-[#0b0d17] via-[#1a1f3d]/90 to-[#0b0d17] px-4 py-16"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              {(event.scheduledAt || eventDates.length > 0) && (
                <ul className="mx-auto mb-6 mt-6 flex w-full max-w-2xl list-none flex-col items-center gap-3 px-2 font-mono text-xs font-semibold uppercase tracking-widest text-violet-300/90">
                  {event.scheduledAt && primaryDateFormatted ? (
                    <li>Main event · {primaryDateFormatted}</li>
                  ) : null}
                  {eventDates.map((d) => (
                    <li key={d.id}>
                      {(d.label || "Session").trim()} · {formatExtraDate(d)}
                    </li>
                  ))}
                </ul>
              )}
              <h2 className="mt-2 font-celestial-display text-4xl text-white md:text-5xl">Watch Live Stream</h2>
            </div>

            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:items-start",
                event.allowChat ? "lg:grid-cols-3" : "",
              )}
            >
              <div className={cn("space-y-6", event.allowChat ? "lg:col-span-2" : "mx-auto w-full max-w-5xl")}>
                <div className="relative">
                  {renderStreamPlayer(CELESTIAL_STREAM_SHELL)}
                  <div
                    className="pointer-events-none absolute inset-0 z-[6] rounded-3xl bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.12)_50%)] bg-[length:100%_4px] opacity-30"
                    aria-hidden
                  />
                </div>
                {weddingHeroDescription ? (
                  <div className="rounded-2xl border border-[rgba(255,215,0,0.18)] bg-[rgba(26,31,61,0.5)] p-6 text-center backdrop-blur-md">
                    <p className="font-mono text-sm font-medium leading-relaxed text-zinc-300 md:text-base">
                      {weddingHeroDescription}
                    </p>
                  </div>
                ) : null}
              </div>

              {event.allowChat ? (
                <div
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-3xl border border-violet-600/35 bg-[#1a1f3d]/80 shadow-[0_0_32px_rgba(0,0,0,0.45)] backdrop-blur-md lg:min-h-[600px] ${
                    showChat ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {renderLiveChatBody()}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-8">
          {renderDetailsPanel("celestial")}
        </div>
      </div>
    )
  }

  if (watchSkin === "weddingTraditionalHindu") {
    const hinduHeroBackdrop =
      heroBackdropUrl || getDefaultTemplateHeroBackdropUrl("tpl-wedding-traditional-hindu") || ""
    const hinduQuote = (weddingFields.customMessage ?? "").trim()

    return (
      <WeddingTraditionalHinduWatchView
        event={event}
        watchTemplateId={watchTemplateId}
        coupleHero={coupleHero}
        coupleParts={coupleParts}
        weddingHeroDescription={weddingHeroDescription}
        eventSubtitle={eventSubtitle}
        customQuote={hinduQuote}
        primaryDateFormatted={primaryDateFormatted}
        eventDates={eventDates}
        formatExtraDate={formatExtraDate}
        showScheduledPageEnabled={showScheduledPageEnabled}
        countdown={countdown}
        allowChat={!!event.allowChat}
        showChat={showChat}
        renderStreamPlayer={renderStreamPlayer}
        renderLiveChatBody={renderLiveChatBody}
        detailsPanel={
          <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">{renderDetailsPanel("traditionalHindu")}</div>
        }
        streamShellClassName={TRADITIONAL_HINDU_STREAM_SHELL}
        heroBackdropUrl={hinduHeroBackdrop}
        titleHeroRem={titleHeroRem}
        googleTitleFont={googleTitleFont}
      />
    )
  }

  if (watchSkin === "memorialService") {
    const deceasedNameDisplay = (weddingFields.deceasedName ?? "").trim() || event.title
    const deceasedPhotoMemorial =
      typeof weddingFields.deceasedPhoto === "string" ? weddingFields.deceasedPhoto.trim() : ""

    return (
      <MemorialServiceWatchView
        event={event}
        heroBackdropUrl={heroBackdropUrl}
        deceasedName={deceasedNameDisplay}
        deceasedPhotoUrl={deceasedPhotoMemorial}
        birthDateLabel={formatMemorialDate(
          weddingFields.birthDate != null && String(weddingFields.birthDate).trim() !== ""
            ? String(weddingFields.birthDate).trim()
            : undefined,
        )}
        passedDateLabel={formatMemorialDate(
          weddingFields.passedDate != null && String(weddingFields.passedDate).trim() !== ""
            ? String(weddingFields.passedDate).trim()
            : undefined,
        )}
        memorialHeadline={(weddingFields.memorialHeadline ?? "").trim()}
        memorialTagline={(weddingFields.memorialTagline ?? "").trim()}
        memorialQuote={(weddingFields.memorialQuote ?? "").trim()}
        footerVerse={(weddingFields.footerVerse ?? "").trim()}
        tributeMessage={(weddingFields.tributeMessage ?? "").trim()}
        inLieuOf={(weddingFields.inLieuOf ?? "").trim()}
        eventSubtitle={eventSubtitle}
        eventDescription={typeof event.description === "string" ? event.description.trim() : ""}
        primaryDateFormatted={primaryDateFormatted}
        showScheduledPageEnabled={showScheduledPageEnabled}
        countdown={countdown}
        allowChat={!!event.allowChat}
        showChat={showChat}
        setShowChat={setShowChat}
        renderStreamPlayer={renderStreamPlayer}
        renderLiveChatBody={renderLiveChatBody}
        detailsPanel={
          <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8">{renderDetailsPanel("memorial")}</div>
        }
        streamShellClassName={MEMORIAL_STREAM_SHELL}
        photoGalleryUrls={photoGalleryUrls}
        titleHeroRem={titleHeroRem}
        googleTitleFont={googleTitleFont}
        titleFallbackFontClass={titleFallbackFontClass(watchTemplateId, !!googleTitleFont)}
        heroTitleFontSizeStyle={heroTitleFontSizeStyle}
      />
    )
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background lg:flex-row">
      <div className="flex flex-1 flex-col">
        {heroImageUrl && (
          <div className="relative aspect-[21/9] max-h-[280px] w-full overflow-hidden bg-muted">
            <img src={heroImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        {showTemplateBanner && (
          <EventTemplateBanner
            event={event}
            templateId={templateId}
            templateData={templateData}
            headlineTypography={{
              titleHeroRem,
              googleTitleFont,
              fallbackFontClass: titleFallbackFontClass(watchTemplateId, !!googleTitleFont),
            }}
          />
        )}
        {renderStreamPlayer(DEFAULT_STREAM_SHELL)}
        {renderDetailsPanel("default")}
      </div>

      {event.allowChat && showChat && (
        <div className="flex h-[400px] flex-col border-t border-border lg:h-auto lg:w-80 lg:border-l lg:border-t-0">
          {renderLiveChatBody()}
        </div>
      )}
    </div>
  )
}
