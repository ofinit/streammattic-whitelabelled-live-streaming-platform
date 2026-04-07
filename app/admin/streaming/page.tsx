"use client"

import { useRouter } from "next/navigation"
import useSWR from "swr"
import { ServerStatsPanel } from "@/components/streaming/server-stats-panel"
import { LiveStreamsMonitor } from "@/components/streaming/live-streams-monitor"
import { StatsCard } from "@/components/dashboard/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Radio, Eye, Users, Activity, Settings, Loader2 } from "lucide-react"
import { getActiveBackendType, BACKEND_INFO } from "@/lib/streaming"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminStreamingPage() {
  const router = useRouter()
  const backendType = getActiveBackendType()
  const backendInfo = BACKEND_INFO[backendType]
  
  const { data: eventsData, isLoading: isLoadingEvents } = useSWR("/api/events?status=live", fetcher, {
    refreshInterval: 10000 // refresh every 10 seconds
  })

  const liveEvents = eventsData?.events || []
  const totalViewers = liveEvents.reduce((sum: number, e: any) => sum + (e.currentViewers || 0), 0)
  const totalBandwidth = liveEvents.length * 4.5 // Still mock bandwidth calculation for now as it depends on server stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Streaming Server</h1>
            <Badge variant="outline" className={backendInfo.isFree ? "bg-green-500/10 text-green-500 border-green-500/30" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"}>
              {backendInfo.name}{backendInfo.isFree ? " (Free)" : ""}
            </Badge>
          </div>
          <p className="text-muted-foreground">Monitor {backendInfo.name} server and live streams</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border bg-transparent" onClick={() => router.push("/admin/streaming/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Server Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Live Streams"
          value={isLoadingEvents ? "..." : liveEvents.length.toString()}
          icon={Radio}
        />
        <StatsCard
          title="Total Viewers"
          value={isLoadingEvents ? "..." : totalViewers.toLocaleString()}
          icon={Eye}
        />
        <StatsCard title="Connected Clients" value={isLoadingEvents ? "..." : (totalViewers + liveEvents.length).toLocaleString()} icon={Users} />
        <StatsCard title="Bandwidth Out" value={isLoadingEvents ? "..." : `${totalBandwidth.toFixed(1)} Mbps`} icon={Activity} />
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
          <CardTitle className="text-lg">Recent Stream Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
             {liveEvents.length === 0 ? (
               <p className="text-sm text-muted-foreground py-4 text-center">No active streams monitored</p>
             ) : (
               liveEvents.slice(0, 5).map((event: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500/30">
                      LIVE
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-foreground">{event.title}</p>
                      <p className="text-xs text-muted-foreground">User: {event.userName}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{event.currentViewers || 0} viewers</span>
                </div>
               ))
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
