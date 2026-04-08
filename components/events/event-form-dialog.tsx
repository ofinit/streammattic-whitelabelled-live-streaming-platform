"use client"

import type React from "react"
import type { Dispatch, SetStateAction } from "react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import useSWR from "swr"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Video,
  Youtube,
  Globe,
  Zap,
  Calendar,
  Lock,
  MessageSquare,
  Heart,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  List,
  Link,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Minus,
  ImageIcon,
  Upload,
  X,
  ShieldAlert,
} from "lucide-react"
import type {
  LiveEvent,
  StreamType,
  EventStatus,
  YouTubeChannel,
  FacebookPage,
  SimulcastConfig,
  SimulcastPricing,
  StreamTypePricing,
  TemplateData,
} from "@/lib/types"
import {
  inferValidityChoiceFromEvent,
  parseValidityExtensionsSetting,
  validityCreditsForDuration,
  type ParsedValidityExtensions,
} from "@/lib/validity-extensions"
import {
  eventFormSelectableTemplates,
  mockEventTemplates,
  mockYouTubeChannels,
  mockFacebookPages,
} from "@/lib/mock-data"
import { getCardGradientForCategory } from "@/lib/template-visuals"
import {
  getTemplateDefaultTitleRem,
  TITLE_SIZE_SLIDER_MAX,
  TITLE_SIZE_SLIDER_MIN,
  TITLE_SIZE_SLIDER_STEP,
} from "@/lib/event-title-typography"
import { EventTitleFontPicker } from "@/components/events/event-title-font-picker"
import { AiImagePickerDialog } from "@/components/media/ai-image-picker-dialog"
import { templateUsesCircularHeroCrop } from "@/lib/template-hero-crop"
import { Slider } from "@/components/ui/slider"
import { YouTubeChannelSelector } from "@/components/youtube/youtube-channel-selector"
import { SimulcastDestinations } from "@/components/simulcast/simulcast-destinations"
import {
  formStreamTypeToCanonical,
  canonicalStreamTypeToCreditsResponseKey,
  streamTypeLabelForCredits,
  creditBucketForPreview,
} from "@/lib/stream-type-form"
import { compressImageFileToWebp } from "@/lib/client-image-webp"
import { toast } from "@/hooks/use-toast"

const EVENT_TITLE_PLACEHOLDERS = [
  "Romeo weds Juliet",
  "Aarav's 1st Birthday Celebration",
  "Q4 Corporate Townhall 2026",
  "Ananya & Rohan Engagement Ceremony",
  "Silver Jubilee Anniversary Live",
]

const EVENT_DESCRIPTION_PLACEHOLDERS = [
  "Join us for a beautiful evening as Romeo and Juliet celebrate their wedding live with family and friends.",
  "Celebrate Aarav's birthday with cake cutting, games, and special moments streamed live.",
  "Quarterly corporate townhall covering company updates, roadmap highlights, and leadership Q&A.",
  "Watch the engagement ceremony live with blessings, music, and heartfelt messages.",
]

const EVENT_SUBTITLE_PLACEHOLDERS = [
  "We're Getting Married",
  "Join us in celebrating our love",
  "Save the date — live from anywhere",
  "You're invited to celebrate with us",
  "Tune in for our special day",
]

const DESCRIPTION_CANNED_MESSAGES = [
  {
    id: "welcome",
    title: "General Welcome",
    message: "Join us live for a special event filled with memorable moments and interactive experiences.",
  },
  {
    id: "birthday",
    title: "Birthday Celebration",
    message: "Celebrate this birthday with us live, including cake cutting, wishes, and fun family moments.",
  },
  {
    id: "corporate",
    title: "Corporate Session",
    message: "Live corporate session featuring leadership updates, key announcements, and a quick Q&A.",
  },
  {
    id: "wedding",
    title: "Wedding Ceremony",
    message: "Watch the wedding ceremony live as family and friends come together to celebrate this special day.",
  },
]

type DescriptionCannedMessage = {
  id: string
  title: string
  message: string
}

/** Short lines for sub-title `/` picker — separate from description canned messages */
const SUBTITLE_CANNED_MESSAGES: DescriptionCannedMessage[] = [
  {
    id: "sub-welcome",
    title: "Welcome line",
    message: "Join us live for something special",
  },
  {
    id: "sub-wedding",
    title: "Wedding",
    message: "We're getting married — tune in live",
  },
  {
    id: "sub-celebration",
    title: "Celebration",
    message: "Celebrate with us — streaming soon",
  },
  {
    id: "sub-corporate",
    title: "Corporate",
    message: "Live updates and Q&A — join us",
  },
]

/** DB / API may return jsonb as object or (rarely) as a JSON string; edit form must always replace state, not skip updates. */
function parseTemplateDataFromEvent(raw: unknown): TemplateData {
  if (raw == null || raw === "") return {}
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return { ...(parsed as TemplateData) }
      }
      return {}
    } catch {
      return {}
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as TemplateData) }
  }
  return {}
}

function parsePhotoGalleryUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const vals = Object.values(raw as Record<string, unknown>)
    if (vals.length > 0 && vals.every((v) => typeof v === "string")) {
      return (vals as string[]).filter((s) => s.trim().length > 0)
    }
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      }
    } catch {
      return []
    }
  }
  return []
}

type PhotographerContact = { name?: string; phone?: string; email?: string; website?: string }

function parsePhotographerContact(raw: unknown): PhotographerContact {
  if (raw == null || raw === "") return {}
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as PhotographerContact
      }
      return {}
    } catch {
      return {}
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as PhotographerContact
  }
  return {}
}

function TitleSizeSliderBlock({
  templateId,
  templateData,
  setTemplateData,
}: {
  templateId: string
  templateData: TemplateData
  setTemplateData: Dispatch<SetStateAction<TemplateData>>
}) {
  const titleDefaultRem = getTemplateDefaultTitleRem(templateId)
  const raw = templateData.titleFontSizeRem
  const hasCustom =
    raw !== undefined && raw !== null && String(raw).trim() !== "" && Number.isFinite(Number(raw))
  const sliderValue = hasCustom ? Number(raw) : titleDefaultRem

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">Title size (watch page)</Label>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {sliderValue.toFixed(2)}rem
          {!hasCustom ? " · template default" : ""}
        </span>
      </div>
      <Slider
        min={TITLE_SIZE_SLIDER_MIN}
        max={TITLE_SIZE_SLIDER_MAX}
        step={TITLE_SIZE_SLIDER_STEP}
        value={[sliderValue]}
        onValueChange={([v]) => {
          if (v === undefined) return
          setTemplateData((prev) => {
            const next = { ...prev }
            const def = getTemplateDefaultTitleRem(templateId)
            if (Math.abs(v - def) < 0.051) {
              delete next.titleFontSizeRem
            } else {
              next.titleFontSizeRem = Math.round(v * 1000) / 1000
            }
            return next
          })
        }}
      />
      <p className="text-[11px] text-muted-foreground">
        Each template has its own default size ({titleDefaultRem.toFixed(2)}rem). Match the thumb to that value to use the
        default.
      </p>
    </div>
  )
}

/** Watch-page validity applies to all stream types; we group types for UX copy and for resetting rules when switching ingest vs embed. */
type ValidityStreamGroup = "ingest" | "embed"

function streamValidityGroup(streamType: string): ValidityStreamGroup {
  const t = streamType || ""
  if (t === "youtube_api" || t === "youtube_embed" || t === "third_party") return "embed"
  return "ingest"
}

function streamTypeLabelForSettings(streamType: string): string {
  const t = streamType || ""
  if (!t || t === "rtmp") return "RTMP / OBS encoder"
  if (t === "youtube_api") return "YouTube API (ingest)"
  if (t === "youtube_embed") return "YouTube embed (URL)"
  if (t === "third_party") return "Third-party embed"
  if (t === "hls") return "HLS"
  return "Stream"
}

function eventValidityHelpForStreamGroup(group: ValidityStreamGroup, defaultDays: number): string {
  const d = defaultDays > 0 ? defaultDays : 30
  if (group === "ingest") {
    return `Studios and streamers use the same rules: creating an event with a stream type debits credits from your account. Each validity option shows the total credits for that duration (not “extra on top” unless labeled). The default is 1 credit for the first ${d} days; longer tiers come from your admin (Admin → Pricing → Event Validity Extensions). Adding separate calendar days under Event days debits one credit per extra day (same stream type).`
  }
  return `Studios and streamers use the same rules. Each validity option shows total credits for that length; separate calendar days in Event days add one credit each. Embed streams still use embed-type credits.`
}

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: LiveEvent | null
  onSave: (event: LiveEvent, keepOpen?: boolean) => void
  initialTab?: string
  initialStreamType?: StreamType
  initialDraft?: {
    title?: string
    slug?: string
    scheduledAt?: string
    timezone?: string
  }
  youtubeOwnerId?: string
  youtubeOwnerType?: "admin" | "studio" | "streamer"
  skipCreditsValidation?: boolean
  /** When set (e.g. admin editing a tenant event), fetch that user's credit balance via /api/credits?userId= */
  creditsUserId?: string
  /** When backend returns 409 (duplicate slug), parent sets this so we show inline error and switch to Details tab */
  externalSlugError?: string | null
  /** Studio's verified primary domain for URL preview */
  primaryDomain?: string | null
}

export function EventFormDialog({
  open,
  onOpenChange,
  event,
  onSave,
  initialTab,
  initialStreamType,
  initialDraft,
  youtubeOwnerId,
  youtubeOwnerType,
  skipCreditsValidation = false,
  creditsUserId,
  externalSlugError,
  primaryDomain,
}: EventFormDialogProps) {
  const isEditing = !!event

  // When parent reports 409 duplicate slug, show inline error and switch to Details tab
  useEffect(() => {
    if (externalSlugError) {
      setFieldErrors((prev) => ({ ...prev, slug: externalSlugError }))
      setActiveTab("details")
    }
  }, [externalSlugError])

  const [activeTab, setActiveTab] = useState(initialTab ?? "details")
  const [showCredentialsScreen, setShowCredentialsScreen] = useState(false)
  const [credentials, setCredentials] = useState<{
    rtmpUrl: string
    streamKey: string
    broadcastId?: string
    eventTitle?: string
  } | null>(null)
  const [copied, setCopied] = useState<"rtmp" | "key" | null>(null)
  const [showStreamKey, setShowStreamKey] = useState(false)

  // YouTube broadcast credentials (real FMS/stream key from youtube_broadcasts when editing)
  const [youtubeBroadcastCredentials, setYoutubeBroadcastCredentials] = useState<{
    rtmpUrl: string
    streamKey: string
  } | null>(null)
  const [youtubeCredentialsLoading, setYoutubeCredentialsLoading] = useState(false)
  const [isCreatingBroadcast, setIsCreatingBroadcast] = useState(false)
  const [broadcastCreateError, setBroadcastCreateError] = useState<string | null>(null)

  // YouTube state
  const [youtubeChannels, setYoutubeChannels] = useState<YouTubeChannel[]>(mockYouTubeChannels)
  const [selectedYouTubeChannel, setSelectedYouTubeChannel] = useState<string | null>(null)
  const [youtubeBroadcastSettings, setYoutubeBroadcastSettings] = useState({
    privacyStatus: "public" as "public" | "unlisted" | "private",
    enableDvr: true,
    enableAutoStart: true,
    enableAutoStop: true,
  })

  // Facebook state
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>(mockFacebookPages)

  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>({
    enabled: false,
    customDestinations: [],
  })

  const { data: creditPricingJson } = useSWR<{
    streamTypePricing?: StreamTypePricing
    simulcastPricing?: SimulcastPricing
  }>(
    open ? "/api/credits/pricing" : null,
    (url) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error("Failed to load pricing")
        return r.json()
      }),
  )
  const streamTypePricing = creditPricingJson?.streamTypePricing
  const simulcastPricingFromApi = creditPricingJson?.simulcastPricing

  const [timezone, setTimezone] = useState("Asia/Kolkata")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [typedPlaceholder, setTypedPlaceholder] = useState("")
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [descriptionPlaceholderIndex, setDescriptionPlaceholderIndex] = useState(0)
  const [typedDescriptionPlaceholder, setTypedDescriptionPlaceholder] = useState("")
  const typeDescriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotateDescriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [subtitlePlaceholderIndex, setSubtitlePlaceholderIndex] = useState(0)
  const [typedSubtitlePlaceholder, setTypedSubtitlePlaceholder] = useState("")
  const typeSubtitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotateSubtitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showSubtitleCommands, setShowSubtitleCommands] = useState(false)
  const [subtitleCommandQuery, setSubtitleCommandQuery] = useState("")
  const [selectedSubtitleCommandIndex, setSelectedSubtitleCommandIndex] = useState(0)
  const [showDescriptionCommands, setShowDescriptionCommands] = useState(false)
  const [descriptionCommandQuery, setDescriptionCommandQuery] = useState("")
  const [selectedDescriptionCommandIndex, setSelectedDescriptionCommandIndex] = useState(0)
  const [descriptionCannedMessages, setDescriptionCannedMessages] = useState<DescriptionCannedMessage[]>(
    DESCRIPTION_CANNED_MESSAGES
  )
  const [editingDescriptionMessageId, setEditingDescriptionMessageId] = useState<string | null>(null)
  const [pendingDeleteDescriptionMessageId, setPendingDeleteDescriptionMessageId] = useState<string | null>(null)
  const [isAddingDescriptionMessage, setIsAddingDescriptionMessage] = useState(false)
  const [descriptionDraftTitle, setDescriptionDraftTitle] = useState("")
  const [descriptionDraftMessage, setDescriptionDraftMessage] = useState("")

  const [subtitleCannedMessages, setSubtitleCannedMessages] = useState<DescriptionCannedMessage[]>(
    SUBTITLE_CANNED_MESSAGES,
  )
  const [editingSubtitleMessageId, setEditingSubtitleMessageId] = useState<string | null>(null)
  const [pendingDeleteSubtitleMessageId, setPendingDeleteSubtitleMessageId] = useState<string | null>(null)
  const [isAddingSubtitleMessage, setIsAddingSubtitleMessage] = useState(false)
  const [subtitleDraftTitle, setSubtitleDraftTitle] = useState("")
  const [subtitleDraftMessage, setSubtitleDraftMessage] = useState("")

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    description: "",
    streamType: "" as StreamType,
    youtubeUrl: "",
    embedCode: "",
    scheduledAt: "",
    isPasswordProtected: false,
    password: "",
    allowChat: true,
    allowReactions: true,
    templateId: "tpl-default",
    rtmpUrl: "",
    streamKey: "",
    showScheduledPage: false,
    useCustomDomain: true,
  })

  // Slug state
  const [slug, setSlug] = useState("")
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle")
  const [slugError, setSlugError] = useState("")
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const crewPathSegment =
    slug.trim() ||
    (event && typeof (event as any).slug === "string" ? (event as any).slug.trim() : "") ||
    (event && typeof event.id === "string" ? String(event.id).trim() : "") ||
    ""
  const [crewPageOrigin, setCrewPageOrigin] = useState("")
  useEffect(() => {
    setCrewPageOrigin(window.location.origin)
  }, [])
  const crewPageUrl =
    crewPageOrigin && crewPathSegment
      ? `${crewPageOrigin}/${encodeURIComponent(crewPathSegment)}/crew`
      : ""

  // Field-level errors for mandatory fields
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; slug?: string; scheduledAt?: string }>({})

  // Multi-date state
  type ExtraDate = { id: string; label: string; scheduledAt: string; timezone?: string }
  const [additionalDates, setAdditionalDates] = useState<ExtraDate[]>([])
  const [creditStatus, setCreditStatus] = useState<"idle" | "checking" | "ok" | "insufficient">("idle")
  const [creditInfo, setCreditInfo] = useState<{ need: number; have: number } | null>(null)
  const creditCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Helper: convert local wall-clock + timezone to UTC ISO
  const localToUtc = (localDt: string, tz: string): string => {
    const [datePart, timePart] = localDt.split("T")
    const [y, mo, d] = datePart.split("-").map(Number)
    const [h, mi] = (timePart || "00:00").split(":").map(Number)
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    })
    const candidate = new Date(Date.UTC(y, mo - 1, d, h, mi, 0))
    const parts = fmt.formatToParts(candidate)
    const p = Object.fromEntries(parts.filter(x => x.type !== "literal").map(x => [x.type, x.value]))
    const tzHour = Number(p.hour === "24" ? 0 : p.hour)
    const diffMin = (h - tzHour) * 60 + (mi - Number(p.minute)) + (d - Number(p.day)) * 24 * 60
    candidate.setUTCMinutes(candidate.getUTCMinutes() + diffMin)
    return candidate.toISOString()
  }

  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

  function toSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80)
  }

  const checkSlug = useCallback(async (value: string, excludeId?: string) => {
    if (!value) { setSlugStatus("idle"); setSlugError(""); return }
    if (value.length < 3) { setSlugStatus("invalid"); setSlugError("At least 3 characters required"); return }
    if (value.length > 80) { setSlugStatus("invalid"); setSlugError("Maximum 80 characters"); return }
    if (!SLUG_REGEX.test(value)) {
      setSlugStatus("invalid")
      setSlugError("Only lowercase letters, numbers, hyphens. No leading/trailing hyphens.")
      return
    }
    setSlugStatus("checking")
    setSlugError("")
    try {
      const params = new URLSearchParams({ slug: value })
      if (excludeId) params.set("excludeId", excludeId)
      const res = await fetch(`/api/studio/events/check-slug?${params}`)
      const data = await res.json()
      if (data.error && !data.available) {
        setSlugStatus("invalid")
        setSlugError(data.error)
      } else {
        setSlugStatus(data.available ? "available" : "taken")
        setSlugError(data.available ? "" : "This URL is already taken")
      }
    } catch {
      setSlugStatus("idle")
    }
  }, [])

  // Auto-generate slug from title (only when not manually touched)
  useEffect(() => {
    if (slugTouched) return
    const generated = toSlug(formData.title || "")
    setSlug(generated)
    if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
    if (generated) {
      slugDebounceRef.current = setTimeout(() => checkSlug(generated, event?.id), 500)
    } else {
      setSlugStatus("idle")
      setSlugError("")
    }
  }, [formData.title, slugTouched, checkSlug, event?.id])

  // Animated Event Title placeholders (pauses while user is typing)
  useEffect(() => {
    if (typeTimerRef.current) {
      clearTimeout(typeTimerRef.current)
      typeTimerRef.current = null
    }
    if (rotateTimerRef.current) {
      clearTimeout(rotateTimerRef.current)
      rotateTimerRef.current = null
    }

    if (formData.title.trim()) {
      setTypedPlaceholder("")
      return
    }

    const text = EVENT_TITLE_PLACEHOLDERS[placeholderIndex] || EVENT_TITLE_PLACEHOLDERS[0]
    let cancelled = false
    let charIndex = 0

    const typeNext = () => {
      if (cancelled) return
      charIndex += 1
      setTypedPlaceholder(text.slice(0, charIndex))

      if (charIndex < text.length) {
        typeTimerRef.current = setTimeout(typeNext, 70)
        return
      }

      rotateTimerRef.current = setTimeout(() => {
        if (cancelled) return
        setPlaceholderIndex((prev) => (prev + 1) % EVENT_TITLE_PLACEHOLDERS.length)
      }, 1200)
    }

    setTypedPlaceholder("")
    typeTimerRef.current = setTimeout(typeNext, 120)

    return () => {
      cancelled = true
      if (typeTimerRef.current) {
        clearTimeout(typeTimerRef.current)
        typeTimerRef.current = null
      }
      if (rotateTimerRef.current) {
        clearTimeout(rotateTimerRef.current)
        rotateTimerRef.current = null
      }
    }
  }, [formData.title, placeholderIndex])

  // Animated Event Description placeholders (pauses while user is typing)
  useEffect(() => {
    if (typeDescriptionTimerRef.current) {
      clearTimeout(typeDescriptionTimerRef.current)
      typeDescriptionTimerRef.current = null
    }
    if (rotateDescriptionTimerRef.current) {
      clearTimeout(rotateDescriptionTimerRef.current)
      rotateDescriptionTimerRef.current = null
    }

    if (formData.description.trim()) {
      setTypedDescriptionPlaceholder("")
      return
    }

    const text = EVENT_DESCRIPTION_PLACEHOLDERS[descriptionPlaceholderIndex] || EVENT_DESCRIPTION_PLACEHOLDERS[0]
    let cancelled = false
    let charIndex = 0

    const typeNext = () => {
      if (cancelled) return
      charIndex += 1
      setTypedDescriptionPlaceholder(text.slice(0, charIndex))

      if (charIndex < text.length) {
        typeDescriptionTimerRef.current = setTimeout(typeNext, 24)
        return
      }

      rotateDescriptionTimerRef.current = setTimeout(() => {
        if (cancelled) return
        setDescriptionPlaceholderIndex((prev) => (prev + 1) % EVENT_DESCRIPTION_PLACEHOLDERS.length)
      }, 1200)
    }

    setTypedDescriptionPlaceholder("")
    typeDescriptionTimerRef.current = setTimeout(typeNext, 120)

    return () => {
      cancelled = true
      if (typeDescriptionTimerRef.current) {
        clearTimeout(typeDescriptionTimerRef.current)
        typeDescriptionTimerRef.current = null
      }
      if (rotateDescriptionTimerRef.current) {
        clearTimeout(rotateDescriptionTimerRef.current)
        rotateDescriptionTimerRef.current = null
      }
    }
  }, [formData.description, descriptionPlaceholderIndex])

  // Animated Sub-title placeholders (single-line, same rhythm as title)
  useEffect(() => {
    if (typeSubtitleTimerRef.current) {
      clearTimeout(typeSubtitleTimerRef.current)
      typeSubtitleTimerRef.current = null
    }
    if (rotateSubtitleTimerRef.current) {
      clearTimeout(rotateSubtitleTimerRef.current)
      rotateSubtitleTimerRef.current = null
    }

    if (formData.subtitle.trim()) {
      setTypedSubtitlePlaceholder("")
      return
    }

    const text =
      EVENT_SUBTITLE_PLACEHOLDERS[subtitlePlaceholderIndex] || EVENT_SUBTITLE_PLACEHOLDERS[0]
    let cancelled = false
    let charIndex = 0

    const typeNext = () => {
      if (cancelled) return
      charIndex += 1
      setTypedSubtitlePlaceholder(text.slice(0, charIndex))

      if (charIndex < text.length) {
        typeSubtitleTimerRef.current = setTimeout(typeNext, 55)
        return
      }

      rotateSubtitleTimerRef.current = setTimeout(() => {
        if (cancelled) return
        setSubtitlePlaceholderIndex((prev) => (prev + 1) % EVENT_SUBTITLE_PLACEHOLDERS.length)
      }, 1200)
    }

    setTypedSubtitlePlaceholder("")
    typeSubtitleTimerRef.current = setTimeout(typeNext, 120)

    return () => {
      cancelled = true
      if (typeSubtitleTimerRef.current) {
        clearTimeout(typeSubtitleTimerRef.current)
        typeSubtitleTimerRef.current = null
      }
      if (rotateSubtitleTimerRef.current) {
        clearTimeout(rotateSubtitleTimerRef.current)
        rotateSubtitleTimerRef.current = null
      }
    }
  }, [formData.subtitle, subtitlePlaceholderIndex])

  const [templateData, setTemplateData] = useState<TemplateData>({})
  const [templateFieldErrors, setTemplateFieldErrors] = useState<Record<string, string>>({})

  // Standard event media and options (all templates)
  const [heroImageUrl, setHeroImageUrl] = useState("")
  const [playerImageUrl, setPlayerImageUrl] = useState("")
  const [photoGalleryUrls, setPhotoGalleryUrls] = useState<string[]>([])
  const [photographerLogoUrl, setPhotographerLogoUrl] = useState("")
  const [photographerContact, setPhotographerContact] = useState<{ name?: string; phone?: string; email?: string; website?: string }>({})
  const [validityExtSettings, setValidityExtSettings] = useState<ParsedValidityExtensions>(() =>
    parseValidityExtensionsSetting(null),
  )
  /** `none` | `included` | `tier:${days}` | `until` — tiers/labels come from admin `validity_extensions`. */
  const [validityChoiceKey, setValidityChoiceKey] = useState("included")
  const [validityExpiresAt, setValidityExpiresAt] = useState("")
  const [crewPin, setCrewPin] = useState("")
  const [isCrewPinEnabled, setIsCrewPinEnabled] = useState(false)
  const [standardUploading, setStandardUploading] = useState<string | null>(null)
  /** Photo gallery: compress → WebP → upload; null when idle */
  const [galleryUploadProgress, setGalleryUploadProgress] = useState<{
    phase: "compress" | "upload"
    current: number
    total: number
  } | null>(null)

  // State for template category filter
  const [templateCategory, setTemplateCategory] = useState<string>("all")

  /** Picker list: selectable templates plus current event template if it is legacy/hidden */
  const templatesForPicker = useMemo(() => {
    const selectable = [...eventFormSelectableTemplates].sort((a, b) => a.sortOrder - b.sortOrder)
    const id = formData.templateId?.trim()
    if (!id) return selectable
    if (selectable.some((t) => t.id === id)) return selectable
    const legacy = mockEventTemplates.find((t) => t.id === id)
    if (!legacy) return selectable
    return [...selectable, legacy].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [formData.templateId])

  const heroUsesCircularCrop = templateUsesCircularHeroCrop(formData.templateId)

  const templateCategories = useMemo(() => {
    const categoryCount: Record<string, number> = {}
    templatesForPicker.forEach((template) => {
      const buckets = [template.category, ...(template.extraCategories ?? [])]
      const seen = new Set<string>()
      for (const c of buckets) {
        if (seen.has(c)) continue
        seen.add(c)
        categoryCount[c] = (categoryCount[c] || 0) + 1
      }
    })
    return Object.entries(categoryCount)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, count]) => ({ category, count }))
  }, [templatesForPicker])

  const filteredTemplates = useMemo(() => {
    if (templateCategory === "all") return templatesForPicker
    return templatesForPicker.filter(
      (template) =>
        template.category === templateCategory ||
        template.extraCategories?.includes(templateCategory),
    )
  }, [templateCategory, templatesForPicker])

  const filteredDescriptionCommands = useMemo(() => {
    const query = descriptionCommandQuery.trim().toLowerCase()
    if (!query) return descriptionCannedMessages
    return descriptionCannedMessages.filter((item) => {
      return item.title.toLowerCase().includes(query) || item.message.toLowerCase().includes(query)
    })
  }, [descriptionCommandQuery, descriptionCannedMessages])

  const filteredSubtitleCommands = useMemo(() => {
    const query = subtitleCommandQuery.trim().toLowerCase()
    if (!query) return subtitleCannedMessages
    return subtitleCannedMessages.filter((item) => {
      return item.title.toLowerCase().includes(query) || item.message.toLowerCase().includes(query)
    })
  }, [subtitleCommandQuery, subtitleCannedMessages])

  const getDescriptionSlashMatch = useCallback((value: string) => {
    return value.match(/(?:^|\n)\/([^\n]*)$/)
  }, [])

  /** Single-line sub-title: `/command` at start or after whitespace */
  const getSubtitleSlashMatch = useCallback((value: string) => {
    return value.match(/(?:^|\s)\/(.*)$/)
  }, [])

  const beginAddSubtitleMessage = useCallback(() => {
    setIsAddingSubtitleMessage(true)
    setEditingSubtitleMessageId(null)
    setPendingDeleteSubtitleMessageId(null)
    setSubtitleDraftTitle("")
    setSubtitleDraftMessage("")
  }, [])

  const beginEditSubtitleMessage = useCallback((item: DescriptionCannedMessage) => {
    setIsAddingSubtitleMessage(false)
    setEditingSubtitleMessageId(item.id)
    setPendingDeleteSubtitleMessageId(null)
    setSubtitleDraftTitle(item.title)
    setSubtitleDraftMessage(item.message)
  }, [])

  const resetSubtitleDraftEditor = useCallback(() => {
    setIsAddingSubtitleMessage(false)
    setEditingSubtitleMessageId(null)
    setPendingDeleteSubtitleMessageId(null)
    setSubtitleDraftTitle("")
    setSubtitleDraftMessage("")
  }, [])

  const saveSubtitleDraft = useCallback(() => {
    const nextTitle = subtitleDraftTitle.trim()
    const nextMessage = subtitleDraftMessage.trim()
    if (!nextTitle || !nextMessage) return

    if (isAddingSubtitleMessage) {
      const nextItem: DescriptionCannedMessage = {
        id: `sub-custom-${Date.now()}`,
        title: nextTitle,
        message: nextMessage,
      }
      setSubtitleCannedMessages((prev) => [nextItem, ...prev])
      resetSubtitleDraftEditor()
      return
    }

    if (editingSubtitleMessageId) {
      setSubtitleCannedMessages((prev) =>
        prev.map((item) =>
          item.id === editingSubtitleMessageId ? { ...item, title: nextTitle, message: nextMessage } : item,
        ),
      )
      resetSubtitleDraftEditor()
    }
  }, [
    subtitleDraftTitle,
    subtitleDraftMessage,
    isAddingSubtitleMessage,
    editingSubtitleMessageId,
    resetSubtitleDraftEditor,
  ])

  const deleteSubtitleMessage = useCallback(
    (id: string) => {
      setSubtitleCannedMessages((prev) => prev.filter((item) => item.id !== id))
      if (editingSubtitleMessageId === id) {
        resetSubtitleDraftEditor()
      }
      setPendingDeleteSubtitleMessageId(null)
      setSelectedSubtitleCommandIndex(0)
    },
    [editingSubtitleMessageId, resetSubtitleDraftEditor],
  )

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, description: value }))
    const slashMatch = getDescriptionSlashMatch(value)
    if (!slashMatch) {
      setShowDescriptionCommands(false)
      setDescriptionCommandQuery("")
      setSelectedDescriptionCommandIndex(0)
      return
    }
    setShowSubtitleCommands(false)
    resetSubtitleDraftEditor()
    setShowDescriptionCommands(true)
    setDescriptionCommandQuery((slashMatch[1] || "").trim())
    setSelectedDescriptionCommandIndex(0)
  }, [getDescriptionSlashMatch, resetSubtitleDraftEditor])

  const applyDescriptionCommand = useCallback((message: string) => {
    setFormData((prev) => {
      const nextDescription = prev.description.replace(/(?:^|\n)\/([^\n]*)$/, (match: string) => {
        const keepNewline = match.startsWith("\n")
        return `${keepNewline ? "\n" : ""}${message}`
      })
      return { ...prev, description: nextDescription }
    })
    setShowDescriptionCommands(false)
    setDescriptionCommandQuery("")
    setSelectedDescriptionCommandIndex(0)
  }, [])

  const handleSubtitleChange = useCallback(
    (value: string) => {
      const clipped = value.slice(0, 200)
      setFormData((prev) => ({ ...prev, subtitle: clipped }))
      const slashMatch = getSubtitleSlashMatch(clipped)
      if (!slashMatch) {
        setShowSubtitleCommands(false)
        setSubtitleCommandQuery("")
        setSelectedSubtitleCommandIndex(0)
        return
      }
      setShowDescriptionCommands(false)
      setIsAddingDescriptionMessage(false)
      setEditingDescriptionMessageId(null)
      setPendingDeleteDescriptionMessageId(null)
      setDescriptionDraftTitle("")
      setDescriptionDraftMessage("")
      setShowSubtitleCommands(true)
      setSubtitleCommandQuery((slashMatch[1] || "").trim())
      setSelectedSubtitleCommandIndex(0)
    },
    [getSubtitleSlashMatch],
  )

  const applySubtitleCommand = useCallback((message: string) => {
    const text = message.slice(0, 200)
    setFormData((prev) => {
      const next = prev.subtitle.replace(/(?:^|\s)\/(.*)$/, (full: string) =>
        full.startsWith(" ") ? ` ${text}` : text,
      )
      return { ...prev, subtitle: next.slice(0, 200) }
    })
    setShowSubtitleCommands(false)
    setSubtitleCommandQuery("")
    setSelectedSubtitleCommandIndex(0)
  }, [])

  const beginAddDescriptionMessage = useCallback(() => {
    setIsAddingDescriptionMessage(true)
    setEditingDescriptionMessageId(null)
    setPendingDeleteDescriptionMessageId(null)
    setDescriptionDraftTitle("")
    setDescriptionDraftMessage("")
  }, [])

  const beginEditDescriptionMessage = useCallback((item: DescriptionCannedMessage) => {
    setIsAddingDescriptionMessage(false)
    setEditingDescriptionMessageId(item.id)
    setPendingDeleteDescriptionMessageId(null)
    setDescriptionDraftTitle(item.title)
    setDescriptionDraftMessage(item.message)
  }, [])

  const resetDescriptionDraftEditor = useCallback(() => {
    setIsAddingDescriptionMessage(false)
    setEditingDescriptionMessageId(null)
    setPendingDeleteDescriptionMessageId(null)
    setDescriptionDraftTitle("")
    setDescriptionDraftMessage("")
  }, [])

  const saveDescriptionDraft = useCallback(() => {
    const nextTitle = descriptionDraftTitle.trim()
    const nextMessage = descriptionDraftMessage.trim()
    if (!nextTitle || !nextMessage) return

    if (isAddingDescriptionMessage) {
      const nextItem: DescriptionCannedMessage = {
        id: `custom-${Date.now()}`,
        title: nextTitle,
        message: nextMessage,
      }
      setDescriptionCannedMessages((prev) => [nextItem, ...prev])
      resetDescriptionDraftEditor()
      return
    }

    if (editingDescriptionMessageId) {
      setDescriptionCannedMessages((prev) =>
        prev.map((item) =>
          item.id === editingDescriptionMessageId
            ? { ...item, title: nextTitle, message: nextMessage }
            : item
        )
      )
      resetDescriptionDraftEditor()
    }
  }, [
    descriptionDraftTitle,
    descriptionDraftMessage,
    isAddingDescriptionMessage,
    editingDescriptionMessageId,
    resetDescriptionDraftEditor,
  ])

  const deleteDescriptionMessage = useCallback((id: string) => {
    setDescriptionCannedMessages((prev) => prev.filter((item) => item.id !== id))
    if (editingDescriptionMessageId === id) {
      resetDescriptionDraftEditor()
    }
    setPendingDeleteDescriptionMessageId(null)
    setSelectedDescriptionCommandIndex(0)
  }, [editingDescriptionMessageId, resetDescriptionDraftEditor])

  /**
   * Which dialog session we last hydrated from. Parent often passes a new `event` object reference
   * on SWR/mutate while the dialog stays open; re-running the full reset was clearing
   * `photoGalleryUrls` (and other fields) after multi-file uploads, before Save.
   */
  const formHydratedKeyRef = useRef<string | null>(null)
  /** Keeps validity reset logic in sync with hydrate so we don’t clear DB-loaded validity on open. */
  const prevValidityStreamGroupRef = useRef<ValidityStreamGroup | null>(null)
  const lastValidityInferenceFingerprintRef = useRef<string>("")

  // Reset form when dialog opens with new event or fresh (not on every `event` reference change)
  useEffect(() => {
    if (!open) {
      formHydratedKeyRef.current = null
      prevValidityStreamGroupRef.current = null
      return
    }
    if (showCredentialsScreen) return

    const hydrateKey =
      event != null && event.id != null && String(event.id).trim() !== "" ? String(event.id) : "__create__"
    if (formHydratedKeyRef.current === hydrateKey) return
    formHydratedKeyRef.current = hydrateKey

    if (event) {
        setFormData({
          title: event.title,
          subtitle: event.subtitle || "",
          description: event.description || "",
          streamType: (event.streamType === "rtmp" ? "" : event.streamType) as StreamType,
          youtubeUrl: event.youtubeUrl || "",
          embedCode: event.embedCode || "",
          scheduledAt: event.scheduledAt ? String(event.scheduledAt).slice(0, 16) : "",
          isPasswordProtected: event.isPasswordProtected,
          password: event.password || "",
          allowChat: event.allowChat,
          allowReactions: event.allowReactions,
          showScheduledPage: (event as any).show_scheduled_page === true || (event as any).showScheduledPage === true,
          templateId: ((event as any).templateId ?? (event as any).template_id ?? (event as any).templateData?.templateId) || "tpl-default",
          rtmpUrl: event.rtmpUrl || "",
          streamKey: event.streamKey || "",
          useCustomDomain: (event as any).use_custom_domain === true || (event as any).useCustomDomain === true,
        })
        if (event.simulcastConfig) {
          setSimulcastConfig(event.simulcastConfig)
        }
        setTemplateData(parseTemplateDataFromEvent((event as any).templateData))
        const ev = event as any
        setHeroImageUrl((ev.heroImageUrl as string) || "")
        setPlayerImageUrl((ev.playerImageUrl as string) || "")
        setPhotoGalleryUrls(parsePhotoGalleryUrls(ev.photoGalleryUrls))
        setPhotographerLogoUrl((ev.photographerLogoUrl as string) || "")
        setPhotographerContact(parsePhotographerContact(ev.photographerContact))
        setCrewPin("") // never load PIN
        setIsCrewPinEnabled(!!(ev.hasCrewPin ?? ev.crew_pin_hash))
        // Pre-fill slug when editing
        const existingSlug = ((event as any).slug as string) || ""
        setSlug(existingSlug)
        setSlugTouched(!!existingSlug)
        setSlugStatus(existingSlug ? "available" : "idle")
        setSlugError("")
        // Clear so we refetch real YouTube API credentials from youtube_broadcasts
        setYoutubeBroadcastCredentials(null)
        setIsCreatingBroadcast(false)
        setBroadcastCreateError(null)
      } else {
        setFormData({
          title: "",
          subtitle: "",
          description: "",
          streamType: (initialStreamType || "") as StreamType,
          youtubeUrl: "",
          embedCode: "",
          scheduledAt: "",
          isPasswordProtected: false,
          password: "",
          allowChat: true,
          allowReactions: true,
          templateId: "tpl-default",
          rtmpUrl: "",
          streamKey: "",
          showScheduledPage: false,
          useCustomDomain: youtubeOwnerType === "studio", // Default to true if in studio mode
        })
        setHeroImageUrl("")
        setPlayerImageUrl("")
        setPhotoGalleryUrls([])
        setPhotographerLogoUrl("")
        setPhotographerContact({})
        setValidityChoiceKey("included")
        setValidityExpiresAt("")
        setCrewPin("")
        setIsCrewPinEnabled(false)
        setTemplateData({})
        setTemplateFieldErrors({})
        if (initialDraft) {
          setFormData((prev) => ({
            ...prev,
            title: initialDraft.title ?? prev.title,
            scheduledAt: initialDraft.scheduledAt ?? prev.scheduledAt,
          }))
          if (initialDraft.timezone) {
            setTimezone(initialDraft.timezone)
          } else {
            setTimezone("Asia/Kolkata")
          }
          if (initialDraft.slug) {
            setSlug(initialDraft.slug)
            setSlugTouched(true)
            setSlugStatus("available")
            setSlugError("")
          } else {
            setSlug("")
            setSlugTouched(false)
            setSlugStatus("idle")
            setSlugError("")
          }
        } else {
          setSimulcastConfig({ enabled: false, customDestinations: [] })
          setTimezone("Asia/Kolkata")
          setSlug("")
          setSlugTouched(false)
          setSlugStatus("idle")
          setSlugError("")
          setFormData((prev) => ({ ...prev, useCustomDomain: true }))
        }
      }
      setAdditionalDates([])
      setCreditStatus("idle")
      setCreditInfo(null)
      setActiveTab(initialTab ?? "details")

      const hydratedStreamTypeForRef = event
        ? String((event.streamType === "rtmp" ? "" : event.streamType) ?? "")
        : String((initialStreamType ?? "") ?? "")
      prevValidityStreamGroupRef.current = streamValidityGroup(hydratedStreamTypeForRef)
  }, [open, event, showCredentialsScreen, initialStreamType])

  // When stream type crosses ingest ↔ embed, reset validity (rules differ; avoids stale dates)
  useEffect(() => {
    if (!open) {
      prevValidityStreamGroupRef.current = null
      return
    }
    const group = streamValidityGroup(formData.streamType)
    const prev = prevValidityStreamGroupRef.current
    if (prev === null) {
      prevValidityStreamGroupRef.current = group
      return
    }
    if (prev !== group) {
      setValidityChoiceKey("included")
      setValidityExpiresAt("")
      prevValidityStreamGroupRef.current = group
    }
  }, [open, formData.streamType])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/settings?key=validity_extensions")
        if (!res.ok) return
        const data = (await res.json()) as { setting?: { value?: unknown } }
        if (cancelled || !data?.setting) return
        setValidityExtSettings(parseValidityExtensionsSetting(data.setting.value))
      } catch {
        /* keep parseValidityExtensionsSetting(null) fallback */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open])

  const editEventSchedKey = useMemo(() => {
    if (!event?.scheduledAt) return ""
    const s = event.scheduledAt
    return typeof s === "string" ? s : (s as Date).toISOString()
  }, [event?.scheduledAt])

  const editEventExpKey = useMemo(() => {
    if (!event) return ""
    const v = (event as unknown as Record<string, unknown>).validityExpiresAt
    return v != null ? String(v) : ""
  }, [event])

  useEffect(() => {
    if (!open) {
      lastValidityInferenceFingerprintRef.current = ""
      return
    }
    if (!event?.id) return

    const tierFp = validityExtSettings.extendedTiers.map((t) => `${t.days}:${t.enabled ? 1 : 0}`).join(",")
    const fp = `${String(event.id)}|${editEventSchedKey}|${editEventExpKey}|${validityExtSettings.defaultDays}|${tierFp}`
    if (lastValidityInferenceFingerprintRef.current === fp) return
    lastValidityInferenceFingerprintRef.current = fp

    const inferred = inferValidityChoiceFromEvent(
      {
        scheduledAt: event.scheduledAt,
        validityExpiresAt: (event as unknown as Record<string, unknown>).validityExpiresAt,
      },
      validityExtSettings,
    )
    setValidityChoiceKey(inferred.choiceKey)
    setValidityExpiresAt(inferred.expiresAt)
  }, [open, event, event?.id, editEventSchedKey, editEventExpKey, validityExtSettings])

  const validityStreamGroup = useMemo(() => streamValidityGroup(formData.streamType), [formData.streamType])
  const validityStreamTypeLabel = useMemo(() => streamTypeLabelForSettings(formData.streamType), [formData.streamType])
  const creditPreviewBucket = useMemo(
    () => creditBucketForPreview(formData.streamType),
    [formData.streamType],
  )
  const creditPreviewBucketLabel = useMemo(() => streamTypeLabelForCredits(creditPreviewBucket), [creditPreviewBucket])
  const eventValidityHelpText = useMemo(
    () => eventValidityHelpForStreamGroup(validityStreamGroup, validityExtSettings.defaultDays),
    [validityStreamGroup, validityExtSettings.defaultDays],
  )

  useEffect(() => {
    if (!isEditing) {
      setTemplateData({})
      setTemplateFieldErrors({})
    }
  }, [formData.templateId, isEditing])

  // Reset credentials screen when dialog closes
  useEffect(() => {
    if (!open) {
      setShowCredentialsScreen(false)
      setCredentials(null)
    }
  }, [open])

  // Fetch real YouTube API FMS/stream key from youtube_broadcasts when editing a YouTube API event
  useEffect(() => {
    if (!open || !event?.id || formData.streamType !== "youtube_api") {
      return
    }
    const eventId = String((event as unknown as Record<string, unknown>).id ?? event.id)
    setYoutubeCredentialsLoading(true)
    fetch("/api/stream/youtube", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", eventId }),
    })
      .then((res) => res.json())
      .then((data) => {
        const b = data.broadcast
        if (b?.rtmpUrl && b?.streamKey) {
          setYoutubeBroadcastCredentials({ rtmpUrl: b.rtmpUrl, streamKey: b.streamKey })
        } else {
          setYoutubeBroadcastCredentials(null)
        }
      })
      .catch(() => setYoutubeBroadcastCredentials(null))
      .finally(() => setYoutubeCredentialsLoading(false))
  }, [open, event?.id, formData.streamType])

  // Create YouTube broadcast from within the edit dialog (for events with no broadcast yet)
  const handleCreateBroadcast = async () => {
    if (!event?.id || !selectedYouTubeChannel) return
    setIsCreatingBroadcast(true)
    setBroadcastCreateError(null)
    try {
      const res = await fetch("/api/stream/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          channelDbId: selectedYouTubeChannel,
          eventId: String((event as unknown as Record<string, unknown>).id ?? event.id),
          title: event.title,
          description: event.description || "",
          scheduledStartTime: event.scheduledAt,
          privacyStatus: youtubeBroadcastSettings.privacyStatus,
          enableDvr: youtubeBroadcastSettings.enableDvr,
          enableAutoStart: youtubeBroadcastSettings.enableAutoStart,
          enableAutoStop: youtubeBroadcastSettings.enableAutoStop,
        }),
      })
      const data = await res.json()
      if (res.ok && data.broadcast?.rtmpUrl) {
        setYoutubeBroadcastCredentials({ rtmpUrl: data.broadcast.rtmpUrl, streamKey: data.broadcast.streamKey })
      } else {
        const detail = data.details ? `: ${data.details}` : ""
        setBroadcastCreateError((data.error || "Failed to create broadcast") + detail)
      }
    } catch {
      setBroadcastCreateError("Network error. Please try again.")
    } finally {
      setIsCreatingBroadcast(false)
    }
  }

  const hasCredentials = formData.rtmpUrl && formData.streamKey
  const showRtmpCredentials = hasCredentials

  const copyToClipboard = (text: string, type: "rtmp" | "key") => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  // Credit check effect: fires when additionalDates or primary date changes
  useEffect(() => {
    // When skipping credits validation (e.g. admin-created events), bypass checks entirely.
    if (skipCreditsValidation) {
      setCreditStatus("idle")
      setCreditInfo(null)
      return
    }

    const primaryDatePart = formData.scheduledAt ? formData.scheduledAt.slice(0, 10) : ""
    const uniqueExtraDates = additionalDates.filter(
      (d) => d.scheduledAt && d.scheduledAt.slice(0, 10) !== primaryDatePart,
    )

    let validityDaysChosen = validityExtSettings.defaultDays
    if (validityChoiceKey === "included") {
      validityDaysChosen = validityExtSettings.defaultDays
    } else if (validityChoiceKey.startsWith("tier:")) {
      const n = Number(validityChoiceKey.split(":")[1])
      validityDaysChosen =
        Number.isFinite(n) && n > 0 ? n : validityExtSettings.defaultDays
    } else if (validityChoiceKey === "until" && formData.scheduledAt && validityExpiresAt) {
      const startMs = new Date(formData.scheduledAt).getTime()
      const expMs = new Date(validityExpiresAt).getTime()
      if (!Number.isNaN(startMs) && !Number.isNaN(expMs)) {
        const d = Math.round((expMs - startMs) / 86_400_000)
        validityDaysChosen = Math.max(1, d)
      }
    }

    const validityCreditTotal = validityCreditsForDuration(
      validityDaysChosen,
      validityExtSettings.defaultDays,
    )
    const need = validityCreditTotal + uniqueExtraDates.length

    if (need === 0) {
      setCreditStatus("idle")
      setCreditInfo(null)
      return
    }

    setCreditStatus("checking")
    if (creditCheckRef.current) clearTimeout(creditCheckRef.current)
    creditCheckRef.current = setTimeout(async () => {
      try {
        const creditsUrl =
          creditsUserId && creditsUserId.trim() !== ""
            ? `/api/credits?userId=${encodeURIComponent(creditsUserId)}`
            : "/api/credits"
        const res = await fetch(creditsUrl)
        if (!res.ok) throw new Error("Failed to fetch credits")
        const data = await res.json()
        const credits = data.credits || data
        const canonical = creditBucketForPreview(formData.streamType)
        const creditCol = canonicalStreamTypeToCreditsResponseKey(canonical)
        const have = credits[creditCol] ?? 0
        setCreditInfo({ need, have })
        setCreditStatus(have >= need ? "ok" : "insufficient")
      } catch {
        setCreditStatus("idle")
      }
    }, 400)
  }, [
    additionalDates,
    formData.scheduledAt,
    formData.streamType,
    skipCreditsValidation,
    validityChoiceKey,
    validityExpiresAt,
    validityExtSettings,
    creditsUserId,
  ])

  const creditsPreventSubmit =
    !skipCreditsValidation && (creditStatus === "insufficient" || creditStatus === "checking")

  // Clear stream type if admin disabled it after this dialog was built with stale pricing
  useEffect(() => {
    if (!open || !streamTypePricing || !formData.streamType) return
    const canon = formStreamTypeToCanonical(formData.streamType)
    if (!canon) return
    const cfg = streamTypePricing[canon]
    if (cfg?.enabled === false) {
      setFormData((prev) => ({ ...prev, streamType: "" as StreamType }))
      setSimulcastConfig({ enabled: false, customDestinations: [] })
    }
  }, [open, streamTypePricing, formData.streamType])

  const generateCredentials = () => {
    const streamKey = `live_${Math.random().toString(36).substring(2, 15)}`
    const rtmpUrl = "rtmp://stream.streamlivee.com/live"
    return { rtmpUrl, streamKey }
  }

  const postEventUpload = async (
    subdir: "event-hero" | "event-player" | "event-gallery" | "event-photographer",
    file: File,
  ): Promise<string> => {
    const form = new FormData()
    form.append("file", file)
    form.append("subdir", subdir)
    const res = await fetch("/api/upload", { method: "POST", body: form })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || "Upload failed")
    return data.url as string
  }

  /**
   * Gallery uploads: prefer one batch POST; single file uses `file` field (same as hero/player — most reliable).
   * If batch fails (e.g. multipart quirks), fall back to sequential single uploads.
   */
  const postGalleryFilesBatch = async (filesToUpload: File[]): Promise<{ urls: string[]; partialErrors?: string[] }> => {
    if (filesToUpload.length === 0) return { urls: [] }
    if (filesToUpload.length === 1) {
      const url = await postEventUpload("event-gallery", filesToUpload[0]!)
      return { urls: [url] }
    }

    const parseUploadJson = async (res: Response): Promise<{ urls?: string[]; error?: string; partialErrors?: string[] }> => {
      try {
        return (await res.json())
      } catch {
        return { error: `Invalid response (${res.status})` }
      }
    }

    const form = new FormData()
    filesToUpload.forEach((f) => form.append("files", f))
    form.append("subdir", "event-gallery")
    const res = await fetch("/api/upload", { method: "POST", body: form })
    const data = await parseUploadJson(res)
    if (res.ok) {
      const urls = "urls" in data && Array.isArray(data.urls)
        ? data.urls.filter((u): u is string => typeof u === "string" && u.length > 0)
        : []
      if (urls.length > 0) {
        return { urls, partialErrors: "partialErrors" in data ? data.partialErrors : undefined }
      }
    }

    const urls: string[] = []
    const partialErrors: string[] = []
    for (const f of filesToUpload) {
      try {
        urls.push(await postEventUpload("event-gallery", f))
      } catch (e) {
        console.error(e)
        partialErrors.push(f.name)
      }
    }
    if (urls.length === 0) {
      throw new Error(data.error || "No files could be uploaded")
    }
    return { urls, partialErrors: partialErrors.length > 0 ? partialErrors : undefined }
  }

  const handleStandardUpload = async (field: "event-hero" | "event-player" | "event-photographer", file: File) => {
    setStandardUploading(field)
    try {
      const url = await postEventUpload(field, file)
      if (field === "event-hero") setHeroImageUrl(url)
      else if (field === "event-player") setPlayerImageUrl(url)
      else setPhotographerLogoUrl(url)
    } catch (e) {
      console.error(e)
      const message = e instanceof Error ? e.message : "Upload failed"
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: message,
      })
    } finally {
      setStandardUploading(null)
    }
  }

  const handlePhotoGalleryFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files
    e.target.value = ""
    if (!list?.length) return

    const looksLikeImageByName = (name: string) => /\.(jpe?g|png|gif|webp|bmp|heic|heif|avif|tiff?)$/i.test(name)

    // Accept by MIME or by extension (many mobile browsers use empty or generic MIME)
    const images = Array.from(list).filter(
      (f) => Boolean(f.type?.startsWith("image/")) || looksLikeImageByName(f.name),
    )
    if (images.length === 0) {
      if (list.length > 0) {
        toast({
          variant: "destructive",
          title: "No images to upload",
          description: "Choose image files (JPEG, PNG, WebP, or GIF).",
        })
      }
      return
    }

    const compressFailures: string[] = []
    const filesToUpload: File[] = []
    const maxBytes = 8 * 1024 * 1024
    const yieldPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    try {
      for (let i = 0; i < images.length; i++) {
        setGalleryUploadProgress({ phase: "compress", current: i + 1, total: images.length })
        await yieldPaint()
        const src = images[i]!
        try {
          filesToUpload.push(await compressImageFileToWebp(src))
        } catch (oneErr) {
          console.error(oneErr)
          // WebP/canvas can fail (HEIC, Safari). Upload original if it looks like an image and fits API limit.
          if (
            src.size > 0 &&
            src.size <= maxBytes &&
            (Boolean(src.type?.startsWith("image/")) || looksLikeImageByName(src.name))
          ) {
            filesToUpload.push(src)
          } else {
            compressFailures.push(src?.name || `Image ${i + 1}`)
          }
        }
      }

      if (filesToUpload.length === 0) {
        toast({
          variant: "destructive",
          title: "Photo gallery upload failed",
          description:
            compressFailures.length === 1
              ? `Could not process "${compressFailures[0]}". Try JPEG/PNG or a different browser.`
              : `${compressFailures.length} image(s) could not be processed.`,
        })
        return
      }

      setGalleryUploadProgress({
        phase: "upload",
        current: filesToUpload.length,
        total: filesToUpload.length,
      })
      await yieldPaint()
      const { urls, partialErrors } = await postGalleryFilesBatch(filesToUpload)
      setPhotoGalleryUrls((prev) => [...prev, ...urls])

      if (compressFailures.length > 0 || (partialErrors && partialErrors.length > 0)) {
        const parts = [...compressFailures, ...(partialErrors || [])]
        toast({
          title: "Some photos were skipped",
          description: parts.slice(0, 4).join("; ") + (parts.length > 4 ? "…" : ""),
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Could not upload photos"
      toast({
        variant: "destructive",
        title: "Photo gallery upload failed",
        description: message,
      })
    } finally {
      setGalleryUploadProgress(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate mandatory fields
    const errors: { title?: string; slug?: string; scheduledAt?: string } = {}
    if (!formData.title.trim()) errors.title = "Event title is required"
    if (!slug.trim()) errors.slug = "Event URL is required"
    else if (slugStatus === "taken" || slugStatus === "invalid") errors.slug = slugError
    if (!formData.scheduledAt) errors.scheduledAt = "Date and time are required"
    else {
      const [datePart, timePart] = formData.scheduledAt.split("T")
      if (!datePart || !timePart || timePart === "00:00" && !formData.scheduledAt.includes("T")) {
        errors.scheduledAt = "Please set both date and time"
      }
    }
    if (!skipCreditsValidation && creditStatus === "insufficient") {
      errors.scheduledAt = `Insufficient credits: need ${creditInfo?.need} for this event (validity + extra event days), have ${creditInfo?.have}.`
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setActiveTab("details")
      return
    }
    setFieldErrors({})

    // Convert local datetime string to UTC ISO using the selected timezone
    const scheduledAtUtc = formData.scheduledAt ? localToUtc(formData.scheduledAt, timezone) : null

    // Convert additional dates to UTC (each uses its own timezone if set)
    const additionalDatesUtc = additionalDates
      .filter((d) => d.scheduledAt)
      .map((d, i) => {
        const tz = d.timezone ?? timezone
        return {
          label: d.label || `Day ${i + 2}`,
          scheduledAt: localToUtc(d.scheduledAt, tz),
          timezone: tz,
        }
      })

    const payload = {
      title: formData.title,
      subtitle: formData.subtitle.trim(),
      description: formData.description,
      streamType: formData.streamType,
      slug: slug || undefined,
      scheduledAt: scheduledAtUtc,
      timezone: formData.scheduledAt ? timezone : undefined,
      youtubeUrl: (formData.streamType === "youtube_api" || formData.streamType === "youtube_embed") ? formData.youtubeUrl : undefined,
      embedCode: formData.streamType === "third_party" ? formData.embedCode : undefined,
      isPasswordProtected: formData.isPasswordProtected,
      password: formData.isPasswordProtected ? formData.password : undefined,
      allowChat: formData.allowChat,
      allowReactions: formData.allowReactions,
      showScheduledPage: formData.showScheduledPage,
      additionalDates: additionalDatesUtc,
      simulcastConfig: formData.streamType === "rtmp" ? simulcastConfig : undefined,
      // YouTube API: pass channel + broadcast settings so the parent can create the broadcast
      youtubeChannelId: formData.streamType === "youtube_api" ? selectedYouTubeChannel : undefined,
      youtubeBroadcastSettings: formData.streamType === "youtube_api" ? youtubeBroadcastSettings : undefined,
      templateId: formData.templateId || "tpl-default",
      // Always send templateData with templateId so PUT/POST persist the selection (JSON drops undefined keys).
      templateData: { ...templateData, templateId: formData.templateId || "tpl-default" },
      // Send null (not omit) when cleared so PUT can persist clearing — COALESCE no longer blocks NULL.
      heroImageUrl: heroImageUrl.trim() ? heroImageUrl.trim() : null,
      playerImageUrl: playerImageUrl.trim() ? playerImageUrl.trim() : null,
      photoGalleryUrls: [...photoGalleryUrls],
      photographerLogoUrl: photographerLogoUrl.trim() ? photographerLogoUrl.trim() : null,
      photographerContact: Object.keys(photographerContact).length ? photographerContact : undefined,
      validityExpiresAt:
        validityChoiceKey === "until" && validityExpiresAt ? new Date(validityExpiresAt).toISOString() : undefined,
      validityDays:
        !formData.streamType
          ? 30
          : validityChoiceKey === "included"
            ? validityExtSettings.defaultDays
            : validityChoiceKey.startsWith("tier:")
              ? (() => {
                  const n = Number(validityChoiceKey.slice(5))
                  return Number.isFinite(n) && n > 0 ? n : undefined
                })()
              : undefined,
      crewPin: crewPin.trim() || undefined,
      useCustomDomain: formData.useCustomDomain,
    }

    const needsCredentials = !isEditing && (formData.streamType === "rtmp" || formData.streamType === "youtube_api") && !crewPin.trim() && !!formData.streamType

    onSave(payload as unknown as LiveEvent, needsCredentials)
  }

  const handleCloseCredentialsScreen = () => {
    setShowCredentialsScreen(false)
    setCredentials(null)
    onOpenChange(false)
  }

  // Render credentials success screen
  if (showCredentialsScreen && credentials) {
    return (
      <Dialog open={open} onOpenChange={handleCloseCredentialsScreen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Check className="h-5 w-5" />
              Event Created Successfully!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Alert className="border-primary/50 bg-primary/5">
              <Video className="h-4 w-4" />
              <AlertTitle>Your Streaming Credentials</AlertTitle>
              <AlertDescription>
                Use these credentials in OBS, Wirecast, or any RTMP-compatible encoder.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">RTMP URL (Server)</Label>
                <div className="flex gap-2">
                  <Input value={credentials.rtmpUrl} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.rtmpUrl, "rtmp")}
                  >
                    {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Stream Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={credentials.streamKey}
                      readOnly
                      type={showStreamKey ? "text" : "password"}
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                    >
                      {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.streamKey, "key")}
                  >
                    {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Simulcast destinations summary */}
            {simulcastConfig.enabled && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <h5 className="font-medium text-sm">Simulcast Destinations</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  {simulcastConfig.youtubeChannelId && (
                    <p>
                      • YouTube Live -{" "}
                      {youtubeChannels.find((c) => c.id === simulcastConfig.youtubeChannelId)?.channelTitle}
                    </p>
                  )}
                  {simulcastConfig.facebookPageId && (
                    <p>
                      • Facebook Live - {facebookPages.find((p) => p.id === simulcastConfig.facebookPageId)?.pageName}
                    </p>
                  )}
                  {simulcastConfig.customDestinations.map((dest) => (
                    <p key={dest.id}>• {dest.name}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <h5 className="font-medium text-sm">Quick Setup for OBS Studio</h5>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open OBS Studio → Settings → Stream</li>
                <li>Set Service to "Custom..."</li>
                <li>Paste RTMP URL in "Server" field</li>
                <li>Paste Stream Key in "Stream Key" field</li>
                <li>Click "Apply" and start streaming!</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCloseCredentialsScreen}>
                <List className="h-4 w-4 mr-2" />
                View All Events
              </Button>
              <Button className="flex-1" onClick={handleCloseCredentialsScreen}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] h-[100dvh] sm:h-auto sm:max-h-[min(90vh,90dvh)] w-full max-w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col border-none sm:border">
        <DialogHeader className="p-4 sm:p-6 border-b shrink-0">
          <DialogTitle>{isEditing ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 sm:pb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto pb-1 mb-2 -mx-1 px-1 scrollbar-hide">
                <TabsList className="flex w-full bg-muted/50 p-1 h-auto sm:grid sm:grid-cols-4 gap-1">
                  <TabsTrigger value="details" className="flex-1 sm:flex-none py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Details</TabsTrigger>
                  <TabsTrigger value="stream" className="flex-1 sm:flex-none py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Stream</TabsTrigger>
                  <TabsTrigger value="template" className="flex-1 sm:flex-none py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Template</TabsTrigger>
                  <TabsTrigger value="settings" className="flex-1 sm:flex-none py-2 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Settings</TabsTrigger>
                </TabsList>
              </div>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  aria-invalid={!!fieldErrors.title}
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                    setFieldErrors((prev) => ({ ...prev, title: undefined }))
                  }}
                  placeholder={typedPlaceholder || "Enter event title"}
                  className={fieldErrors.title ? "border-destructive bg-destructive/5" : undefined}
                />
                {fieldErrors.title && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fieldErrors.title}
                  </p>
                )}
                <div className="flex flex-col gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Title font (watch page)</Label>
                    <EventTitleFontPicker
                      value={
                        typeof templateData.titleGoogleFont === "string" && templateData.titleGoogleFont.trim()
                          ? String(templateData.titleGoogleFont).trim()
                          : null
                      }
                      onChange={(fam) => {
                        setTemplateData((prev) => {
                          const next = { ...prev }
                          delete next.titleFontFamily
                          if (!fam) delete next.titleGoogleFont
                          else next.titleGoogleFont = fam
                          return next
                        })
                      }}
                    />
                  </div>
                  <TitleSizeSliderBlock
                    templateId={formData.templateId || "tpl-default"}
                    templateData={templateData}
                    setTemplateData={setTemplateData}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Optional. Font loads on the watch page only. Size default follows the selected template until you move the slider.
                </p>
              </div>

              {/* Event URL / slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="flex items-center gap-1.5">
                  <Link className="h-3.5 w-3.5" />
                  Event URL <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <div className="flex items-center rounded-md border border-input bg-secondary overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                    <span className="hidden sm:inline-block px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-r border-input whitespace-nowrap select-none">
                      {formData.useCustomDomain && primaryDomain ? primaryDomain : (typeof window !== "undefined" ? window.location.host : "streamlivee.com")}/
                    </span>
                    <input
                      id="slug"
                      type="text"
                      value={slug}
                      placeholder="my-event-name"
                      maxLength={80}
                      className="flex-1 px-3 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        setSlug(val)
                        setSlugTouched(true)
                        if (val) setFieldErrors((prev) => ({ ...prev, slug: undefined }))
                        if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
                        slugDebounceRef.current = setTimeout(() => checkSlug(val, event?.id), 500)
                      }}
                    />
                    <span className="pr-2 flex items-center">
                      {slugStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {slugStatus === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {(slugStatus === "taken" || slugStatus === "invalid") && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </span>
                  </div>
                </div>

                {(youtubeOwnerType === "studio" || youtubeOwnerType === "admin") && primaryDomain && (
                  <div className="flex items-center justify-between py-1 px-1 mt-1 bg-muted/30 rounded-md border border-border/50">
                    <div className="space-y-0.5">
                      <Label className="text-[11px] font-medium flex items-center gap-1.5">
                        <Globe className="h-3 w-3 text-primary" />
                        Custom Domain URL
                      </Label>
                      <p className="text-[10px] text-muted-foreground leading-none">Use your verified brand domain: {primaryDomain}</p>
                    </div>
                    <Switch
                      checked={formData.useCustomDomain}
                      onCheckedChange={(checked) => setFormData({ ...formData, useCustomDomain: checked })}
                      className="scale-75 origin-right"
                    />
                  </div>
                )}
                {slugStatus === "available" && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Available</p>
                )}
                {(slugStatus === "taken" || slugStatus === "invalid") && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{slugError}</p>
                )}
                {slugStatus === "idle" && slug === "" && !fieldErrors.slug && (
                  <p className="text-xs text-muted-foreground">Auto-filled from title. You can customise it.</p>
                )}
                {fieldErrors.slug && slugStatus !== "taken" && slugStatus !== "invalid" && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{fieldErrors.slug}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Sub-title</Label>
                <div className="relative">
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) => handleSubtitleChange(e.target.value)}
                    onFocus={() => {
                      const slashMatch = getSubtitleSlashMatch(formData.subtitle)
                      if (slashMatch) {
                        setShowSubtitleCommands(true)
                        setSubtitleCommandQuery((slashMatch[1] || "").trim())
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!showSubtitleCommands || filteredSubtitleCommands.length === 0) return
                      switch (e.key) {
                        case "ArrowDown":
                          e.preventDefault()
                          setSelectedSubtitleCommandIndex(
                            (prev) => (prev + 1) % filteredSubtitleCommands.length,
                          )
                          break
                        case "ArrowUp":
                          e.preventDefault()
                          setSelectedSubtitleCommandIndex(
                            (prev) =>
                              (prev - 1 + filteredSubtitleCommands.length) %
                              filteredSubtitleCommands.length,
                          )
                          break
                        case "Enter":
                        case "Tab":
                          e.preventDefault()
                          applySubtitleCommand(
                            filteredSubtitleCommands[selectedSubtitleCommandIndex].message,
                          )
                          break
                        case "Escape":
                          e.preventDefault()
                          setShowSubtitleCommands(false)
                          break
                        default:
                          break
                      }
                    }}
                    placeholder={typedSubtitlePlaceholder}
                    maxLength={200}
                  />

                  {showSubtitleCommands && (
                    <div className="absolute z-30 mt-2 w-full rounded-md border border-border bg-popover p-1 shadow-md">
                      <div className="mb-1 flex items-center justify-between gap-2 border-b border-border px-1 pb-1">
                        <p className="text-[11px] text-muted-foreground">Sub-title canned messages</p>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={beginAddSubtitleMessage}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add new
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setShowSubtitleCommands(false)
                              resetSubtitleDraftEditor()
                            }}
                            aria-label="Close canned messages"
                            title="Close"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {filteredSubtitleCommands.length === 0 ? (
                        <p className="px-2 py-1.5 text-xs text-muted-foreground">No canned messages found.</p>
                      ) : (
                        filteredSubtitleCommands.map((item, index) => (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            className={`group w-full rounded-sm px-2 py-1.5 text-left transition-colors ${
                              index === selectedSubtitleCommandIndex
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/70"
                            }`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySubtitleCommand(item.message)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                applySubtitleCommand(item.message)
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-xs font-medium ${
                                  index === selectedSubtitleCommandIndex
                                    ? "text-accent-foreground"
                                    : "group-hover:text-accent-foreground"
                                }`}
                              >
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-[11px]"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    beginEditSubtitleMessage(item)
                                  }}
                                >
                                  Edit
                                </Button>
                                {pendingDeleteSubtitleMessageId === item.id ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 px-1.5 text-[11px] text-destructive hover:text-destructive"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        deleteSubtitleMessage(item.id)
                                      }}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 px-1.5 text-[11px]"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setPendingDeleteSubtitleMessageId(null)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 text-[11px] text-muted-foreground"
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setPendingDeleteSubtitleMessageId(item.id)
                                    }}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{item.message}</p>
                          </div>
                        ))
                      )}

                      {(isAddingSubtitleMessage || editingSubtitleMessageId) && (
                        <div className="mt-1 space-y-2 rounded-md border border-border bg-background/60 p-2">
                          <p className="text-[11px] font-medium">
                            {isAddingSubtitleMessage ? "Add sub-title canned message" : "Edit sub-title canned message"}
                          </p>
                          <Input
                            value={subtitleDraftTitle}
                            onChange={(e) => setSubtitleDraftTitle(e.target.value)}
                            placeholder="Title"
                            className="h-8 text-xs"
                          />
                          <Textarea
                            value={subtitleDraftMessage}
                            onChange={(e) => setSubtitleDraftMessage(e.target.value)}
                            placeholder="Short line (shown in sub-title)"
                            rows={2}
                            className="text-xs"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={resetSubtitleDraftEditor}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={!subtitleDraftTitle.trim() || !subtitleDraftMessage.trim()}
                              onClick={saveSubtitleDraft}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Type <kbd className="rounded border px-1 text-[10px]">/</kbd> for canned messages
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    onFocus={() => {
                      const slashMatch = getDescriptionSlashMatch(formData.description)
                      if (slashMatch) {
                        setShowDescriptionCommands(true)
                        setDescriptionCommandQuery((slashMatch[1] || "").trim())
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!showDescriptionCommands || filteredDescriptionCommands.length === 0) return
                      switch (e.key) {
                        case "ArrowDown":
                          e.preventDefault()
                          setSelectedDescriptionCommandIndex((prev) => (prev + 1) % filteredDescriptionCommands.length)
                          break
                        case "ArrowUp":
                          e.preventDefault()
                          setSelectedDescriptionCommandIndex((prev) =>
                            (prev - 1 + filteredDescriptionCommands.length) % filteredDescriptionCommands.length
                          )
                          break
                        case "Enter":
                        case "Tab":
                          e.preventDefault()
                          applyDescriptionCommand(filteredDescriptionCommands[selectedDescriptionCommandIndex].message)
                          break
                        case "Escape":
                          e.preventDefault()
                          setShowDescriptionCommands(false)
                          break
                        default:
                          break
                      }
                    }}
                    placeholder={typedDescriptionPlaceholder || "Describe your event"}
                    rows={3}
                  />

                  {showDescriptionCommands && (
                    <div className="absolute z-30 mt-2 w-full rounded-md border border-border bg-popover p-1 shadow-md">
                      <div className="mb-1 flex items-center justify-between gap-2 border-b border-border px-1 pb-1">
                        <p className="text-[11px] text-muted-foreground">Canned messages</p>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={beginAddDescriptionMessage}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add new
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setShowDescriptionCommands(false)
                              resetDescriptionDraftEditor()
                            }}
                            aria-label="Close canned messages"
                            title="Close"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {filteredDescriptionCommands.length === 0 ? (
                        <p className="px-2 py-1.5 text-xs text-muted-foreground">No canned messages found.</p>
                      ) : (
                        filteredDescriptionCommands.map((item, index) => (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            className={`group w-full rounded-sm px-2 py-1.5 text-left transition-colors ${
                              index === selectedDescriptionCommandIndex
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/70"
                            }`}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyDescriptionCommand(item.message)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                applyDescriptionCommand(item.message)
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-xs font-medium ${
                                  index === selectedDescriptionCommandIndex
                                    ? "text-accent-foreground"
                                    : "group-hover:text-accent-foreground"
                                }`}
                              >
                                {item.title}
                              </p>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 px-1.5 text-[11px]"
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    beginEditDescriptionMessage(item)
                                  }}
                                >
                                  Edit
                                </Button>
                                {pendingDeleteDescriptionMessageId === item.id ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 px-1.5 text-[11px] text-destructive hover:text-destructive"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        deleteDescriptionMessage(item.id)
                                      }}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 px-1.5 text-[11px]"
                                      onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setPendingDeleteDescriptionMessageId(null)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 px-1.5 text-[11px] text-destructive hover:text-destructive"
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setPendingDeleteDescriptionMessageId(item.id)
                                    }}
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p
                              className={`text-[11px] line-clamp-2 ${
                                index === selectedDescriptionCommandIndex
                                  ? "text-accent-foreground/85"
                                  : "text-muted-foreground group-hover:text-accent-foreground/85"
                              }`}
                            >
                              {item.message}
                            </p>
                          </div>
                        ))
                      )}

                      {(isAddingDescriptionMessage || editingDescriptionMessageId) && (
                        <div className="mt-1 space-y-2 rounded-md border border-border bg-background/60 p-2">
                          <p className="text-[11px] font-medium">
                            {isAddingDescriptionMessage ? "Add canned message" : "Edit canned message"}
                          </p>
                          <Input
                            value={descriptionDraftTitle}
                            onChange={(e) => setDescriptionDraftTitle(e.target.value)}
                            placeholder="Title"
                            className="h-8 text-xs"
                          />
                          <Textarea
                            value={descriptionDraftMessage}
                            onChange={(e) => setDescriptionDraftMessage(e.target.value)}
                            placeholder="Message text"
                            rows={3}
                            className="text-xs"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={resetDescriptionDraftEditor}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={!descriptionDraftTitle.trim() || !descriptionDraftMessage.trim()}
                              onClick={saveDescriptionDraft}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Type <code>/</code> in description to insert canned messages.</p>
              </div>

              {/* Schedule: date, timezone, countdown — placed above additional dates for clearer flow */}
              <div className="space-y-3">
                {(() => {
                  const isDateLocked = isEditing && !!event?.scheduledAt && new Date(event.scheduledAt as unknown as string) <= new Date()
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="scheduledAt">
                            Date & Time <span className="text-destructive">*</span>
                          </Label>
                          {isDateLocked && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              Locked
                            </span>
                          )}
                        </div>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          disabled={isDateLocked}
                          value={formData.scheduledAt || ""}
                          onChange={(e) => {
                            setFormData({ ...formData, scheduledAt: e.target.value })
                            if (e.target.value) setFieldErrors((prev) => ({ ...prev, scheduledAt: undefined }))
                          }}
                          required
                          className={`${fieldErrors.scheduledAt ? "border-destructive bg-destructive/5" : ""} [color-scheme:dark]`}
                        />
                        {fieldErrors.scheduledAt && (
                          <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.scheduledAt}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone} disabled={isDateLocked}>
                          <SelectTrigger id="timezone" className="w-full">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="Asia/Kolkata">IST (UTC+5:30)</SelectItem>
                            <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                            <SelectItem value="America/New_York">EST/EDT (UTC−5/−4)</SelectItem>
                            <SelectItem value="America/Chicago">CST/CDT (UTC−6/−5)</SelectItem>
                            <SelectItem value="America/Denver">MST/MDT (UTC−7/−6)</SelectItem>
                            <SelectItem value="America/Los_Angeles">PST/PDT (UTC−8/−7)</SelectItem>
                            <SelectItem value="Europe/London">GMT/BST (UTC+0/+1)</SelectItem>
                            <SelectItem value="Europe/Paris">CET/CEST (UTC+1/+2)</SelectItem>
                            <SelectItem value="Europe/Moscow">MSK (UTC+3)</SelectItem>
                            <SelectItem value="Asia/Dubai">GST (UTC+4)</SelectItem>
                            <SelectItem value="Asia/Karachi">PKT (UTC+5)</SelectItem>
                            <SelectItem value="Asia/Bangkok">ICT (UTC+7)</SelectItem>
                            <SelectItem value="Asia/Singapore">SGT (UTC+8)</SelectItem>
                            <SelectItem value="Asia/Tokyo">JST (UTC+9)</SelectItem>
                            <SelectItem value="Australia/Sydney">AEST (UTC+10/+11)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })()}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, showScheduledPage: !formData.showScheduledPage })}
                    className={`h-4 w-4 rounded-sm border flex items-center justify-center transition-colors shrink-0 ${
                      formData.showScheduledPage
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground bg-transparent"
                    }`}
                  >
                    {formData.showScheduledPage && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                  <Label
                    className="text-xs text-muted-foreground cursor-pointer select-none"
                    onClick={() => setFormData({ ...formData, showScheduledPage: !formData.showScheduledPage })}
                  >
                    {formData.showScheduledPage
                      ? "Countdown page enabled (viewers see a countdown)"
                      : "Countdown page disabled (viewers see event page directly)"}
                  </Label>
                </div>
              </div>

              {/* Additional dates */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">Additional Dates</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => setAdditionalDates([...additionalDates, { id: crypto.randomUUID(), label: "", scheduledAt: "", timezone }])}
                  >
                    <Plus className="h-3 w-3" />
                    Add Date
                  </Button>
                </div>

                {additionalDates.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No additional dates. Click &quot;Add Date&quot; to add more sessions.</p>
                )}

                {additionalDates.map((extra, idx) => (
                  <div key={extra.id} className="border border-border rounded-md p-3 space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        placeholder={`Day ${idx + 2} label (e.g. "Evening Session")`}
                        value={extra.label}
                        className="h-8 text-sm flex-1"
                        onChange={(e) => setAdditionalDates(additionalDates.map((d) => d.id === extra.id ? { ...d, label: e.target.value } : d))}
                      />
                      <button
                        type="button"
                        title="Remove this date"
                        className="h-7 w-7 flex items-center justify-center rounded border border-destructive/40 text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => setAdditionalDates(additionalDates.filter((d) => d.id !== extra.id))}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Input
                        type="date"
                        className="flex-1 [color-scheme:dark] h-8 text-sm min-w-[120px]"
                        value={extra.scheduledAt ? extra.scheduledAt.slice(0, 10) : ""}
                        onChange={(e) => {
                          const date = e.target.value
                          const time = extra.scheduledAt ? extra.scheduledAt.slice(11, 16) : "00:00"
                          setAdditionalDates(additionalDates.map((d) => d.id === extra.id ? { ...d, scheduledAt: date ? `${date}T${time}` : "" } : d))
                        }}
                      />
                      <Input
                        type="time"
                        className="w-36 [color-scheme:dark] h-8 text-sm shrink-0"
                        value={extra.scheduledAt ? extra.scheduledAt.slice(11, 16) : ""}
                        onChange={(e) => {
                          const time = e.target.value
                          const date = extra.scheduledAt ? extra.scheduledAt.slice(0, 10) : (formData.scheduledAt ? formData.scheduledAt.slice(0, 10) : new Date().toISOString().slice(0, 10))
                          setAdditionalDates(additionalDates.map((d) => d.id === extra.id ? { ...d, scheduledAt: `${date}T${time}` } : d))
                        }}
                      />
                      <Select
                        value={extra.timezone ?? timezone}
                        onValueChange={(val) => setAdditionalDates(additionalDates.map((d) => d.id === extra.id ? { ...d, timezone: val } : d))}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {[
                            { value: "Asia/Kolkata",        label: "IST (UTC+5:30)" },
                            { value: "UTC",                 label: "UTC (UTC+0)" },
                            { value: "America/New_York",    label: "EST/EDT (UTC−5/−4)" },
                            { value: "America/Chicago",     label: "CST/CDT (UTC−6/−5)" },
                            { value: "America/Denver",      label: "MST/MDT (UTC−7/−6)" },
                            { value: "America/Los_Angeles", label: "PST/PDT (UTC−8/−7)" },
                            { value: "Europe/London",       label: "GMT/BST (UTC+0/+1)" },
                            { value: "Europe/Paris",        label: "CET/CEST (UTC+1/+2)" },
                            { value: "Europe/Moscow",       label: "MSK (UTC+3)" },
                            { value: "Asia/Dubai",          label: "GST (UTC+4)" },
                            { value: "Asia/Karachi",        label: "PKT (UTC+5)" },
                            { value: "Asia/Dhaka",          label: "BST (UTC+6)" },
                            { value: "Asia/Bangkok",        label: "ICT (UTC+7)" },
                            { value: "Asia/Singapore",      label: "SGT (UTC+8)" },
                            { value: "Asia/Tokyo",          label: "JST (UTC+9)" },
                            { value: "Australia/Sydney",    label: "AEST (UTC+10/+11)" },
                            { value: "Pacific/Auckland",    label: "NZST (UTC+12)" },
                          ].map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {extra.scheduledAt && (
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(extra.scheduledAt).toLocaleString("en-IN", { timeZone: extra.timezone ?? timezone, dateStyle: "medium", timeStyle: "short" })}
                        {" "}({(extra.timezone ?? timezone).split("/").pop()?.replace("_", " ")})
                        {extra.scheduledAt.slice(0, 10) === (formData.scheduledAt ? formData.scheduledAt.slice(0, 10) : "") && (
                          <span className="ml-2 text-muted-foreground/60">· same day as primary — no extra credit</span>
                        )}
                      </p>
                    )}
                  </div>
                ))}

                {/* Credit status */}
                {!skipCreditsValidation && creditStatus === "checking" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" /> Checking credits...
                  </p>
                )}
                {!skipCreditsValidation && creditStatus === "ok" && creditInfo && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    {creditPreviewBucketLabel} credits: sufficient — {creditInfo.need} credit
                    {creditInfo.need > 1 ? "s" : ""} will be debited for validity + extra event days (
                    {creditInfo.have} available)
                  </p>
                )}
                {!skipCreditsValidation && creditStatus === "insufficient" && creditInfo && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />
                    {creditPreviewBucketLabel} credits: insufficient — need {creditInfo.need} for validity + extra event
                    days, have {creditInfo.have}.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stream" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Stream Type <span className="text-muted-foreground font-normal text-xs">(optional — can be set later)</span></Label>
                  {formData.streamType && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                      onClick={() => setFormData({ ...formData, streamType: "" as StreamType })}
                    >
                      Clear selection
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "rtmp", label: "RTMP Server", icon: Video, desc: "Use OBS/Wirecast" },
                    {
                      value: "youtube_api",
                      label: "YouTube API",
                      icon: Zap,
                      desc: "Direct broadcast",
                      badge: "Recommended",
                    },
                    { value: "youtube", label: "YouTube Embed", icon: Youtube, desc: "Embed existing" },
                    { value: "embedded", label: "Third Party", icon: Globe, desc: "External embed" },
                  ].map((type) => {
                    const canon = formStreamTypeToCanonical(type.value)
                    const adminOff =
                      canon && streamTypePricing ? streamTypePricing[canon]?.enabled === false : false
                    const cardDisabled = !!adminOff
                    return (
                      <Card
                        key={type.value}
                        role="button"
                        tabIndex={cardDisabled ? -1 : 0}
                        aria-disabled={cardDisabled}
                        className={`transition-colors ${
                          cardDisabled
                            ? "cursor-not-allowed opacity-45 border-border/50"
                            : `cursor-pointer ${
                                formData.streamType === type.value
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary/50 opacity-80 hover:opacity-100"
                              }`
                        }`}
                        onClick={() => {
                          if (cardDisabled) return
                          setFormData({
                            ...formData,
                            streamType: (formData.streamType === type.value ? "" : type.value) as StreamType,
                          })
                        }}
                        onKeyDown={(e) => {
                          if (cardDisabled) return
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            setFormData({
                              ...formData,
                              streamType: (formData.streamType === type.value ? "" : type.value) as StreamType,
                            })
                          }
                        }}
                      >
                        <CardContent className="p-4 text-center relative">
                          {type.badge && (
                            <Badge className="absolute top-2 right-2 text-xs bg-red-500">{type.badge}</Badge>
                          )}
                          {adminOff && (
                            <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">
                              Unavailable
                            </Badge>
                          )}
                          <type.icon
                            className={`h-8 w-8 mx-auto mb-2 ${type.value === "youtube_api" ? "text-red-500" : "text-primary"}`}
                          />
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {adminOff ? "Disabled by administrator" : type.desc}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {!formData.streamType && (
                  <p className="text-xs text-muted-foreground pt-1">
                    No stream type selected. You can add one after creating the event.
                  </p>
                )}
                {!skipCreditsValidation && (
                  <div className="pt-2 space-y-1">
                    {creditStatus === "checking" && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" /> Checking credits…
                      </p>
                    )}
                    {creditStatus === "ok" && creditInfo && (
                      <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        {creditPreviewBucketLabel} credits: sufficient — {creditInfo.need} credit
                        {creditInfo.need > 1 ? "s" : ""} for validity + extra event days ({creditInfo.have} available)
                      </p>
                    )}
                    {creditStatus === "insufficient" && creditInfo && (
                      <p className="text-xs text-destructive flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" />
                        {creditPreviewBucketLabel} credits: insufficient — need {creditInfo.need}, have {creditInfo.have}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {isEditing && formData.streamType === "rtmp" && ((event as any)?.hasCrewPin || crewPin.trim()) && (
                  <div className="space-y-2 p-4 rounded-lg border bg-muted/30">
                    <Alert className="border-primary/50 bg-primary/5">
                      <Lock className="h-4 w-4" />
                      <AlertTitle>Credentials protected by crew PIN</AlertTitle>
                      <AlertDescription>
                        Stream URL and key are only visible on the crew page after entering the PIN. Share this link with your crew (do not share on the public event page).
                      </AlertDescription>
                    </Alert>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={crewPageUrl} className="font-mono text-sm" placeholder="/your-event-slug/crew" />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!crewPageUrl}
                        onClick={() => crewPageUrl && copyToClipboard(crewPageUrl, "rtmp")}
                      >
                        {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

              {isEditing &&
                showRtmpCredentials &&
                formData.streamType === "rtmp" &&
                !(event as any)?.hasCrewPin &&
                !crewPin.trim() && (
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                    <Alert className="border-primary/50 bg-primary/5">
                      <Video className="h-4 w-4" />
                      <AlertTitle>Your Streaming Credentials</AlertTitle>
                      <AlertDescription>Use these credentials in OBS, Wirecast, or any RTMP encoder.</AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">RTMP URL (Server)</Label>
                      <div className="flex gap-2">
                        <Input value={formData.rtmpUrl || ""} readOnly className="font-mono text-sm" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(formData.rtmpUrl!, "rtmp")}
                        >
                          {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Stream Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={formData.streamKey || ""}
                            readOnly
                            type={showStreamKey ? "text" : "password"}
                            className="font-mono text-sm pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowStreamKey(!showStreamKey)}
                          >
                            {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(formData.streamKey!, "key")}
                        >
                          {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* OBS Setup Instructions */}
                    <div className="space-y-2 p-3 rounded border bg-background">
                      <h5 className="font-medium text-sm">Quick Setup for OBS Studio</h5>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Open OBS Studio → Settings → Stream</li>
                        <li>Set Service to "Custom..."</li>
                        <li>Paste RTMP URL in "Server" field</li>
                        <li>Paste Stream Key in "Stream Key" field</li>
                        <li>Click "Apply" and start streaming!</li>
                      </ol>
                    </div>
                  </div>
                )}

              {formData.streamType === "rtmp" && (
                <SimulcastDestinations
                  youtubeChannels={youtubeChannels}
                  facebookPages={facebookPages}
                  config={simulcastConfig}
                  onConfigChange={setSimulcastConfig}
                  simulcastPricing={simulcastPricingFromApi ?? undefined}
                  onYouTubeChannelConnected={(channel) => {
                    setYoutubeChannels([...youtubeChannels, channel])
                  }}
                  onFacebookPageConnected={(page) => {
                    setFacebookPages([...facebookPages, page])
                  }}
                />
              )}

              {formData.streamType === "youtube_api" && (
                <>
                  <YouTubeChannelSelector
                    ownerId={youtubeOwnerId || ""}
                    ownerType={youtubeOwnerType || "streamer"}
                    selectedChannelId={selectedYouTubeChannel}
                    onSelectChannel={setSelectedYouTubeChannel}
                    broadcastSettings={youtubeBroadcastSettings}
                    onSettingsChange={setYoutubeBroadcastSettings}
                    getDraftState={() => ({
                      title: formData.title,
                      slug,
                      scheduledAt: formData.scheduledAt,
                      timezone,
                    })}
                    oauthContext={{
                      mode: isEditing ? "edit" : "create",
                      eventId: isEditing && event?.id ? (event.id as string) : undefined,
                    }}
                  />
                  {isEditing && event && (
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="pt-4 space-y-3">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <Youtube className="h-4 w-4 text-red-500" />
                          YouTube API – Stream credentials
                        </h4>
                        {((event as any)?.hasCrewPin || crewPin.trim()) ? (
                          <>
                            <Alert className="border-primary/50 bg-primary/5">
                              <Lock className="h-4 w-4" />
                              <AlertTitle>Credentials protected by crew PIN</AlertTitle>
                              <AlertDescription>Share the crew link with your stream crew. They enter the PIN to view the ingest URL and stream key.</AlertDescription>
                            </Alert>
                            <div className="flex items-center gap-2">
                              <Input readOnly value={crewPageUrl} className="font-mono text-sm" placeholder="/your-event-slug/crew" />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!crewPageUrl}
                                onClick={() => crewPageUrl && copyToClipboard(crewPageUrl, "rtmp")}
                              >
                                {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </>
                        ) : youtubeCredentialsLoading ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading credentials…
                          </p>
                        ) : youtubeBroadcastCredentials?.rtmpUrl && youtubeBroadcastCredentials?.streamKey ? (
                          <>
                            <p className="text-xs text-muted-foreground">
                              Use these in OBS or any RTMP encoder to stream to this event.
                            </p>
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">RTMP URL (FMS)</Label>
                                <div className="flex gap-2">
                                  <Input
                                    readOnly
                                    value={youtubeBroadcastCredentials.rtmpUrl}
                                    className="font-mono text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => {
                                      copyToClipboard(youtubeBroadcastCredentials.rtmpUrl, "rtmp")
                                    }}
                                  >
                                    {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Stream Key</Label>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Input
                                      readOnly
                                      type={showStreamKey ? "text" : "password"}
                                      value={youtubeBroadcastCredentials.streamKey}
                                      className="font-mono text-sm pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="absolute right-0 top-0 h-full"
                                      onClick={() => setShowStreamKey(!showStreamKey)}
                                    >
                                      {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => copyToClipboard(youtubeBroadcastCredentials.streamKey, "key")}
                                  >
                                    {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            {selectedYouTubeChannel ? (
                              <>
                                <p className="text-xs text-muted-foreground">
                                  No broadcast found for this event. Create one to get your YouTube ingest URL and stream key.
                                </p>
                                {broadcastCreateError && (
                                  <p className="text-xs text-destructive">{broadcastCreateError}</p>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleCreateBroadcast}
                                  disabled={isCreatingBroadcast}
                                >
                                  {isCreatingBroadcast && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                  {isCreatingBroadcast ? "Creating Broadcast…" : "Create Broadcast"}
                                </Button>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">
                                Select a YouTube channel above, then click <strong>Create Broadcast</strong> to get your ingest URL and stream key.
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {formData.streamType === "youtube_embed" && (
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube Live URL *</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {formData.streamType === "third_party" && (
                <div className="space-y-2">
                  <Label htmlFor="embedCode">Embed Code *</Label>
                  <Textarea
                    id="embedCode"
                    value={formData.embedCode}
                    onChange={(e) => setFormData({ ...formData, embedCode: e.target.value })}
                    placeholder="<iframe src=..."
                    rows={4}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="template" className="space-y-4 mt-4">
              {/* Standard event media (all templates) */}
              <Card className="border-muted">
                <CardContent className="pt-4 space-y-4">
                  <h4 className="text-sm font-medium">Event media & info</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Player image</Label>
                      {playerImageUrl ? (
                        <div className="relative w-32 h-24 rounded border overflow-hidden">
                          <img src={playerImageUrl} alt="Player" className="w-full h-full object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setPlayerImageUrl("")}>
                            <X className="h-3 w-3" />
                          </Button>
                          <AiImagePickerDialog
                            dialogTitle="Player image"
                            uploadSubdir="event-player"
                            walletUserId={creditsUserId}
                            onImageUrl={(url) => setPlayerImageUrl(url)}
                          >
                            <Button type="button" variant="secondary" size="sm" className="absolute bottom-1 left-1 h-7 px-2 text-xs">
                              Change
                            </Button>
                          </AiImagePickerDialog>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <AiImagePickerDialog
                            dialogTitle="Player image"
                            uploadSubdir="event-player"
                            walletUserId={creditsUserId}
                            onImageUrl={(url) => setPlayerImageUrl(url)}
                          >
                            <Button type="button" variant="outline" size="sm" className="gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Add image
                            </Button>
                          </AiImagePickerDialog>
                          <span className="text-xs text-muted-foreground">Upload or AI (wallet)</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Hero image (OG share)</Label>
                      {heroUsesCircularCrop ? (
                        <p className="text-xs text-muted-foreground">
                          Memorial and Birthday templates show this image in a circle on the watch page — file uploads open
                          a crop step to fit and align your photo.
                        </p>
                      ) : null}
                      {heroImageUrl ? (
                        <div className="relative w-32 h-24 rounded border overflow-hidden">
                          <img src={heroImageUrl} alt="Hero" className="w-full h-full object-cover" />
                          <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setHeroImageUrl("")}>
                            <X className="h-3 w-3" />
                          </Button>
                          <AiImagePickerDialog
                            dialogTitle="Hero image (OG share)"
                            uploadSubdir="event-hero"
                            circularHeroCrop={heroUsesCircularCrop}
                            walletUserId={creditsUserId}
                            onImageUrl={(url) => setHeroImageUrl(url)}
                          >
                            <Button type="button" variant="secondary" size="sm" className="absolute bottom-1 left-1 h-7 px-2 text-xs">
                              Change
                            </Button>
                          </AiImagePickerDialog>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <AiImagePickerDialog
                            dialogTitle="Hero image (OG share)"
                            uploadSubdir="event-hero"
                            circularHeroCrop={heroUsesCircularCrop}
                            walletUserId={creditsUserId}
                            onImageUrl={(url) => setHeroImageUrl(url)}
                          >
                            <Button type="button" variant="outline" size="sm" className="gap-2">
                              <ImageIcon className="h-4 w-4" />
                              Add image
                            </Button>
                          </AiImagePickerDialog>
                          <span className="text-xs text-muted-foreground">Upload or AI (wallet)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Photo gallery</Label>
                    <p className="text-xs text-muted-foreground">
                      Select one or more images — they are compressed and saved as WebP before upload.
                    </p>
                    <div className="relative rounded-lg border border-border/60 p-2">
                      <div
                        className={`flex flex-wrap gap-2 ${galleryUploadProgress ? "pointer-events-none opacity-60" : ""}`}
                        aria-busy={!!galleryUploadProgress}
                      >
                        {photoGalleryUrls.map((url, i) => (
                          <div key={`${url}-${i}`} className="relative h-20 w-20 overflow-hidden rounded border">
                            <img src={url} alt="" className="h-full w-full object-cover" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute right-0.5 top-0.5 h-5 w-5"
                              onClick={() => setPhotoGalleryUrls((p) => p.filter((_, j) => j !== i))}
                              disabled={!!galleryUploadProgress}
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        ))}
                        <label
                          className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded border border-dashed hover:bg-muted/50 ${
                            standardUploading || galleryUploadProgress ? "cursor-not-allowed opacity-50" : ""
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handlePhotoGalleryFilesChange}
                            disabled={!!standardUploading || !!galleryUploadProgress}
                          />
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </label>
                      </div>
                      {galleryUploadProgress ? (
                        <div
                          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/85 backdrop-blur-sm px-2"
                          role="status"
                          aria-live="polite"
                          aria-label={
                            galleryUploadProgress.phase === "compress"
                              ? `Compressing image ${galleryUploadProgress.current} of ${galleryUploadProgress.total}`
                              : `Uploading ${galleryUploadProgress.total} files to server`
                          }
                        >
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-center text-xs font-medium text-foreground">
                            {galleryUploadProgress.phase === "compress"
                              ? "Compressing images…"
                              : "Uploading to server…"}
                          </p>
                          <p className="text-center text-[11px] text-muted-foreground">
                            {galleryUploadProgress.phase === "compress"
                              ? `Image ${galleryUploadProgress.current} of ${galleryUploadProgress.total}`
                              : `Sending ${galleryUploadProgress.total} file${galleryUploadProgress.total === 1 ? "" : "s"}…`}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Photographer logo</Label>
                    {photographerLogoUrl ? (
                      <div className="relative w-24 h-24 rounded border overflow-hidden">
                        <img src={photographerLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => setPhotographerLogoUrl("")}><X className="h-3 w-3" /></Button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/50 w-fit">
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleStandardUpload("event-photographer", f) }} disabled={!!standardUploading} />
                        {standardUploading === "event-photographer" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm text-muted-foreground">Upload logo</span>
                      </label>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Photographer name</Label>
                      <Input value={photographerContact.name || ""} onChange={(e) => setPhotographerContact((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={photographerContact.phone || ""} onChange={(e) => setPhotographerContact((p) => ({ ...p, phone: e.target.value }))} placeholder="+1..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={photographerContact.email || ""} onChange={(e) => setPhotographerContact((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={photographerContact.website || ""} onChange={(e) => setPhotographerContact((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Label>Select Event Template</Label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories ({templatesForPicker.length})</SelectItem>
                    {templateCategories.map(({ category, count }) => (
                      <SelectItem key={category} value={category}>
                        {category} ({count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {filteredTemplates.map((template) => {
                  const isSelected = formData.templateId === template.id
                  const gradient = getCardGradientForCategory(template.category)
                  return (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all overflow-hidden ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/30"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => setFormData({ ...formData, templateId: template.id })}
                    >
                      <div className={`aspect-video relative bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                        {/* Try to load actual thumbnail; fallback to gradient+text */}
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                        <span className="relative text-[10px] font-semibold text-white/60 text-center px-1 leading-tight select-none">
                          {template.name}
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                            <div className="bg-primary rounded-full p-1">
                              <Check className="h-4 w-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="text-xs font-medium truncate">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.category}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Password Protection</p>
                      <p className="text-xs text-muted-foreground">Require password to view</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isPasswordProtected}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPasswordProtected: checked })}
                  />
                </div>

                {formData.isPasswordProtected && (
                  <div className="space-y-2 pl-8">
                    <Label htmlFor="password">Event Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Live Chat</p>
                      <p className="text-xs text-muted-foreground">Allow viewers to chat</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.allowChat}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowChat: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Reactions</p>
                      <p className="text-xs text-muted-foreground">Allow emoji reactions</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.allowReactions}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowReactions: checked })}
                  />
                </div>

                <div className="space-y-3 p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">Event validity</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Stream type: <span className="text-foreground/90 font-medium">{validityStreamTypeLabel}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{eventValidityHelpText}</p>
                  </div>
                  <Select
                    value={validityChoiceKey}
                    onValueChange={(v) => {
                      setValidityChoiceKey(v)
                      if (v !== "until") setValidityExpiresAt("")
                    }}
                  >
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Choose validity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="included">
                        Default ({validityExtSettings.defaultDays} days) (1 credit total)
                      </SelectItem>
                      {validityExtSettings.extendedTiers
                        .filter((t) => t.enabled)
                        .map((t) => (
                          <SelectItem key={t.days} value={`tier:${t.days}`}>
                            {t.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {!skipCreditsValidation && (
                    <div className="pt-2 space-y-1">
                      {creditStatus === "checking" && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" /> Checking credits…
                        </p>
                      )}
                      {creditStatus === "ok" && creditInfo && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" />
                          {creditPreviewBucketLabel} credits: sufficient — {creditInfo.need} credit
                          {creditInfo.need > 1 ? "s" : ""} for validity + extra event days ({creditInfo.have} available)
                        </p>
                      )}
                      {creditStatus === "insufficient" && creditInfo && (
                        <p className="text-xs text-destructive flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3" />
                          {creditPreviewBucketLabel} credits: insufficient — need {creditInfo.need}, have{" "}
                          {creditInfo.have}.
                        </p>
                      )}
                      {!formData.streamType && creditStatus !== "idle" && creditStatus !== "checking" && creditInfo && (
                        <p className="text-[11px] text-muted-foreground">
                          Preview uses RTMP credits until you choose a stream type (same as create).
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Crew PIN (stream credentials)</p>
                      <p className="text-xs text-muted-foreground">Require PIN to see RTMP details on the crew page</p>
                    </div>
                  </div>
                  <Switch
                    checked={isCrewPinEnabled}
                    onCheckedChange={(checked) => {
                      setIsCrewPinEnabled(checked)
                      if (!checked) setCrewPin("")
                    }}
                  />
                </div>

                {isCrewPinEnabled && (
                  <div className="space-y-2 pl-8">
                    <Label htmlFor="crewPin">Enter Crew PIN (stream credentials)</Label>
                    <Input
                      id="crewPin"
                      type="password"
                      inputMode="numeric"
                      value={crewPin}
                      onChange={(e) => setCrewPin(e.target.value)}
                      placeholder="Enter 4–8 digit PIN"
                      maxLength={12}
                      className="max-w-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      If set, RTMP URL and stream key are hidden on the watch page and only visible after entering this PIN on the crew page.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            </Tabs>
          </div>

          <div className="fixed sm:static bottom-0 left-0 right-0 p-4 sm:p-0 bg-background border-t sm:border-t-0 sm:bg-transparent z-50 shrink-0">
            <DialogFooter className="flex flex-row sm:flex-row gap-2 px-4 sm:px-0 py-2 sm:py-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  (slugStatus as string) === "checking" ||
                  slugStatus === "taken" ||
                  slugStatus === "invalid" ||
                  (slugTouched && slugStatus === "checking") ||
                  creditsPreventSubmit
                }
                title={
                  creditsPreventSubmit
                    ? "Add credits or change validity or stream type to continue."
                    : undefined
                }
                className="flex-1 sm:flex-none"
              >
                {slugStatus === "checking" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Event"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
