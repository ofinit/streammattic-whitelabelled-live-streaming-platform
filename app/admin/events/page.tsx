"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Video, Eye, Users, MoreVertical, ExternalLink, Plus, Pencil, Trash2, StopCircle } from "lucide-react"
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
import { mockEvents, mockStreamers } from "@/lib/mock-data"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import type { LiveEvent } from "@/lib/types"
import { format } from "date-fns"
import { toast } from "sonner"

export default function AdminEventsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [events, setEvents] = useState<LiveEvent[]>(mockEvents)

  const [showEventDialog, setShowEventDialog] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LiveEvent | undefined>()
  const [deleteEvent, setDeleteEvent] = useState<LiveEvent | null>(null)

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || event.status === statusFilter
    const matchesType = typeFilter === "all" || event.streamType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const liveCount = events.filter((e) => e.status === "live").length
  const totalViewers = events.filter((e) => e.status === "live").reduce((sum, e) => sum + e.currentViewers, 0)

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      live: "bg-red-500",
      scheduled: "bg-blue-500",
      completed: "bg-gray-500",
      draft: "bg-yellow-500",
      cancelled: "bg-red-700",
    }
    return (
      <Badge className={`${colors[status] || "bg-gray-500"} text-white`}>
        {status === "live" && <span className="mr-1 h-2 w-2 rounded-full bg-white animate-pulse inline-block" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getUserName = (userId: string) => {
    const user = mockStreamers.find((u) => u.id === userId)
    return user?.name || "Unknown"
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
        userId: "admin-1",
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
          <p className="text-muted-foreground">Monitor and manage all platform events</p>
        </div>
        <Button onClick={handleCreateEvent}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{liveCount}</p>
                <p className="text-sm text-muted-foreground">Live Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViewers.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Current Viewers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, e) => sum + e.totalViews, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="rtmp">RTMP</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="hls">HLS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Viewers</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          event.thumbnail ||
                          `/placeholder.svg?height=40&width=60&query=${encodeURIComponent(event.title) || "/placeholder.svg"}`
                        }
                        alt={event.title}
                        className="w-16 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getUserName(event.userId)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {event.streamType}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {event.status === "live" ? event.currentViewers : event.totalViews}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(event.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
