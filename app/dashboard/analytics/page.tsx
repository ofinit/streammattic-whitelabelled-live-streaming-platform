"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Radio, Eye } from "lucide-react"
import { mockEvents, mockUserStats } from "@/lib/mock-data"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { useMemo } from "react"

export default function UserAnalyticsPage() {
  const stats = useMemo(() => {
    const totalEvents = mockEvents.length
    const totalViews = mockEvents.reduce((sum, event) => sum + event.totalViews, 0)
    const activeEvents = mockEvents.filter((e) => e.status === "live").length
    const completedEvents = mockEvents.filter((e) => e.status === "completed").length

    return {
      totalEvents,
      totalViews,
      activeEvents,
      completedEvents,
      avgViewsPerEvent: totalEvents > 0 ? Math.round(totalViews / totalEvents) : 0,
    }
  }, [])

  const eventsOverTimeData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month, idx) => ({
      month,
      events: Math.floor(Math.random() * 5) + 1,
      views: Math.floor(Math.random() * 500) + 200,
    }))
  }, [])

  const eventsByTypeData = useMemo(() => {
    const types = { rtmp: 0, youtube_api: 0, youtube_embed: 0, hls: 0 }
    mockEvents.forEach((event) => {
      if (event.streamType in types) {
        types[event.streamType as keyof typeof types]++
      }
    })

    return [
      { type: "RTMP Server", count: types.rtmp || 1, fill: "hsl(217, 91%, 60%)" },
      { type: "YouTube Live API", count: types.youtube_api || 1, fill: "hsl(0, 84%, 60%)" },
      { type: "YouTube Embed", count: types.youtube_embed || 1, fill: "hsl(280, 65%, 60%)" },
      { type: "Third Party", count: types.hls || 1, fill: "hsl(142, 76%, 36%)" },
    ]
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">View your streaming performance and engagement metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">{stats.activeEvents} currently live</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Avg {stats.avgViewsPerEvent} per event</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Events</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedEvents}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.completedEvents / stats.totalEvents) * 100)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{mockUserStats.walletBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Package: {mockUserStats.packageName}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events & Views Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={eventsOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fill: "#ffffff" }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "#ffffff" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                />
                <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                <Line
                  type="monotone"
                  dataKey="events"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(217, 91%, 60%)", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Events"
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events by Stream Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventsByTypeData} margin={{ top: 5, right: 20, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="type"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "#ffffff", fontSize: 12 }}
                  angle={-25}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: "#ffffff" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  cursor={{ fill: "hsl(var(--accent))", opacity: 0.1 }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} stroke="none">
                  {eventsByTypeData.map((entry, index) => (
                    <Bar key={`bar-${index}`} dataKey="count" fill={entry.fill} stroke="none" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.status === "live"
                      ? "🔴 Live"
                      : event.status === "completed"
                        ? "✓ Completed"
                        : "📅 Scheduled"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{event.totalViews.toLocaleString()} views</p>
                  <p className="text-sm text-muted-foreground">{event.streamType.toUpperCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
