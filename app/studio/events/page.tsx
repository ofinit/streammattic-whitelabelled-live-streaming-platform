"use client"

import { useState } from "react"
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
  StopCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import type { LiveEvent } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StudioEventsPage() {
  const { user } = useAuth()
  const studioId = user?.id || "b0000000-0000-0000-0000-000000000001"

  const [searchQuery, setSearchQuery] = useState("")
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LiveEvent | undefined>()
  const [deleteEvent, setDeleteEvent] = useState<Record<string, unknown> | null>(null)

  const { data, isLoading, mutate } = useSWR(
    `/api/studio/events?studioId=${studioId}${searchQuery ? `&search=${searchQuery}` : ""}`,
    fetcher,
    { refreshInterval: 15000 }
  )

  const events = data?.events ?? []
  const totalCount = data?.totalCount ?? 0
  const liveCount = data?.liveCount ?? 0
  const scheduledCount = data?.scheduledCount ?? 0
  const completedCount = data?.completedCount ?? 0

  const liveEvents = events.filter((e: Record<string, unknown>) => e.status === "live")
  const scheduledEvents = events.filter((e: Record<string, unknown>) => e.status === "scheduled")
  const completedEvents = events.filter((e: Record<string, unknown>) => e.status === "completed")

  const totalViewers = liveEvents.reduce((acc: number, e: Record<string, unknown>) => acc + (Number(e.currentViewers) || 0), 0)

  const handleCreateEvent = () => {
    setEditingEvent(undefined)
    setShowEventDialog(true)
  }

  const handleEditEvent = (event: Record<string, unknown>) => {
    setEditingEvent(event as unknown as LiveEvent)
    setShowEventDialog(true)
  }

  const handleSaveEvent = (eventData: Partial<LiveEvent>, keepOpen?: boolean) => {
    // TODO: POST to API to persist event
    toast.success(editingEvent ? "Event updated" : "Event created")
    mutate()
    if (!keepOpen) {
      setShowEventDialog(false)
    }
  }

  const handleDeleteEvent = () => {
    if (deleteEvent) {
      // TODO: DELETE to API to remove event
      toast.success("Event deleted")
      setDeleteEvent(null)
      mutate()
    }
  }

  const handleForceStop = (event: Record<string, unknown>) => {
    // TODO: POST to API to stop event
    toast.success("Event stopped")
    mutate()
  }

  const renderEventCard = (event: Record<string, unknown>) => (
    <Card key={event.id as string}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-32 rounded-lg bg-muted overflow-hidden flex-shrink-0">
            <img
              src={event.thumbnailUrl as string || `/placeholder.svg?height=80&width=128`}
              alt={event.title as string}
              className="h-full w-full object-cover"
            />
            {event.status === "live" && (
              <Badge className="absolute top-1 left-1 bg-red-500 text-white text-xs">LIVE</Badge>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{event.title as string}</h3>
              <Badge
                variant={
                  event.status === "live"
                    ? "destructive"
                    : event.status === "scheduled"
                      ? "default"
                      : "secondary"
                }
              >
                {event.status as string}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">{event.description as string}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {Number(event.currentViewers) || 0} viewers
              </span>
              {event.scheduledStart && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(new Date(event.scheduledStart as string))}
                </span>
              )}
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
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Create and manage your streaming events</p>
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Live Now</CardTitle>
                <Video className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{liveCount}</div>
                <p className="text-xs text-muted-foreground">{totalViewers} total viewers</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{scheduledCount}</div>
                <p className="text-xs text-muted-foreground">Upcoming events</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <span className="bg-muted px-2 py-0.5 rounded text-xs">{totalCount}</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="gap-2">
            <Video className="h-4 w-4" />
            Live
            <span className="bg-red-500/20 text-red-500 px-2 py-0.5 rounded text-xs">{liveCount}</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled
            <span className="bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded text-xs">{scheduledCount}</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed
            <span className="bg-muted px-2 py-0.5 rounded text-xs">{completedCount}</span>
          </TabsTrigger>
        </TabsList>

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
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-20 w-32 rounded-lg" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-72" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : tabEvents.length > 0 ? (
                  tabEvents.map((event: Record<string, unknown>) => renderEventCard(event))
                ) : (
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
    </div>
  )
}
