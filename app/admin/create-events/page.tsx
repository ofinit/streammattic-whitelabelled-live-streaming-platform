"use client"

import { useState, useMemo, useEffect } from "react"
import { EventCalendar } from "@/components/calendar/event-calendar"
import { FullCalendar, type CalendarEvent } from "@/components/calendar/full-calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { EventDetailSheet, calendarStatusGroup } from "@/components/calendar/event-detail-sheet"
import { Plus } from "lucide-react"
import Link from "next/link"

const statusFilters = [
  { id: "live", label: "Live", color: "bg-red-500" },
  { id: "scheduled", label: "Scheduled", color: "bg-blue-500" },
  { id: "completed", label: "Completed", color: "bg-emerald-500" },
]

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([])

  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    live: true,
    scheduled: true,
    completed: true
  })

  useEffect(() => {
    fetch("/api/admin/events")
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setAllEvents(data.events as CalendarEvent[])
        }
      })
      .catch(console.error)
  }, [])

  // Filter events by selected status checkboxes
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
       const status = calendarStatusGroup(event.status)
       return activeFilters[status] ?? true
    })
  }, [allEvents, activeFilters])

  const toggleFilter = (id: string, checked: boolean) => {
    setActiveFilters(prev => ({ ...prev, [id]: checked }))
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Event</h1>
          <p className="text-muted-foreground">Monitor all platform streaming events</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start h-full min-h-[700px]">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-6">
          <Button className="w-full shadow-sm" size="lg" asChild>
            <Link href="/admin/control-center/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Event
            </Link>
          </Button>

          <Card className="border-border shadow-sm">
            <CardContent className="p-3">
              <EventCalendar 
                mode="single" 
                selected={currentDate} 
                onSelect={(d) => d && setCurrentDate(d)} 
                events={allEvents}
                className="border-0 shadow-none ring-0 w-full"
              />
            </CardContent>
          </Card>

          <div className="space-y-4 px-1">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filters</h3>
                <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {filteredEvents.length} / {allEvents.length} Total
                </span>
            </div>
            <div className="space-y-3">
              {statusFilters.map(filter => {
                const count = allEvents.filter(e => calendarStatusGroup(e.status) === filter.id).length;
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
            <FullCalendar 
               currentDate={currentDate}
               onDateChange={setCurrentDate}
               events={filteredEvents}
               onEventClick={setSelectedEvent}
            />
        </div>
      </div>

      <EventDetailSheet
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        dashboardHref={(event) => `/admin/control-center/${event.id}`}
      />
    </div>
  )
}
