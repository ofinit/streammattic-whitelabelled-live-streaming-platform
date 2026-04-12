"use client"

import * as React from "react"
import { useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { ChevronLeft, ChevronRight, Video, Youtube, MonitorPlay, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface CalendarEvent {
  id: string
  title: string
  scheduledAt: string
  createdAt: string
  status: string
  streamType: string
  totalViews?: number
}

interface FullCalendarProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "live":
      return "bg-red-500 text-white hover:bg-red-600"
    case "scheduled":
      return "bg-blue-500 text-white hover:bg-blue-600"
    case "completed":
      return "bg-emerald-500 text-white hover:bg-emerald-600"
    case "cancelled":
      return "bg-muted-foreground text-primary-foreground hover:bg-muted-foreground/80"
    default:
      return "bg-primary text-primary-foreground hover:bg-primary/90"
  }
}

const getTypeIcon = (type: string) => {
  const t = type.toLowerCase()
  switch (t) {
    case "rtmp":
      return <Video className="h-3 w-3 shrink-0" />
    case "youtube":
    case "youtube_api":
    case "youtube_embed":
      return <Youtube className="h-3 w-3 shrink-0" />
    case "hls":
      return <MonitorPlay className="h-3 w-3 shrink-0" />
    default:
      return <Globe className="h-3 w-3 shrink-0" />
  }
}

export function FullCalendar({ currentDate, onDateChange, events, onEventClick }: FullCalendarProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: startDate, end: endDate })

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {}
    events.forEach((event) => {
      const date = new Date(event.scheduledAt || event.createdAt)
      const dateKey = format(date, "yyyy-MM-dd")
      if (!grouped[dateKey]) grouped[dateKey] = []
      grouped[dateKey].push(event)
    })
    
    // Sort events in each day (e.g., live first, then scheduled by time)
    Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => {
            if (a.status === 'live' && b.status !== 'live') return -1;
            if (b.status === 'live' && a.status !== 'live') return 1;
            return new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime();
        })
    });

    return grouped
  }, [events])

  return (
    <div className="flex h-full flex-col bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4 bg-muted/10">
        <h2 className="text-xl font-bold text-foreground">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
            className="hidden sm:flex"
          >
            Today
          </Button>
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1 border border-border">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-semibold uppercase text-muted-foreground tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 auto-rows-fr h-full min-h-[min(600px,70dvh)] sm:min-h-[600px] border-l border-border">
          {days.map((day, dayIdx) => {
            const dateKey = format(day, "yyyy-MM-dd")
            const dayEvents = eventsByDate[dateKey] || []
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <div
                key={day.toString()}
                className={cn(
                  "relative flex min-h-[120px] flex-col border-b border-r border-border p-1.5 transition-colors",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isCurrentMonth && "bg-background hover:bg-muted/10"
                )}
              >
                <div className="flex items-center justify-between mb-1 px-1">
                  <span
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                      isToday(day)
                        ? "bg-primary text-primary-foreground"
                        : (!isCurrentMonth && "opacity-50")
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  
                  {dayEvents.length > 0 && (
                      <span className="text-[10px] text-muted-foreground font-medium md:hidden">
                          {dayEvents.length}
                      </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto pr-1 no-scrollbar pb-1">
                  {dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className={cn(
                        "flex w-full items-center gap-1.5 rounded-sm px-1.5 py-1 text-left text-xs transition-shadow hover:ring-1 hover:ring-ring/50",
                        getStatusColor(event.status)
                      )}
                    >
                      {getTypeIcon(event.streamType)}
                      <span className="truncate font-medium">{event.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
