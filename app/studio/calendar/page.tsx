"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { EventCalendar } from "@/components/calendar/event-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { mockEvents } from "@/lib/mock-data"
import {
  CalendarIcon,
  List,
  Radio,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  isWithinInterval,
  isSameDay,
} from "date-fns"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const streamTypeDisplayNames: Record<string, string> = {
  rtmp: "RTMP Server",
  youtube: "YouTube Live API",
  hls: "YouTube Embed",
  embedded: "Third Party Embed",
}

export default function StudioCalendarPage() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [dateRange, setDateRange] = useState("all")
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const eventsPerPage = 10

  // Get events for this studio
  const relevantEvents = useMemo(() => {
    if (!user) return []
    // Studio sees only their own events
    return mockEvents.filter((e) => e.studioId === user.id || e.userId === user.id)
  }, [user])

  // Filter events by date range
  const filteredEvents = useMemo(() => {
    const now = new Date()
    let start: Date, end: Date

    switch (dateRange) {
      case "today":
        start = end = now
        break
      case "week":
        start = subDays(now, 7)
        end = now
        break
      case "month":
        start = startOfMonth(now)
        end = endOfMonth(now)
        break
      case "last30":
        start = subDays(now, 30)
        end = now
        break
      case "last90":
        start = subDays(now, 90)
        end = now
        break
      case "year":
        start = startOfYear(now)
        end = endOfYear(now)
        break
      case "lastMonth":
        const lastMonth = subMonths(now, 1)
        start = startOfMonth(lastMonth)
        end = endOfMonth(lastMonth)
        break
      default:
        return relevantEvents
    }

    return relevantEvents.filter((event) => {
      const eventDate = new Date(event.scheduledAt || event.createdAt)
      return isWithinInterval(eventDate, { start, end })
    })
  }, [dateRange, relevantEvents])

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      total: filteredEvents.length,
      completed: filteredEvents.filter((e) => e.status === "completed").length,
      live: filteredEvents.filter((e) => e.status === "live").length,
      scheduled: filteredEvents.filter((e) => e.status === "scheduled").length,
      cancelled: filteredEvents.filter((e) => e.status === "cancelled").length,
    }
  }, [filteredEvents])

  // Group by stream type
  const eventsByType = useMemo(() => {
    const types = {
      rtmp: { count: 0, color: "#3b82f6" },
      youtube: { count: 0, color: "#ef4444" },
      hls: { count: 0, color: "#8b5cf6" },
      embedded: { count: 0, color: "#10b981" },
    }

    filteredEvents.forEach((event) => {
      if (event.streamType in types) {
        types[event.streamType as keyof typeof types].count++
      }
    })

    return Object.entries(types).map(([key, value]) => ({
      name: streamTypeDisplayNames[key] || key.toUpperCase(),
      value: value.count,
      color: value.color,
    }))
  }, [filteredEvents])

  // Get events for selected calendar date
  const eventsOnDate = useMemo(() => {
    if (!selectedDate) return []
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.scheduledAt || event.createdAt)
      return isSameDay(eventDate, selectedDate)
    })
  }, [selectedDate, filteredEvents])

  // Get dates that have events
  const datesWithEvents = useMemo(() => {
    return filteredEvents.map((event) => new Date(event.scheduledAt || event.createdAt))
  }, [filteredEvents])

  const filteredEventsOnDate = useMemo(() => {
    let filtered = eventsOnDate

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) => event.title.toLowerCase().includes(query) || event.description?.toLowerCase().includes(query),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((event) => event.streamType === typeFilter)
    }

    return filtered
  }, [eventsOnDate, searchQuery, statusFilter, typeFilter])

  const totalFilteredEvents = filteredEventsOnDate.length
  const totalPages = Math.ceil(totalFilteredEvents / eventsPerPage)
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage
    const endIndex = startIndex + eventsPerPage
    return filteredEventsOnDate.slice(startIndex, endIndex)
  }, [filteredEventsOnDate, currentPage, eventsPerPage])

  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, typeFilter, selectedDate])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      live: { label: "Live", className: "bg-red-500 hover:bg-red-600 text-white" },
      scheduled: { label: "Scheduled", className: "bg-yellow-500 hover:bg-yellow-600 text-black" },
      completed: { label: "Completed", className: "bg-green-500 hover:bg-green-600 text-white" },
      cancelled: { label: "Cancelled", className: "bg-gray-500 hover:bg-gray-600 text-white" },
    }
    const config = statusConfig[status] || { label: status, className: "bg-gray-400 text-white" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event Calendar</h1>
        <p className="text-muted-foreground">
          {"View your streaming events"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Your events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live</CardTitle>
            <Radio className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.live}</div>
            <p className="text-xs text-muted-foreground">Currently streaming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Deleted/Cancelled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="lastMonth">Last Month</SelectItem>
            <SelectItem value="last30">Last 30 Days</SelectItem>
            <SelectItem value="last90">Last 90 Days</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            Calendar
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="mr-2 h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Main Content Area - Takes 2/3 of space */}
        <div>
          {viewMode === "calendar" ? (
            <Card>
              <CardHeader>
                <CardTitle>Event Calendar</CardTitle>
                <CardDescription>Click on a date to view events</CardDescription>
              </CardHeader>
              <CardContent>
                <EventCalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  events={filteredEvents}
                />

                {eventsOnDate.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold">Events on {selectedDate && format(selectedDate, "MMMM d, yyyy")}</h3>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search events..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="rtmp">RTMP Server</SelectItem>
                            <SelectItem value="youtube">YouTube Live API</SelectItem>
                            <SelectItem value="hls">YouTube Embed</SelectItem>
                            <SelectItem value="embedded">Third Party Embed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Showing {paginatedEvents.length > 0 ? (currentPage - 1) * eventsPerPage + 1 : 0}-
                        {Math.min(currentPage * eventsPerPage, totalFilteredEvents)} of {totalFilteredEvents}{" "}
                        {totalFilteredEvents !== eventsOnDate.length && `filtered `}
                        {totalFilteredEvents === 1 ? "event" : "events"}
                        {eventsOnDate.length !== totalFilteredEvents && ` (${eventsOnDate.length} total)`}
                      </p>
                    </div>
                    {paginatedEvents.length > 0 ? (
                      <>
                        {paginatedEvents.map((event) => (
                          <Card key={event.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-base">{event.title}</CardTitle>
                                  <CardDescription className="text-xs">
                                    {event.description || "No description"}
                                  </CardDescription>
                                </div>
                                {getStatusBadge(event.status)}
                              </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Radio className="h-3 w-3" />
                                  {streamTypeDisplayNames[event.streamType] || event.streamType.toUpperCase()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {event.totalViews} views
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 pt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum
                                if (totalPages <= 5) {
                                  pageNum = i + 1
                                } else if (currentPage <= 3) {
                                  pageNum = i + 1
                                } else if (currentPage >= totalPages - 2) {
                                  pageNum = totalPages - 4 + i
                                } else {
                                  pageNum = currentPage - 2 + i
                                }
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className="w-9"
                                  >
                                    {pageNum}
                                  </Button>
                                )
                              })}
                              {totalPages > 5 && currentPage < totalPages - 2 && (
                                <>
                                  <span className="px-1">...</span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(totalPages)}
                                    className="w-9"
                                  >
                                    {totalPages}
                                  </Button>
                                </>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          No events found matching your filters
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Events</CardTitle>
                <CardDescription>List of all events in selected range</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredEvents.map((event) => (
                    <Card key={event.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{event.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {format(new Date(event.scheduledAt || event.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </CardDescription>
                          </div>
                          {getStatusBadge(event.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Radio className="h-3 w-3" />
                            {streamTypeDisplayNames[event.streamType] || event.streamType.toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {event.totalViews} views
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Events by Type Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Stream Type</CardTitle>
            <CardDescription>Distribution of event types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {eventsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {eventsByType.map((type) => (
                <div key={type.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: type.color }} />
                    <span>{type.name}</span>
                  </div>
                  <span className="font-semibold">{type.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
