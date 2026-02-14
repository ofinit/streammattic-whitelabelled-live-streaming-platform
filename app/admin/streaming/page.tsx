"use client"

import { ServerStatsPanel } from "@/components/streaming/server-stats-panel"
import { LiveStreamsMonitor } from "@/components/streaming/live-streams-monitor"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockEvents } from "@/lib/mock-data"
import { Radio, Eye, Users, Activity, Settings } from "lucide-react"

export default function AdminStreamingPage() {
  const liveEvents = mockEvents.filter((e) => e.status === "live")
  const totalViewers = liveEvents.reduce((sum, e) => sum + e.currentViewers, 0)
  const totalBandwidth = liveEvents.length * 4.5 // Mock: 4.5 Mbps per stream

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Streaming Server</h1>
          <p className="text-muted-foreground">Monitor Nimble Streamer server and live streams</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border bg-transparent">
            <Settings className="mr-2 h-4 w-4" />
            Server Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Live Streams"
          value={liveEvents.length.toString()}
          icon={Radio}
          trend={{ value: 2, isPositive: true }}
        />
        <StatsCard
          title="Total Viewers"
          value={totalViewers.toLocaleString()}
          icon={Eye}
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard title="Connected Clients" value={(totalViewers + liveEvents.length).toLocaleString()} icon={Users} />
        <StatsCard title="Bandwidth Out" value={`${totalBandwidth.toFixed(1)} Mbps`} icon={Activity} />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Server Stats */}
        <ServerStatsPanel refreshInterval={10000} />

        {/* Live Streams Monitor */}
        <LiveStreamsMonitor refreshInterval={5000} />
      </div>

      {/* Recent Stream Activity */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Stream Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "2 min ago", event: "Stream started", stream: "Tech Conference 2024", type: "start" },
              { time: "5 min ago", event: "Peak viewers reached", stream: "Music Festival Live", type: "peak" },
              { time: "12 min ago", event: "Recording started", stream: "Product Launch", type: "recording" },
              { time: "25 min ago", event: "Stream ended", stream: "Gaming Tournament", type: "end" },
              { time: "1 hour ago", event: "Stream started", stream: "Yoga Class", type: "start" },
            ].map((log, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      log.type === "start"
                        ? "bg-green-500/20 text-green-500 border-green-500/30"
                        : log.type === "end"
                          ? "bg-gray-500/20 text-gray-500 border-gray-500/30"
                          : log.type === "peak"
                            ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                            : "bg-blue-500/20 text-blue-500 border-blue-500/30"
                    }
                  >
                    {log.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium text-foreground">{log.event}</p>
                    <p className="text-xs text-muted-foreground">{log.stream}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
