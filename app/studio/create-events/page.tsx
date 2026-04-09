"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"
import { EventCalendar } from "@/components/calendar/event-calendar"
import { FullCalendar, type CalendarEvent } from "@/components/calendar/full-calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Video,
  Youtube,
  MonitorPlay,
  Globe,
  Clock,
  Eye,
  Plus,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { studioSubscriptionExpiredForEvents } from "@/lib/studio-subscription-shared"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const streamTypeDisplayNames: Record<string, string> = {
  rtmp: "RTMP Server",
  youtube_api: "YouTube Live API",
  youtube_embed: "YouTube Embed",
  third_party: "Third Party Embed",
}

const statusFilters = [
  { id: "live", label: "Live", color: "bg-red-500" },
  { id: "scheduled", label: "Scheduled", color: "bg-blue-500" },
  { id: "completed", label: "Completed", color: "bg-emerald-500" },
]

export default function StudioCalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    live: true,
    scheduled: true,
    completed: true
  })

  const { data: eventsData, isLoading: isLoadingEvents } = useSWR(user ? "/api/events" : null, fetcher)
  
  const relevantEvents = useMemo(() => {
    return (eventsData?.events || []) as unknown as CalendarEvent[]
  }, [eventsData])

  const filteredEvents = useMemo(() => {
    return relevantEvents.filter((event) => {
       const status = event.status.toLowerCase()
       return activeFilters[status] ?? true
    })
  }, [relevantEvents, activeFilters])

  const studioSubExpired =
    user?.role === "studio" && studioSubscriptionExpiredForEvents(user?.studioSubscriptionExpiresAt)

  const toggleFilter = (id: string, checked: boolean) => {
    setActiveFilters(prev => ({ ...prev, [id]: checked }))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      live: { label: "Live", className: "bg-red-500 hover:bg-red-600 text-white" },
      scheduled: { label: "Scheduled", className: "bg-blue-500 hover:bg-blue-600 text-white" },
      completed: { label: "Completed", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
      cancelled: { label: "Cancelled", className: "bg-muted-foreground hover:bg-muted-foreground/80 text-white" },
    }
    const config = statusConfig[status.toLowerCase()] || { label: status, className: "bg-primary text-white" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getStreamIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "rtmp": return <Video className="h-4 w-4" />
      case "youtube_api": return <Youtube className="h-4 w-4" />
      case "youtube_embed": return <MonitorPlay className="h-4 w-4" />
      default: return <Globe className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events Calendar</h1>
          <p className="text-muted-foreground font-medium">Manage your studio streaming schedule</p>
        </div>
      </div>

      {studioSubExpired && (
        <Alert variant="destructive">
          <AlertTitle>Studio subscription expired</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            Renew your annual plan to create or edit events.
            <Button variant="outline" size="sm" className="bg-transparent border-white/30" asChild>
              <Link href="/studio/settings">Renew in Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col lg:flex-row gap-6 items-start h-full min-h-[700px]">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          {studioSubExpired ? (
            <Button className="w-full shadow-sm" size="lg" disabled type="button">
              <Plus className="mr-2 h-5 w-5" />
              Create Event
            </Button>
          ) : (
            <Button className="w-full shadow-sm" size="lg" asChild>
              <Link href="/studio/control-center/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Event
              </Link>
            </Button>
          )}

          <Card className="border-border shadow-sm">
            <CardContent className="p-3">
              <EventCalendar 
                mode="single" 
                selected={currentDate} 
                onSelect={(d) => d && setCurrentDate(d)} 
                events={relevantEvents}
                className="border-0 shadow-none ring-0 w-full"
              />
            </CardContent>
          </Card>

          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filters</h3>
                <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {filteredEvents.length} / {relevantEvents.length} Total
                </span>
            </div>
            <div className="space-y-3">
              {statusFilters.map(filter => {
                const count = relevantEvents.filter(e => e.status.toLowerCase() === filter.id).length;
                return (
                  <div key={filter.id} className="flex items-center space-x-3">
                    <Checkbox 
                      id={`filter-${filter.id}`} 
                      checked={activeFilters[filter.id]}
                      onCheckedChange={(checked) => toggleFilter(filter.id, checked === true)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                       <div className={`w-3 h-3 rounded-full ${filter.color}`} />
                       <label 
                          htmlFor={`filter-${filter.id}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                       >
                         {filter.label}
                       </label>
                       <span className="text-xs text-muted-foreground">{count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Calendar Grid */}
        <div className="flex-1 w-full min-w-0 h-full">
            {isLoadingEvents ? (
               <div className="flex items-center justify-center h-[600px] bg-card border border-border rounded-xl">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
               </div>
            ) : (
               <FullCalendar 
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
                  events={filteredEvents}
                  onEventClick={setSelectedEvent}
               />
            )}
        </div>
      </div>

      {/* Event Details Overlay */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent side="right" className="w-[400px] sm:max-w-[400px] p-0 flex flex-col border-l border-border bg-card">
          {selectedEvent && (
            <>
              <div className="bg-muted/30 p-6 border-b border-border">
                  <div className="flex justify-between items-start mb-4 gap-4">
                      {getStatusBadge(selectedEvent.status)}
                      <span className="text-xs font-mono text-muted-foreground bg-background px-2 py-1 rounded border border-border">
                          ID: {selectedEvent.id.substring(0, 8)}
                      </span>
                  </div>
                  <SheetTitle className="text-2xl font-bold mb-2 pr-6 leading-tight text-foreground">
                      {selectedEvent.title}
                  </SheetTitle>
                  <SheetDescription className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      {format(new Date(selectedEvent.scheduledAt || selectedEvent.createdAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                  </SheetDescription>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Stream Details</h4>
                      <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              {getStreamIcon(selectedEvent.streamType)}
                          </div>
                          <div>
                              <p className="font-medium text-foreground">{streamTypeDisplayNames[selectedEvent.streamType] || selectedEvent.streamType}</p>
                              <p className="text-xs text-muted-foreground">Stream Type</p>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-lg border border-border bg-muted/20 p-3">
                              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                  <Eye className="w-3 h-3 text-primary" />
                                  <span className="text-xs">Current Viewers</span>
                              </div>
                              <p className="text-lg font-semibold text-foreground">{/*@ts-ignore*/}{selectedEvent.currentViewers || 0}</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="p-4 border-t border-border bg-muted/10">
                  <Button className="w-full" asChild>
                      <Link href={`/${user?.role === 'studio' ? 'studio' : 'streamer'}/control-center/${selectedEvent.id}`}>
                          View Full Event Dashboard
                      </Link>
                  </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
