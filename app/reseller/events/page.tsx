"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  Users,
  Eye,
  Clock,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  StopCircle,
} from "lucide-react"
import { mockEvents, mockUsers } from "@/lib/mock-data"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import type { LiveEvent } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"

export default function ResellerEventsPage() {
  // Get all events from users under this reseller
  const resellerUserIds = mockUsers.filter((u) => u.resellerId === "reseller-1").map((u) => u.id)
  const [events, setEvents] = useState<LiveEvent[]>(mockEvents.filter((e) => resellerUserIds.includes(e.userId)))
  const [searchQuery, setSearchQuery] = useState("")

  const [showEventDialog, setShowEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LiveEvent | undefined>()
  const [deleteEvent, setDeleteEvent] = useState<LiveEvent | null>(null)

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mockUsers
        .find((u) => u.id === event.userId)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase()),
  )

  const liveEvents = filteredEvents.filter((e) => e.status === "live")
  const scheduledEvents = filteredEvents.filter((e) => e.status === "scheduled")
  const completedEvents = filteredEvents.filter((e) => e.status === "completed")

  const totalViewers = liveEvents.reduce((acc, e) => acc + e.viewerCount, 0)

  const getUserName = (userId: string) => mockUsers.find((u) => u.id === userId)?.name || "Unknown"
  const getUserInitials = (userId: string) => {
    const name = getUserName(userId)
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const handleCreateEvent = () => {
    setEditingEvent(undefined)
    setShowEventDialog(true)
  }

  const handleEditEvent = (event: LiveEvent) => {
    setEditingEvent(event)
    setShowEventDialog(true)
  }

  const handleSaveEvent = (eventData: Partial<LiveEvent>, keepOpen?: boolean) => {
    if (editingEvent) {
      setEvents(events.map((e) => (e.id === editingEvent.id ? ({ ...e, ...eventData } as LiveEvent) : e)))
      toast.success("Event updated successfully")
    } else {
      const newEvent: LiveEvent = {
        ...eventData,
        id: `event-${Date.now()}`,
        userId: "reseller-1",
        status: "draft",
        viewerCount: 0,
        currentViewers: 0,
        totalViews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as LiveEvent
      setEvents([newEvent, ...events])
      toast.success("Event created successfully")
    }
    if (!keepOpen) {
      setShowEventDialog(false)
    }
  }

  const handleDeleteEvent = () => {
    if (deleteEvent) {
      setEvents(events.filter((e) => e.id !== deleteEvent.id))
      toast.success("Event deleted successfully")
      setDeleteEvent(null)
    }
  }

  const handleForceStop = (event: LiveEvent) => {
    setEvents(events.map((e) => (e.id === event.id ? { ...e, status: "completed" as const } : e)))
    toast.success("Event stopped successfully")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Create and manage events for your users</p>
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Live Now</CardTitle>
            <Video className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveEvents.length}</div>
            <p className="text-xs text-muted-foreground">{totalViewers} total viewers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledEvents.length}</div>
            <p className="text-xs text-muted-foreground">Upcoming events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedEvents.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events or users..."
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
        </TabsList>

        {["all", "live", "scheduled", "completed"].map((tab) => {
          const tabEvents =
            tab === "all"
              ? filteredEvents
              : filteredEvents.filter((e) => e.status === tab || (tab === "completed" && e.status === "completed"))

          return (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="space-y-4">
                {tabEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative h-20 w-32 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          <img
                            src={event.thumbnail || `/placeholder.svg?height=80&width=128&query=${event.title}`}
                            alt={event.title}
                            className="h-full w-full object-cover"
                          />
                          {event.status === "live" && (
                            <Badge className="absolute top-1 left-1 bg-red-500 text-white text-xs">LIVE</Badge>
                          )}
                        </div>

                        {/* Event Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{event.title}</h3>
                            <Badge
                              variant={
                                event.status === "live"
                                  ? "destructive"
                                  : event.status === "scheduled"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {event.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {event.viewerCount} viewers
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(event.scheduledAt)}
                            </span>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getUserInitials(event.userId)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-right">
                            <p className="text-sm font-medium">{getUserName(event.userId)}</p>
                            <p className="text-xs text-muted-foreground">User</p>
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.open(`/watch/${event.id}`, "_blank")}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditEvent(event)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            {event.status === "live" && (
                              <DropdownMenuItem onClick={() => handleForceStop(event)}>
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
                    </CardContent>
                  </Card>
                ))}
                {tabEvents.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No {tab === "all" ? "" : tab} events found</p>
                    <Button variant="outline" className="mt-4 bg-transparent" onClick={handleCreateEvent}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Event
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>

      <EventFormDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        event={editingEvent}
        onSave={handleSaveEvent}
      />

      <AlertDialog open={!!deleteEvent} onOpenChange={() => setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEvent?.title}"? This action cannot be undone.
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
    </div>
  )
}
