"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Radio, Clock, Eye, Wallet } from "lucide-react"
import { mockEvents, mockResellerStats } from "@/lib/mock-data"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Bar, BarChart } from "recharts"
import { useMemo } from "react"

export default function ResellerAnalyticsPage() {
  const eventStats = useMemo(() => {
    const completedEvents = mockEvents.filter((e) => e.status === "completed")
    const liveEvents = mockEvents.filter((e) => e.status === "live")
    const totalViewers = mockEvents.reduce((sum, e) => sum + (e.currentViewers ?? 0), 0)
    const avgDuration = completedEvents.length > 0
      ? completedEvents.reduce((sum, e) => sum + (e.duration ?? 0), 0) / completedEvents.length
      : 0

    return {
      totalEvents: mockEvents.length,
      completedEvents: completedEvents.length,
      liveNow: liveEvents.length,
      totalViewers,
      avgDurationMinutes: Math.round(avgDuration / 60),
    }
  }, [])

  const eventTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month) => ({
      month,
      events: Math.floor(Math.random() * 30) + 10,
      streamHours: Math.floor(Math.random() * 120) + 40,
    }))
  }, [])

  const streamTypeData = useMemo(() => {
    const types: Record<string, number> = {}
    mockEvents.forEach((e) => {
      const type = e.streamType?.replace("_", " ") ?? "Unknown"
      types[type] = (types[type] ?? 0) + 1
    })
    return Object.entries(types).map(([name, count]) => ({ name, count }))
  }, [])

  const topEvents = useMemo(() => {
    return [...mockEvents]
      .sort((a, b) => (b.peakViewers ?? 0) - (a.peakViewers ?? 0))
      .slice(0, 5)
      .map((event) => ({
        title: event.title,
        streamType: event.streamType?.replace("_", " ") ?? "Unknown",
        peakViewers: event.peakViewers ?? 0,
        duration: event.duration ? Math.round(event.duration / 60) : 0,
        status: event.status,
      }))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Analytics</h1>
        <p className="text-muted-foreground">Monitor your streaming performance and event activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">{eventStats.completedEvents} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <Radio className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.liveNow}</div>
            <p className="text-xs text-muted-foreground">{mockResellerStats.activeEvents} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventStats.totalViewers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Spend</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{mockResellerStats.walletBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current balance</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                events: { label: "Events", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px]"
            >
              <AreaChart data={eventTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="events"
                  stroke="var(--color-events)"
                  fill="var(--color-events)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stream Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                streamHours: { label: "Stream Hours", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px]"
            >
              <BarChart data={eventTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="streamHours" fill="var(--color-streamHours)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {streamTypeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events by Stream Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: { label: "Events", color: "hsl(var(--chart-3))" },
              }}
              className="h-[250px]"
            >
              <BarChart data={streamTypeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top Events by Peak Viewers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topEvents.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No events data available yet.</p>
            ) : (
              topEvents.map((event, idx) => (
                <div key={event.title} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm capitalize text-muted-foreground">{event.streamType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-lg">{event.peakViewers.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Peak viewers</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="font-medium">{event.duration}m</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
