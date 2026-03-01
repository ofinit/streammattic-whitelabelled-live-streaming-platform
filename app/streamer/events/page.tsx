"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Video, Calendar, CheckCircle, FileText } from "lucide-react"
import { EventCard } from "@/components/events/event-card"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import { mockEvents } from "@/lib/mock-data"
import type { LiveEvent } from "@/lib/types"

export default function UserEventsPage() {
  const [events, setEvents] = useState<LiveEvent[]>(mockEvents.filter((e) => e.userId === "user-1"))
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LiveEvent | undefined>()

  const filteredEvents = events.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const liveEvents = filteredEvents.filter((e) => e.status === "live")
  const scheduledEvents = filteredEvents.filter((e) => e.status === "scheduled")
  const completedEvents = filteredEvents.filter((e) => e.status === "completed")
  const draftEvents = filteredEvents.filter((e) => e.status === "draft")

  const handleSaveEvent = (eventData: Partial<LiveEvent>, keepOpen?: boolean) => {
    if (editingEvent) {
      setEvents(events.map((e) => (e.id === editingEvent.id ? ({ ...e, ...eventData } as LiveEvent) : e)))
    } else {
      setEvents([...events, eventData as LiveEvent])
    }

    if (!keepOpen) {
      setShowCreateDialog(false)
      setEditingEvent(undefined)
    }
  }

  const handleDeleteEvent = (event: LiveEvent) => {
    if (confirm("Are you sure you want to delete this event?")) {
      setEvents(events.filter((e) => e.id !== event.id))
    }
  }

  const handleStartEvent = (event: LiveEvent) => {
    setEvents(events.map((e) => (e.id === event.id ? { ...e, status: "live" as const, startedAt: new Date() } : e)))
  }

  const handleStopEvent = (event: LiveEvent) => {
    setEvents(events.map((e) => (e.id === event.id ? { ...e, status: "completed" as const, endedAt: new Date() } : e)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Events</h1>
          <p className="text-muted-foreground">Manage your live streaming events</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <span className="bg-muted px-2 py-0.5 rounded text-xs">{filteredEvents.length}</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Video className="h-4 w-4" />
            Live
            <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs">{liveEvents.length}</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled
            <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded text-xs">{scheduledEvents.length}</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed
            <span className="bg-muted px-2 py-0.5 rounded text-xs">{completedEvents.length}</span>
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-2">
            <FileText className="h-4 w-4" />
            Drafts
            <span className="bg-muted px-2 py-0.5 rounded text-xs">{draftEvents.length}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={(e) => {
                  setEditingEvent(e)
                  setShowCreateDialog(true)
                }}
                onDelete={handleDeleteEvent}
                onStart={handleStartEvent}
                onStop={handleStopEvent}
              />
            ))}
          </div>
          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                Create Your First Event
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveEvents.map((event) => (
              <EventCard key={event.id} event={event} onStop={handleStopEvent} />
            ))}
          </div>
          {liveEvents.length === 0 && <p className="text-center py-12 text-muted-foreground">No live events</p>}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scheduledEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={(e) => {
                  setEditingEvent(e)
                  setShowCreateDialog(true)
                }}
                onStart={handleStartEvent}
              />
            ))}
          </div>
          {scheduledEvents.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No scheduled events</p>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {completedEvents.length === 0 && (
            <p className="text-center py-12 text-muted-foreground">No completed events</p>
          )}
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {draftEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={(e) => {
                  setEditingEvent(e)
                  setShowCreateDialog(true)
                }}
                onDelete={handleDeleteEvent}
              />
            ))}
          </div>
          {draftEvents.length === 0 && <p className="text-center py-12 text-muted-foreground">No draft events</p>}
        </TabsContent>
      </Tabs>

      <EventFormDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open)
          if (!open) setEditingEvent(undefined)
        }}
        event={editingEvent}
        onSave={handleSaveEvent}
      />
    </div>
  )
}
