"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Video,
  Calendar,
  CheckCircle,
  Eye,
  Clock,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  EyeOff,
  Youtube,
  Globe,
  Play,
  Square,
  PauseCircle,
  PlayCircle,
  Loader2,
  Film,
  StopCircle,
  Sparkles,
  Ban,
  CheckCircle2,
  ClipboardList,
  BarChart3,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { toastEventAnalyticsUrl } from "@/lib/toast-event-analytics-url"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import type { LiveEvent, StreamType } from "@/lib/types"
import { getEventPhotographerName } from "@/lib/event-photographer"
import { formatEventScheduledDisplay } from "@/lib/utils"
import { toast } from "sonner"
import { isSampleEvent } from "@/lib/event-sample"

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const EVENTS_PAGE_SIZE = 20

export default function StreamerEventsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const ownerId = user?.id || ""

  const [searchQuery, setSearchQuery] = useState("")
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LiveEvent | undefined>()
  const [eventDialogInitialTab, setEventDialogInitialTab] = useState<string | undefined>()
  const [eventDialogInitialStreamType, setEventDialogInitialStreamType] = useState<StreamType | undefined>()
  const [eventDialogInitialDraft, setEventDialogInitialDraft] = useState<{
    title?: string
    slug?: string
    scheduledAt?: string
    timezone?: string
  } | undefined>()

  // Open dialog when arriving from /streamer/control-center/new (optional tab=details|stream|template|settings)
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("openModal") === "1") {
      const url = new URL(window.location.href)
      url.searchParams.delete("openModal")
      const tabParam = params.get("tab")
      url.searchParams.delete("tab")
      window.history.replaceState({}, "", url.toString())
      const validTabs = ["details", "stream", "template", "settings"] as const
      const initialTab =
        tabParam && (validTabs as readonly string[]).includes(tabParam)
          ? tabParam
          : undefined
      setEditingEvent(undefined)
      setEventDialogInitialTab(initialTab)
      setEventDialogInitialStreamType(undefined)
      setEventDialogInitialDraft(undefined)
      setShowEventDialog(true)
    }
  }, [])

  // Restore event modal after YouTube OAuth redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ytConnected = params.get("yt_connected")
    const ytError = params.get("yt_error")
    const saved = sessionStorage.getItem("yt_oauth_pending")

    if ((ytConnected || ytError) && saved) {
      try {
        const { openModal, tab, streamType } = JSON.parse(saved)
        sessionStorage.removeItem("yt_oauth_pending")

        const draftRaw = sessionStorage.getItem("yt_oauth_draft_event")
        if (draftRaw) {
          try {
            const draft = JSON.parse(draftRaw) as {
              title?: string
              slug?: string
              scheduledAt?: string
              timezone?: string
            }
            setEventDialogInitialDraft(draft)
          } catch {
            // ignore
          } finally {
            sessionStorage.removeItem("yt_oauth_draft_event")
          }
        }

        const url = new URL(window.location.href)
        url.searchParams.delete("yt_connected")
        url.searchParams.delete("yt_error")
        window.history.replaceState({}, "", url.toString())

        if (ytConnected) toast.success(`YouTube channel "${ytConnected}" connected!`)
        if (ytError) toast.error(ytError)

        if (openModal) {
          setEditingEvent(undefined)
          setEventDialogInitialTab(tab ?? "stream")
          if (streamType) setEventDialogInitialStreamType(streamType as StreamType)
          setShowEventDialog(true)
        }
      } catch {
        sessionStorage.removeItem("yt_oauth_pending")
      }
    }
  }, [])

  const [copiedField, setCopiedField] = useState<"rtmp" | "key" | null>(null)
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [eventsLimit, setEventsLimit] = useState(EVENTS_PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const eventDeepLinkHandledRef = useRef<string | null>(null)

  const copyToClipboard = (text: string, field: "rtmp" | "key") => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const { data, isLoading, mutate } = useSWR(
    ownerId
      ? `/api/studio/events?studioId=${ownerId}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}&limit=${eventsLimit}&offset=0`
      : null,
    fetcher,
    { refreshInterval: 15000 }
  )

  const events = data?.events ?? []
  const sampleEventCount = useMemo(
    () => events.filter((e: Record<string, unknown>) => isSampleEvent(e as { isMock?: boolean; title?: string })).length,
    [events],
  )
  const totalCount = data?.totalCount ?? 0
  const liveCount = data?.liveCount ?? 0
  const scheduledCount = data?.scheduledCount ?? 0
  const completedCount = data?.completedCount ?? 0
  const hasMoreEvents = events.length < totalCount

  useEffect(() => {
    setEventsLimit(EVENTS_PAGE_SIZE)
  }, [searchQuery])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry.isIntersecting) return
        if (isLoading) return
        if (!hasMoreEvents) return
        setEventsLimit((prev) => prev + EVENTS_PAGE_SIZE)
      },
      { rootMargin: "300px 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMoreEvents, isLoading, events.length])

  const liveEvents = events.filter((e: Record<string, unknown>) => e.status === "live" || e.status === "on_break")
  const scheduledEvents = events.filter((e: Record<string, unknown>) => e.status === "scheduled")
  const completedEvents = events.filter((e: Record<string, unknown>) => e.status === "completed" || e.status === "ended")

  const totalViewers = liveEvents.reduce((acc: number, e: Record<string, unknown>) => acc + (Number(e.currentViewers) || 0), 0)

  const handleCreateEvent = () => {
    setEditingEvent(undefined)
    setEventDialogInitialTab(undefined)
    setEventDialogInitialStreamType(undefined)
    setEventDialogInitialDraft(undefined)
    setShowEventDialog(true)
  }

  const handleSeedMockTemplates = async () => {
    setSeedMockLoading(true)
    try {
      const res = await fetch(`/api/studio/events/seed-mock?studioId=${encodeURIComponent(ownerId)}`, {
        method: "POST",
        credentials: "include",
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; count?: number }
      if (!res.ok) {
        toast.error(data.error || "Could not create sample events")
        return
      }
      toast.success(
        data.count != null
          ? `Created ${data.count} sample events — one per template. Edit any event to add a stream type.`
          : "Sample events created.",
      )
      await mutate()
    } catch {
      toast.error("Could not create sample events")
    } finally {
      setSeedMockLoading(false)
    }
  }

  const [clearMockLoading, setClearMockLoading] = useState(false)
  const [clearMockOpen, setClearMockOpen] = useState(false)

  const handleClearMockTemplates = async () => {
    setClearMockLoading(true)
    try {
      const res = await fetch(`/api/studio/events/seed-mock?studioId=${encodeURIComponent(ownerId)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; deleted?: number }
      if (!res.ok) {
        toast.error(data.error || "Could not remove sample events")
        return
      }
      toast.success(
        data.deleted != null && data.deleted > 0
          ? `Removed ${data.deleted} sample event${data.deleted === 1 ? "" : "s"}.`
          : "No sample events to remove.",
      )
      setClearMockOpen(false)
      await mutate()
    } catch {
      toast.error("Could not remove sample events")
    } finally {
      setClearMockLoading(false)
    }
  }

  const handleEditEvent = (event: Record<string, unknown>) => {
    setEditingEvent(event as unknown as LiveEvent)
    setEventDialogInitialTab(undefined)
    setEventDialogInitialStreamType(undefined)
    setEventDialogInitialDraft(undefined)
    setShowEventDialog(true)
  }

  // Open edit dialog from ?event=<id> or /streamer/control-center/<id>
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!ownerId) return
    const params = new URLSearchParams(window.location.search)
    const eventId = params.get("event")
    if (!eventId) {
      eventDeepLinkHandledRef.current = null
      return
    }
    if (eventDeepLinkHandledRef.current === eventId) return
    if (isLoading) return

    const found = events.find((e: Record<string, unknown>) => e.id === eventId)
    if (found) {
      eventDeepLinkHandledRef.current = eventId
      setEditingEvent(found as unknown as LiveEvent)
      setEventDialogInitialTab(undefined)
      setEventDialogInitialStreamType(undefined)
      setEventDialogInitialDraft(undefined)
      setShowEventDialog(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("event")
      window.history.replaceState({}, "", url.toString())
      return
    }

    const totalCount = data?.totalCount ?? 0
    if (totalCount > events.length && eventsLimit < totalCount) {
      setEventsLimit(totalCount)
      return
    }

    eventDeepLinkHandledRef.current = eventId
    toast.error("Event not found.")
    const url = new URL(window.location.href)
    url.searchParams.delete("event")
    window.history.replaceState({}, "", url.toString())
  }, [isLoading, events, ownerId, data?.totalCount, eventsLimit])

  const [streamCredentials, setStreamCredentials] = useState<{
    rtmpUrl: string
    streamKey: string
    eventTitle: string
    isYoutubeApi?: boolean
  } | null>(null)
  const [seedMockLoading, setSeedMockLoading] = useState(false)
  const [isBroadcastCreating, setIsBroadcastCreating] = useState(false)
  const [saveError, setSaveError] = useState<{ slug?: string } | null>(null)

  const handleSaveEvent = async (eventData: Partial<LiveEvent>, showCredentials?: boolean) => {
    try {
      setSaveError(null)
      if (editingEvent?.id) {
        const res = await fetch("/api/studio/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingEvent.id, ...eventData }),
        })
        const resData = (await res.json()) as { event?: LiveEvent; error?: string }
        if (!res.ok) {
          if (res.status === 409 && resData.error) {
            setSaveError({ slug: resData.error })
            toast.error(resData.error)
          } else {
            toast.error(resData.error || "Failed to update event")
          }
          return
        }
        if (resData.event) {
          setEditingEvent(resData.event)
        }
        toast.success("Event updated")
        mutate()
        setShowEventDialog(false)
      } else {
        const res = await fetch("/api/studio/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        })
        const resData = await res.json()
        if (!res.ok) {
          if (res.status === 409 && resData.error) {
            setSaveError({ slug: resData.error })
            toast.error(resData.error)
          } else {
            toast.error(resData.error || "Failed to create event")
          }
          return
        }
        mutate()
        setShowEventDialog(false)
        const createdEv = resData.event as { slug?: string | null; id?: string } | undefined
        const slugOrId = createdEv?.slug?.trim() || createdEv?.id
        if (slugOrId) toastEventAnalyticsUrl(String(slugOrId))
        if (showCredentials && eventData.streamType === "youtube_api") {
          const channelId = (eventData as Record<string, unknown>).youtubeChannelId as string | undefined
          const bSettings = (eventData as Record<string, unknown>).youtubeBroadcastSettings as Record<string, unknown> | undefined
          if (channelId && resData.event?.id) {
            setIsBroadcastCreating(true)
            try {
              const broadcastRes = await fetch("/api/stream/youtube", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "create",
                  channelDbId: channelId,
                  eventId: resData.event.id,
                  title: resData.event.title,
                  description: resData.event.description || "",
                  scheduledStartTime: resData.event.scheduledAt,
                  privacyStatus: bSettings?.privacyStatus ?? "public",
                  enableDvr: bSettings?.enableDvr ?? true,
                  enableAutoStart: bSettings?.enableAutoStart ?? true,
                  enableAutoStop: bSettings?.enableAutoStop ?? true,
                }),
              })
              const broadcastData = await broadcastRes.json()
              if (broadcastRes.ok && broadcastData.broadcast?.rtmpUrl) {
                setStreamCredentials({
                  rtmpUrl: broadcastData.broadcast.rtmpUrl,
                  streamKey: broadcastData.broadcast.streamKey,
                  eventTitle: resData.event.title,
                  isYoutubeApi: true,
                })
              } else {
                toast.error("Event created, but YouTube broadcast setup failed. Edit the event to create the broadcast and get your ingest credentials.")
              }
            } catch {
              toast.error("Event created, but YouTube broadcast could not be created. Edit the event to retry.")
            } finally {
              setIsBroadcastCreating(false)
            }
          } else {
            toast.success("Event created! Open the edit dialog, select a YouTube channel, and click Create Broadcast to get your ingest URL and stream key.")
          }
        } else if (showCredentials && resData.event?.streamKey) {
          setStreamCredentials({
            rtmpUrl: resData.event.rtmpUrl || "rtmp://stream.streamlivee.com/live",
            streamKey: resData.event.streamKey,
            eventTitle: resData.event.title,
          })
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
  }

  const handleToggleSuspend = async (ev: Record<string, unknown>, suspended: boolean) => {
    const eventId = typeof ev.id === "string" ? ev.id : String(ev.id ?? "")
    if (!eventId) {
      toast.error("Missing event id")
      return
    }
    try {
      const res = await fetch("/api/studio/events/suspend", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId, suspended }),
      })
      const resData = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(resData.error || "Failed to update event")
        return
      }
      toast.success(
        suspended
          ? "Event suspended — visitors only see an unavailable message on the public page."
          : "Event unsuspended — the public page is available again.",
      )
      mutate()
    } catch {
      toast.error("Failed to update event")
    }
  }

  const handleForceStop = async (event: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/studio/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, status: "ended" }),
      })
      if (!res.ok) {
        toast.error("Failed to stop event")
        return
      }
      toast.success("Event stopped")
      mutate()
    } catch {
      toast.error("Failed to stop event")
    }
  }

  const handleBreak = async (event: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/studio/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, status: "on_break" }),
      })
      if (!res.ok) { toast.error("Failed to take a break"); return }
      toast.success("Stream is on break")
      mutate()
    } catch {
      toast.error("Failed to take a break")
    }
  }

  const handleToggleRecording = async (event: Record<string, unknown>) => {
    const next = !event.showRecording
    try {
      const res = await fetch("/api/studio/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, showRecording: next }),
      })
      if (!res.ok) { toast.error("Failed to update recording setting"); return }
      toast.success(next ? "Recording visible to viewers" : "Recording hidden from viewers")
      mutate()
    } catch {
      toast.error("Failed to update recording setting")
    }
  }

  const handleGoLive = async (event: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/studio/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, status: "live" }),
      })
      if (!res.ok) {
        toast.error("Failed to go live")
        return
      }
      toast.success("Event is now live!")
      mutate()
    } catch {
      toast.error("Failed to go live")
    }
  }

  const handleResumeEvent = async (event: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/studio/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event.id, status: "live" }),
      })
      if (!res.ok) {
        toast.error("Failed to resume")
        return
      }
      toast.success("Stream resumed!")
      mutate()
    } catch {
      toast.error("Failed to resume")
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case "live":
        return "bg-red-500 animate-pulse"
      case "on_break":
        return "bg-orange-400 animate-pulse"
      case "scheduled":
        return "bg-blue-500"
      case "completed":
      case "ended":
        return "bg-green-600"
      default:
        return "bg-muted-foreground"
    }
  }

  const getStreamIcon = (streamType: string) => {
    switch (streamType) {
      case "youtube_embed":
      case "youtube_api":
      case "youtube":
        return <Youtube className="h-4 w-4 text-red-400" />
      case "third_party":
      case "embedded":
        return <Globe className="h-4 w-4 text-blue-400" />
      default:
        return <Video className="h-4 w-4 text-primary" />
    }
  }

  const getThumbnailBg = (streamType: string) => {
    switch (streamType) {
      case "youtube_embed":
      case "youtube_api":
      case "youtube":
        return "bg-red-950/60"
      case "third_party":
      case "embedded":
        return "bg-blue-950/60"
      default:
        return "bg-primary/10"
    }
  }

  const getEventPublicUrl = (event: Record<string, unknown>) => {
    const path = `/${(event.slug as string) || event.id}`
    if (typeof window !== "undefined") {
      return `${window.location.origin}${path}`
    }
    return path
  }

  const renderEventCard = (event: any) => {
    const sample = isSampleEvent(event as { isMock?: boolean; title?: string })
    const isSuspended = event.isSuspended === true
    const photographerName = getEventPhotographerName(event)
    return (
    <div
      key={event.id as string}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 gap-y-3 px-4 py-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors group"
    >
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div
          className={`relative h-10 w-14 rounded flex-shrink-0 flex items-center justify-center overflow-hidden ${getThumbnailBg(event.streamType as string)}`}
        >
          {event.thumbnailUrl ? (
            <img src={event.thumbnailUrl as string} alt="" className="h-full w-full object-cover" />
          ) : (
            getStreamIcon(event.streamType as string)
          )}
          {event.status === "live" && (
            <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold bg-red-600 text-white px-0.5 rounded-sm leading-tight">
              LIVE
            </span>
          )}
          {event.status === "on_break" && (
            <span className="absolute bottom-0.5 left-0.5 text-[8px] font-bold bg-orange-500 text-white px-0.5 rounded-sm leading-tight">
              BRB
            </span>
          )}
        </div>
        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${getStatusDot(event.status as string)}`} />
        
        <div className="flex-1 min-w-0 sm:hidden">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate max-w-[150px] uppercase tracking-tighter">{event.title as string}</span>
                    <Badge
                        variant={event.status === "live" ? "destructive" : event.status === "scheduled" ? "default" : "secondary"}
                        className={`text-[9px] px-1 py-0 h-3.5 shrink-0 font-bold uppercase ${event.status === "on_break" ? "bg-orange-500 text-white border-0" : ""}`}
                    >
                        {event.status === "ended" ? "ended" : event.status === "on_break" ? "BRB" : (event.status as string)}
                    </Badge>
                    {sample && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-3.5 shrink-0 border-amber-500/60 text-amber-800 dark:text-amber-200 bg-amber-500/10"
                      >
                        Sample
                      </Badge>
                    )}
                    {isSuspended && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-3.5 shrink-0 border-muted-foreground/50 text-muted-foreground"
                      >
                        Suspended
                      </Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                    {photographerName && (
                        <span className="truncate">
                            Photographer: {photographerName}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Eye className="h-2.5 w-2.5 text-primary/70" />
                        {Number((event as any).viewers) || 0}
                    </span>
                    {Boolean(event.scheduledAt || event.scheduledStart) && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-primary/70" />
                            {formatEventScheduledDisplay(
                                (event.scheduledAt || event.scheduledStart) as string,
                                (event.timezone as string) || undefined,
                                true // use short format
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 hidden sm:block">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{event.title as string}</span>
          <Badge
            variant={event.status === "live" ? "destructive" : event.status === "scheduled" ? "default" : "secondary"}
            className={`text-[10px] px-1.5 py-0 h-4 shrink-0 ${event.status === "on_break" ? "bg-orange-500 text-white border-0" : ""}`}
          >
            {event.status === "ended"
               ? "completed"
               : event.status === "on_break"
                 ? "on break"
                 : (event.status as string)}
           </Badge>
           {event.templateData?.category && (
             <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-primary/30 text-primary/80 bg-primary/5">
               {event.templateData.category as string}
             </Badge>
           )}
           {photographerName && (
             <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-muted-foreground/25 text-muted-foreground bg-muted/30">
               Photographer: {photographerName}
             </Badge>
           )}
           {sample && (
             <Badge
               variant="outline"
               className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-amber-500/60 text-amber-800 dark:text-amber-200 bg-amber-500/10"
             >
               Sample
             </Badge>
           )}
           {isSuspended && (
             <Badge
               variant="outline"
               className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-muted-foreground/50 text-muted-foreground"
             >
               Suspended
             </Badge>
           )}
         </div>
        <div className="flex flex-col gap-0.5 mt-0.5">
          <a
            href={getEventPublicUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/90 hover:text-primary hover:underline truncate font-mono"
            title={getEventPublicUrl(event)}
          >
            {getEventPublicUrl(event)}
          </a>
          {event.hasCrewPin && (
            <a
              href={`${getEventPublicUrl(event)}/crew`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-primary/60 hover:text-primary hover:underline truncate font-mono"
              title={`${getEventPublicUrl(event)}/crew`}
            >
              {getEventPublicUrl(event)}/crew
            </a>
          )}
          <a
            href={`${getEventPublicUrl(event)}/analytics`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground/75 hover:text-primary hover:underline truncate font-mono"
            title={`${getEventPublicUrl(event)}/analytics`}
          >
            {getEventPublicUrl(event)}/analytics
          </a>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {Number(event.currentViewers) || 0}
        </span>
        {(event.scheduledAt || event.scheduledStart) && (
          <span
            className="flex max-w-[min(100%,15rem)] items-center gap-1 truncate"
            title={formatEventScheduledDisplay(
              (event.scheduledAt || event.scheduledStart) as string,
              (event.timezone as string) || undefined,
            )}
          >
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {formatEventScheduledDisplay(
                (event.scheduledAt || event.scheduledStart) as string,
                (event.timezone as string) || undefined,
                true
              )}
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
        {event.status === "on_break" && (
            <Button
            size="sm"
            className="h-7 text-xs gap-1 shrink-0 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => handleResumeEvent(event)}
            >
            <PlayCircle className="h-3 w-3" />
            Resume
            </Button>
        )}
        {(event.status === "live" || event.status === "scheduled" || event.status === "draft") && (
            <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 shrink-0 border-orange-500 text-orange-400 hover:bg-orange-500/10"
            onClick={() => handleBreak(event)}
            >
            <PauseCircle className="h-3 w-3" />
            Break
            </Button>
        )}
        {(event.status === "completed" || event.status === "ended") && (
            <Button
            size="sm"
            variant="outline"
            className={`h-7 text-xs gap-1 shrink-0 ${event.showRecording ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
            onClick={() => handleToggleRecording(event)}
            title={event.showRecording ? "Hide recording from viewers" : "Show recording to viewers"}
            >
            <Film className="h-3 w-3" />
            {event.showRecording ? "Recording On" : "Show Recording"}
            </Button>
        )}

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
            </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`/${(event.slug as string) || event.id}`, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Event
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Event
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/streamer/event-visitors?eventId=${encodeURIComponent(String(event.id))}`,
                )
              }
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Visitor registrations
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                router.push(
                  `/${encodeURIComponent(String((event.slug as string) || event.id))}/analytics`,
                )
              }
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </DropdownMenuItem>
            {event.status === "live" && (
                <DropdownMenuItem onClick={() => handleBreak(event)}>
                <PauseCircle className="h-4 w-4 mr-2 text-orange-400" />
                Take a Break
                </DropdownMenuItem>
            )}
            {event.status === "on_break" && (
                <DropdownMenuItem onClick={() => handleResumeEvent(event)}>
                <PlayCircle className="h-4 w-4 mr-2 text-green-500" />
                Resume Stream
                </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {event.isSuspended === true ? (
              <DropdownMenuItem onClick={() => void handleToggleSuspend(event, false)}>
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                Unsuspend event
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => void handleToggleSuspend(event, true)}>
                <Ban className="h-4 w-4 mr-2 text-amber-600" />
                Suspend event
              </DropdownMenuItem>
            )}
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Control Center</h1>
          <p className="text-muted-foreground">Manage and control your live streaming events</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          {sampleEventCount > 0 && (
            <Button
              variant="outline"
              className="w-full sm:w-auto border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-500/10"
              onClick={() => setClearMockOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove sample events ({sampleEventCount})
            </Button>
          )}
          <Button onClick={handleCreateEvent} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-3 bg-muted/20 border-border/50">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-6 w-10" />
            </Card>
          ))
        ) : (
          <>
            <Card className="p-3 bg-muted/20 border-border/50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Live Now</p>
                <Video className="h-3 w-3 text-red-500" />
              </div>
              <div className="mt-1">
                <p className="text-xl font-bold">{liveCount}</p>
                <p className="text-[10px] text-muted-foreground">{totalViewers} total</p>
              </div>
            </Card>
            <Card className="p-3 bg-muted/20 border-border/50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Scheduled</p>
                <Calendar className="h-3 w-3 text-blue-500" />
              </div>
              <div className="mt-1">
                <p className="text-xl font-bold">{scheduledCount}</p>
                <p className="text-[10px] text-muted-foreground">Upcoming</p>
              </div>
            </Card>
            <Card className="p-3 bg-muted/20 border-border/50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Completed</p>
                <CheckCircle className="h-3 w-3 text-emerald-500" />
              </div>
              <div className="mt-1">
                <p className="text-xl font-bold">{completedCount}</p>
                <p className="text-[10px] text-muted-foreground">This month</p>
              </div>
            </Card>
            <Card className="p-3 bg-muted/20 border-border/50">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Total Events</p>
                <Video className="h-3 w-3 text-primary" />
              </div>
              <div className="mt-1">
                <p className="text-xl font-bold">{totalCount}</p>
                <p className="text-[10px] text-muted-foreground">All time</p>
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <TabsList className="w-auto inline-flex whitespace-nowrap min-w-full sm:min-w-0">
            <TabsTrigger value="all" className="gap-2 shrink-0">
              All
              <span className="bg-muted px-2 py-0.5 rounded text-xs">{totalCount}</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2 shrink-0">
              <Video className="h-4 w-4" />
              Live
              <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs">{liveCount}</span>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2 shrink-0">
              <Calendar className="h-4 w-4" />
              Scheduled
              <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded text-xs">{scheduledCount}</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2 shrink-0">
              <CheckCircle className="h-4 w-4" />
              Completed
              <span className="bg-muted px-2 py-0.5 rounded text-xs">{completedCount}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {["all", "live", "scheduled", "completed"].map((tab) => {
          const tabEvents =
            tab === "all"
              ? events
              : tab === "live"
                ? liveEvents
                : tab === "scheduled"
                  ? scheduledEvents
                  : completedEvents

          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="space-y-4">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-card">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-72" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                ) : tabEvents.length > 0 ? (
                  tabEvents.map((event: Record<string, unknown>) => renderEventCard(event))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No {tab === "all" ? "" : tab} events found</p>
                    <div className="flex flex-col items-center gap-3 mt-6 max-w-md mx-auto">
                      {totalCount === 0 && (
                        <Button
                          variant="secondary"
                          className="w-full sm:w-auto"
                          onClick={() => void handleSeedMockTemplates()}
                          disabled={seedMockLoading}
                        >
                          {seedMockLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Generate sample events (all templates)
                        </Button>
                      )}
                      {totalCount === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Adds one scheduled sample per template so you can preview layouts. No stream credits used until you
                          pick a stream type.
                        </p>
                      )}
                      <Button variant="outline" className="bg-transparent" onClick={handleCreateEvent}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <div ref={loadMoreRef} className="h-6" />
      {hasMoreEvents && (
        <p className="text-xs text-muted-foreground text-center">Loading more events as you scroll...</p>
      )}

      <EventFormDialog
        key={
          editingEvent?.id
            ? `${editingEvent.id}-${Object.keys(editingEvent as unknown as Record<string, unknown>).length > 1 ? "full" : "stub"}`
            : "create"
        }
        open={showEventDialog}
        onOpenChange={(val) => {
          setShowEventDialog(val)
          if (!val) {
            setEventDialogInitialTab(undefined)
            setEventDialogInitialStreamType(undefined)
            setEventDialogInitialDraft(undefined)
            setSaveError(null)
          }
        }}
        event={editingEvent}
        onSave={handleSaveEvent}
        initialTab={eventDialogInitialTab}
        initialStreamType={eventDialogInitialStreamType}
        initialDraft={eventDialogInitialDraft}
        youtubeOwnerId={ownerId || undefined}
        youtubeOwnerType="streamer"
        externalSlugError={saveError?.slug ?? undefined}
      />

      <AlertDialog open={clearMockOpen} onOpenChange={setClearMockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove all sample events?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes every event created by &quot;Generate sample events&quot; (and matching legacy previews) for your
              account. Real events you created yourself are not removed unless they use the same sample title pattern.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearMockLoading}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={clearMockLoading}
              onClick={() => void handleClearMockTemplates()}
            >
              {clearMockLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove sample events"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* YouTube broadcast creation loading dialog */}
      <Dialog open={isBroadcastCreating} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-xs" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="sr-only">Creating YouTube Broadcast</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Creating YouTube broadcast…</p>
            <p className="text-xs text-muted-foreground text-center">Setting up your YouTube ingest URL and stream key.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!streamCredentials} onOpenChange={() => { setStreamCredentials(null); setShowStreamKey(false) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Check className="h-5 w-5" />
              Event Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <Alert className="border-primary/50 bg-primary/5">
              {streamCredentials?.isYoutubeApi ? <Youtube className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              <AlertTitle>Your Streaming Credentials</AlertTitle>
              <AlertDescription>
                {streamCredentials?.isYoutubeApi
                  ? "Use these YouTube ingest credentials in OBS or any RTMP encoder."
                  : "Use these in OBS, Wirecast, or any RTMP-compatible encoder."}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {streamCredentials?.isYoutubeApi ? "RTMP URL (FMS)" : "RTMP URL (Server)"}
                </Label>
                <div className="flex gap-2">
                  <Input value={streamCredentials?.rtmpUrl || ""} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(streamCredentials!.rtmpUrl, "rtmp")}
                  >
                    {copiedField === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Stream Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={streamCredentials?.streamKey || ""}
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
                    onClick={() => copyToClipboard(streamCredentials!.streamKey, "key")}
                  >
                    {copiedField === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2 p-3 rounded border bg-muted/30">
              <p className="font-medium text-sm">Quick Setup for OBS Studio</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open OBS Studio → Settings → Stream</li>
                <li>Set Service to &quot;Custom...&quot;</li>
                <li>Paste RTMP URL in &quot;Server&quot; field</li>
                <li>Paste Stream Key in &quot;Stream Key&quot; field</li>
                <li>Click &quot;Apply&quot; and start streaming!</li>
              </ol>
            </div>

            <Button className="w-full" onClick={() => { setStreamCredentials(null); setShowStreamKey(false) }}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
