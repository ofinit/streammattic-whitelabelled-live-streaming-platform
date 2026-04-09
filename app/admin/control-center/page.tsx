"use client"

import { useState, useEffect, useRef } from "react"
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
  AlertDialogAction,
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
  StopCircle,
  PauseCircle,
  PlayCircle,
  Loader2,
  Film,
  ShieldCheck,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import type { LiveEvent, StreamType } from "@/lib/types"
import { formatEventScheduledDisplay } from "@/lib/utils"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())
const EVENTS_PAGE_SIZE = 20

export default function AdminEventsPage() {
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

  const [deleteEvent, setDeleteEvent] = useState<Record<string, unknown> | null>(null)
  const [copiedField, setCopiedField] = useState<"rtmp" | "key" | null>(null)
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [eventsLimit, setEventsLimit] = useState(EVENTS_PAGE_SIZE)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const [isFixingValidity, setIsFixingValidity] = useState(false)

  const handleFixValidity = async () => {
    setIsFixingValidity(true)
    try {
      const res = await fetch("/api/admin/maintenance/fix-validity", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        mutate() // Refresh event list
      } else {
        toast.error(data.error || "Failed to fix validity dates")
      }
    } catch (err) {
      toast.error("An error occurred while fixing validity dates")
    } finally {
      setIsFixingValidity(false)
    }
  }

  const copyToClipboard = (text: string, field: "rtmp" | "key") => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const { data, isLoading, mutate } = useSWR(
    `/api/admin/events${searchQuery ? `?search=${searchQuery}` : ""}`,
    fetcher,
    { refreshInterval: 15000 }
  )

  const events = data?.events ?? []
  const totalCount = events.length
  
  const liveEvents = events.filter((e: Record<string, unknown>) => e.status === "live" || e.status === "on_break")
  const scheduledEvents = events.filter((e: Record<string, unknown>) => e.status === "scheduled")
  const completedEvents = events.filter((e: Record<string, unknown>) => e.status === "completed" || e.status === "ended")

  const liveCount = liveEvents.length
  const scheduledCount = scheduledEvents.length
  const completedCount = completedEvents.length
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

  const totalViewers = liveEvents.reduce((acc: number, e: Record<string, unknown>) => acc + (Number(e.viewers) || 0), 0)

  const handleCreateEvent = () => {
    setEditingEvent(undefined)
    setEventDialogInitialTab(undefined)
    setEventDialogInitialStreamType(undefined)
    setEventDialogInitialDraft(undefined)
    setShowEventDialog(true)
  }

  const handleEditEvent = (event: Record<string, unknown>) => {
    setEditingEvent(event as unknown as LiveEvent)
    setEventDialogInitialTab(undefined)
    setEventDialogInitialStreamType(undefined)
    setEventDialogInitialDraft(undefined)
    setShowEventDialog(true)
  }

  const [streamCredentials, setStreamCredentials] = useState<{
    rtmpUrl: string
    streamKey: string
    eventTitle: string
    isYoutubeApi?: boolean
  } | null>(null)
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
        const resData = await res.json()
        if (!res.ok) {
          if (res.status === 409 && resData.error) {
            setSaveError({ slug: resData.error })
            toast.error(resData.error)
          } else {
            toast.error(resData.error || "Failed to update event")
          }
          return
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
        if (showCredentials && (eventData as any).streamType === "youtube_api") {
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
        } else {
          toast.success("Event created successfully!")
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
  }

  const handleDeleteEvent = async () => {
    if (!deleteEvent) return
    try {
      const res = await fetch(`/api/studio/events?id=${deleteEvent.id}`, { method: "DELETE" })
      const resData = await res.json()
      if (!res.ok) {
        toast.error(resData.error || "Failed to delete event")
        return
      }
      toast.success("Event deleted")
      setDeleteEvent(null)
      mutate()
    } catch {
      toast.error("Failed to delete event")
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

  const renderEventCard = (event: Record<string, unknown>) => (
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
                    <span className="font-bold text-sm truncate max-w-[140px] uppercase tracking-tighter">{event.title as string}</span>
                    <Badge
                        variant={event.status === "live" ? "destructive" : event.status === "scheduled" ? "default" : "secondary"}
                        className={`text-[9px] px-1 py-0 h-3.5 shrink-0 font-bold uppercase ${event.status === "on_break" ? "bg-orange-500 text-white border-0" : ""}`}
                    >
                        {event.status === "ended" ? "ended" : event.status === "on_break" ? "BRB" : (event.status as string)}
                    </Badge>
                </div>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-primary/80 font-semibold truncate leading-none">
                        {(event as any).userName || 'Unknown'} ({(event as any).userRole || 'user'})
                    </span>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                            <Eye className="h-2.5 w-2.5" />
                            {Number((event as any).viewers) || 0}
                        </span>
                        {Boolean(event.scheduledAt || event.scheduledStart) && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {formatEventScheduledDisplay(
                                    (event.scheduledAt || event.scheduledStart) as string,
                                    (event.timezone as string) || undefined,
                                    true // use short format
                                )}
                            </span>
                        )}
                        {(event as any).validityExpiresAt && (() => {
                            const daysRemaining = Math.ceil((new Date((event as any).validityExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            return (
                                <span className="flex items-center gap-1 text-orange-500/80">
                                    <ShieldCheck className="h-2.5 w-2.5" />
                                    {new Date((event as any).validityExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    <span>({daysRemaining > 0 ? `-${daysRemaining}` : daysRemaining})</span>
                                </span>
                            );
                        })()}
                    </div>
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
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0 border-primary/30 text-primary/80 bg-primary/5 font-medium">
            {(event as any).userRole === 'studio' ? 'Studio' : 'Streamer'}: {(event as any).userName || 'Unknown'}
          </Badge>
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
          {(event as any).hasCrewPin && (
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
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {Number((event as any).viewers) || 0}
        </span>
        {Boolean(event.scheduledAt || event.scheduledStart) && (
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
        {(event as any).validityExpiresAt && (() => {
           const daysRemaining = Math.ceil((new Date((event as any).validityExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
           return (
             <span
               className="flex items-center gap-1 text-orange-500/80 shrink-0"
               title={`Validity expires on: ${new Date((event as any).validityExpiresAt).toLocaleString()}`}
             >
               <ShieldCheck className="h-3 w-3" />
               <span>
                 Exp: {new Date((event as any).validityExpiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                 <span className="ml-1">({daysRemaining > 0 ? `-${daysRemaining}` : daysRemaining})</span>
               </span>
             </span>
           );
         })()}
      </div>


      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
        {(event.status === "scheduled" || event.status === "draft") && (
            <Button size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={() => handleGoLive(event)}>
            <Play className="h-3 w-3" />
            Go Live
            </Button>
        )}
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
        {event.status === "live" && (
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
        {(event.status === "live" || event.status === "on_break") && (
            <Button size="sm" variant="destructive" className="h-7 text-xs gap-1 shrink-0" onClick={() => handleForceStop(event)}>
            <Square className="h-3 w-3" />
            Stop
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
            {(event.status === "live" || event.status === "on_break") && (
                <DropdownMenuItem onClick={() => handleForceStop(event)} className="text-destructive">
                <StopCircle className="h-4 w-4 mr-2" />
                Force Stop
                </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteEvent(event)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Control Center</h1>
          <p className="text-muted-foreground">Create and manage events (admin — credits not required)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFixValidity}
            disabled={isFixingValidity}
            className="h-9 hidden lg:flex gap-2 border-orange-500/20 hover:bg-orange-500/5 text-orange-500/80"
            title="Align old mock events with current validity standards"
          >
            <ShieldCheck className="h-4 w-4" />
            {isFixingValidity ? "Fixing..." : "Update Older Events"}
          </Button>
          <Button onClick={handleCreateEvent} className="h-9 gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Create Event</span>
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
                <p className="text-xl font-bold">{events.length}</p>
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
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={handleCreateEvent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
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
        youtubeOwnerType="admin"
        skipCreditsValidation={
          user?.role === "admin" && (!editingEvent || editingEvent.userId === user?.id)
        }
        creditsUserId={
          editingEvent && editingEvent.userId !== user?.id ? editingEvent.userId : undefined
        }
        externalSlugError={saveError?.slug ?? undefined}
      />

      <AlertDialog open={!!deleteEvent} onOpenChange={() => setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteEvent?.title as string}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
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
