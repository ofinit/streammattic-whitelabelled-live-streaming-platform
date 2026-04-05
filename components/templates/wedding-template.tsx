"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Volume2,
  Settings,
  Maximize2,
  Send,
  ArrowLeft,
  Eye,
  Radio,
  MessageCircle,
  X,
  ChevronDown,
  Play,
  Instagram,
} from "lucide-react"
import Link from "next/link"
import { getDefaultTemplateHeroBackdropUrl } from "@/lib/template-default-media"

interface TemplateProps {
  eventTitle?: string
  eventDescription?: string
  /** Optional hero image; defaults to template stock photo */
  heroImageUrl?: string
}

const CORAL = "text-[#d4a27c]"
const CORAL_BG = "bg-[#d4a27c]"
const CREAM = "bg-[#faf6f0]"
const CHARCOAL = "bg-[#1c1c1c]"

const mockChatMessages = [
  { id: 1, user: "Katy Perry", message: "Congratulations you two! 💕", time: "2:30 PM", color: "bg-rose-400" },
  { id: 2, user: "Zayn Malik", message: "Wish I could be there in person!", time: "2:31 PM", color: "bg-amber-400" },
  { id: 3, user: "Emily", message: "So beautiful!", time: "2:32 PM", color: "bg-rose-300" },
  { id: 4, user: "Michael", message: "Streaming perfectly here in London", time: "2:33 PM", color: "bg-amber-300" },
  { id: 5, user: "Sophia", message: "Love the venue shots", time: "2:34 PM", color: "bg-rose-400" },
]

const TIMELINE = [
  { time: "4:00 PM", title: "Guest Arrival", side: "left" as const },
  { time: "5:00 PM", title: "Ceremony", side: "right" as const },
  { time: "6:00 PM", title: "Cocktail Hour", side: "left" as const },
  { time: "7:30 PM", title: "Reception", side: "right" as const },
  { time: "11:00 PM", title: "Farewell", side: "left" as const },
]

function splitCoupleTitle(title: string): { first: string; second: string } | null {
  const m = title.match(/^(.+?)\s*[&+]\s*(.+)$/)
  if (!m) return null
  return { first: m[1].trim(), second: m[2].trim() }
}

export function WeddingTemplate({
  eventTitle = "Sarah & Michael",
  eventDescription = "Invite you to celebrate their big day.",
  heroImageUrl: heroImageUrlProp,
}: TemplateProps) {
  const [chatMessage, setChatMessage] = useState("")
  const [viewerCount] = useState(1247)
  const [showMobileChat, setShowMobileChat] = useState(false)

  const heroBackdrop =
    heroImageUrlProp?.trim() || getDefaultTemplateHeroBackdropUrl("tpl-wedding") || ""

  const coupleParts = useMemo(() => splitCoupleTitle(eventTitle), [eventTitle])

  const scrollToStream = () =>
    document.getElementById("preview-wedding-stream")?.scrollIntoView({ behavior: "smooth", block: "start" })

  const loveStoryImages = {
    met: "https://images.unsplash.com/photo-1522673606160-79cad1fbcc1e?auto=format&fit=crop&w=900&q=80",
    proposal: "https://images.unsplash.com/photo-1515934751875-772bb296970c?auto=format&fit=crop&w=900&q=80",
  }

  return (
    <div className={`min-h-screen ${CREAM} text-stone-800`}>
      {/* Preview chrome */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-stone-200/80 bg-[#faf6f0]/95 px-3 py-2 backdrop-blur-md md:px-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/control-center">
            <Button variant="ghost" size="sm" className="text-stone-600 hover:text-stone-900 hover:bg-stone-200/60">
              <ArrowLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          </Link>
          <span className="rounded-full border border-stone-300 bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Template preview
          </span>
        </div>
        <span className={`hidden font-serif text-sm italic text-stone-600 sm:block ${CORAL}`}>Wedding</span>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden text-stone-600"
          onClick={() => setShowMobileChat((v) => !v)}
          type="button"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      </header>

      {/* —— Hero —— */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        {heroBackdrop ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBackdrop})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/50 to-black/65" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-16 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-[0.35em] text-white/90 md:text-sm">
            We are getting married
          </p>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight drop-shadow-md md:text-6xl lg:text-7xl">
            {coupleParts ? (
              <>
                {coupleParts.first}{" "}
                <span className="text-[#e8b4a8]">&</span> {coupleParts.second}
              </>
            ) : (
              eventTitle
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-light text-white/95 md:text-xl">{eventDescription}</p>

          <div className="mx-auto mt-12 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { label: "Days", value: "85" },
              { label: "Hours", value: "13" },
              { label: "Mins", value: "15" },
              { label: "Secs", value: "13" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/25 bg-white/10 px-3 py-4 shadow-lg backdrop-blur-sm md:px-4 md:py-5"
              >
                <p className="font-serif text-2xl font-semibold tabular-nums text-white md:text-3xl">{item.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/75">{item.label}</p>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={scrollToStream}
            className="mt-14 rounded-full border-0 bg-white px-10 py-6 text-base font-semibold text-stone-900 shadow-xl hover:bg-white/95"
          >
            Watch livestream
          </Button>
        </div>
        <button
          type="button"
          onClick={scrollToStream}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 animate-bounce text-white/80"
          aria-label="Scroll to live stream"
        >
          <ChevronDown className="h-8 w-8" />
        </button>
      </section>

      {/* —— Join us live —— */}
      <section id="preview-wedding-stream" className="scroll-mt-16 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className={`text-center font-serif text-sm font-semibold uppercase tracking-[0.2em] ${CORAL}`}>
            Virtual attendance
          </p>
          <h2 className="mt-2 text-center font-serif text-3xl font-bold text-stone-900 md:text-5xl">
            Join Us <span className="text-[#c17a5c]">Live</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-stone-600">
            Experience the ceremony from anywhere—stream, chat, and celebrate with us.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
            <div className="space-y-6 lg:col-span-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-900 shadow-xl">
                <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    <Radio className="h-3 w-3" />
                    LIVE
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 text-xs text-white backdrop-blur-sm">
                    <Eye className="h-3 w-3" />
                    {viewerCount.toLocaleString()}
                  </span>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                    <Play className="h-10 w-10 text-white/90" fill="currentColor" />
                  </div>
                  <p className="mt-4 font-serif text-lg text-white/80">Stream will appear here</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between text-white">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/15" type="button">
                      <Volume2 className="h-5 w-5" />
                    </Button>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/15" type="button">
                        <Settings className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/15" type="button">
                        <Maximize2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-lg md:p-8">
                <h3 className="font-serif text-2xl font-bold text-stone-900">{eventTitle}&apos;s Wedding Ceremony</h3>
                <p className="mt-2 text-stone-600">Friday, October 11th · 10:00 AM EDT</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Livestream", "Ceremony", "Reception", "RSVP"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#d4a27c]/40 bg-[#faf6f0] px-3 py-1 text-xs font-medium text-stone-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div
              className={`flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xl lg:min-h-[480px] ${
                showMobileChat ? "fixed inset-0 z-[60] lg:relative lg:inset-auto" : "hidden lg:flex"
              }`}
            >
              <div className="flex items-center justify-between border-b border-stone-100 bg-[#faf6f0] px-4 py-3">
                <h3 className="font-serif text-lg font-semibold text-stone-800">Live Chat</h3>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs text-stone-600 shadow-sm">
                    <Eye className="h-3 w-3" />
                    {viewerCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={() => setShowMobileChat(false)}
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {mockChatMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${msg.color}`}
                      >
                        {msg.user.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-stone-100 bg-stone-50/80 px-3 py-2">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold text-stone-800">{msg.user}</span>
                          <span className="text-xs text-stone-400">{msg.time}</span>
                        </div>
                        <p className="mt-1 text-sm text-stone-600">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t border-stone-100 bg-white p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Say something..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="rounded-full border-stone-200 bg-stone-50"
                  />
                  <Button type="button" size="icon" className={`shrink-0 rounded-full ${CORAL_BG} text-white hover:opacity-90`}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* —— Our love story —— */}
      <section className="border-t border-stone-200/60 bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className={`text-center font-serif text-3xl font-bold md:text-4xl ${CORAL}`}>Our Love Story</h2>
          <div className="mt-14 space-y-16 md:space-y-24">
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div className="relative order-2 md:order-1">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                  <img src={loveStoryImages.met} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -right-2 -top-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-sm font-bold text-stone-900 shadow-lg md:-right-4 md:-top-4">
                  2020
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h3 className="font-serif text-2xl font-bold text-stone-900">How We Met</h3>
                <p className="mt-4 leading-relaxed text-stone-600">
                  A chance meeting turned into coffee dates, road trips, and a shared love of Sunday markets. This preview
                  text shows how your story can appear beside a photo on the watch experience.
                </p>
              </div>
            </div>
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-900">The Proposal</h3>
                <p className="mt-4 leading-relaxed text-stone-600">
                  Under a sky full of stars, surrounded by family—everything led to this day. Your guests can read your
                  chapters here while they wait for the live stream.
                </p>
              </div>
              <div className="relative">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-lg">
                  <img src={loveStoryImages.proposal} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="absolute -left-2 -top-2 flex h-16 w-16 items-center justify-center rounded-full bg-rose-300 text-sm font-bold text-stone-900 shadow-lg md:-left-4 md:-top-4">
                  2024
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* —— Timeline —— */}
      <section className={`${CREAM} px-4 py-16 md:py-24`}>
        <div className="mx-auto max-w-3xl">
          <h2 className={`text-center font-serif text-3xl font-bold md:text-4xl ${CORAL}`}>Wedding Day Timeline</h2>
          {/* Mobile: simple stack */}
          <ul className="relative mt-12 space-y-4 md:hidden">
            {TIMELINE.map((item) => (
              <li key={item.title} className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-md">
                <p className={`text-sm font-semibold ${CORAL}`}>{item.time}</p>
                <p className="mt-1 font-serif text-lg font-bold text-stone-900">{item.title}</p>
              </li>
            ))}
          </ul>
          {/* Desktop: alternating timeline */}
          <div className="relative mt-16 hidden md:block">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-amber-600/40 via-amber-600 to-amber-600/40" />
            <ul className="relative space-y-10">
              {TIMELINE.map((item) => (
                <li
                  key={item.title}
                  className={`relative flex items-center ${item.side === "left" ? "justify-end pr-[53%]" : "justify-start pl-[53%]"}`}
                >
                  <div
                    className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-600 bg-[#faf6f0] shadow"
                    aria-hidden
                  />
                  <div className="max-w-sm rounded-2xl border border-stone-200/80 bg-white p-5 shadow-md">
                    <p className={`text-sm font-semibold ${CORAL}`}>{item.time}</p>
                    <p className="mt-1 font-serif text-lg font-bold text-stone-900">{item.title}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* —— RSVP —— */}
      <section className="border-t border-stone-200/60 bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-lg">
          <h2 className={`text-center font-serif text-3xl font-bold ${CORAL}`}>RSVP</h2>
          <p className="mt-2 text-center text-sm text-stone-500">Preview only — not connected to a live form.</p>
          <div className="mt-10 rounded-2xl border border-stone-200/80 bg-[#faf6f0] p-6 shadow-inner md:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">First name</label>
                <Input className="mt-1 border-stone-200 bg-white" placeholder="Jane" disabled />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Last name</label>
                <Input className="mt-1 border-stone-200 bg-white" placeholder="Doe" disabled />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Email</label>
              <Input className="mt-1 border-stone-200 bg-white" placeholder="you@example.com" type="email" disabled />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-stone-500">Will you attend?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Attending", "Regretfully decline", "Undecided"].map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="rounded-full border-stone-300 bg-white text-stone-700"
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Message</label>
              <Textarea
                className="mt-1 min-h-[100px] border-stone-200 bg-white"
                placeholder="Write a note for the couple..."
                disabled
              />
            </div>
            <Button type="button" disabled className={`mt-8 w-full rounded-sm py-6 text-sm font-bold uppercase tracking-widest ${CORAL_BG} text-white opacity-90`}>
              Submit
            </Button>
          </div>
        </div>
      </section>

      {/* —— Footer —— */}
      <footer className={`${CHARCOAL} px-4 py-12 text-center text-stone-400`}>
        <div className="mx-auto max-w-2xl">
          <p className="font-serif text-2xl font-light text-white">
            <span className="text-[#e8b4a8]">S</span>
            <span className="mx-1 text-stone-500">+</span>
            <span className="text-[#e8b4a8]">M</span>
          </p>
          <p className="mt-1 text-xs text-stone-500">Preview monogram — uses sample initials</p>
          <div className="mt-8 flex justify-center gap-6">
            <span className="text-stone-500 hover:text-white" title="Twitter">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </span>
            <Instagram className="h-5 w-5 text-stone-500 hover:text-white" aria-hidden />
          </div>
          <p className="mt-10 text-xs text-stone-600">© {new Date().getFullYear()} Template preview · Stream Livee</p>
        </div>
      </footer>
    </div>
  )
}
