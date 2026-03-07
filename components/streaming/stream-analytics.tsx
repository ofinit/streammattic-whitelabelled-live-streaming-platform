"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { streamingService, type StreamStatistics } from "@/lib/streaming-service"
import { BarChart3, Eye, Users, Clock, TrendingUp, Globe, Smartphone, Monitor, Tablet, Tv } from "lucide-react"

interface StreamAnalyticsProps {
  eventId: string
}

export function StreamAnalytics({ eventId }: StreamAnalyticsProps) {
  const [stats, setStats] = useState<StreamStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await streamingService.getStreamStatistics(eventId)
        setStats(data)
      } catch (error) {
        console.error("Failed to fetch stream statistics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [eventId])

  if (isLoading || !stats) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-5 w-5 animate-pulse" />
            <span>Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const deviceIcons: Record<string, React.ReactNode> = {
    Desktop: <Monitor className="h-4 w-4" />,
    Mobile: <Smartphone className="h-4 w-4" />,
    Tablet: <Tablet className="h-4 w-4" />,
    TV: <Tv className="h-4 w-4" />,
  }

  const totalDeviceViews = Object.values(stats.viewersByDevice).reduce((a, b) => a + b, 0)
  const totalCountryViews = Object.values(stats.viewersByCountry).reduce((a, b) => a + b, 0)

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Stream Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  Total Views
                </div>
                <p className="text-xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Unique Viewers
                </div>
                <p className="text-xl font-bold text-foreground">{stats.uniqueViewers.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Avg. Watch Time
                </div>
                <p className="text-xl font-bold text-foreground">
                  {streamingService.formatDuration(stats.averageViewDuration)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Peak Concurrent
                </div>
                <p className="text-xl font-bold text-foreground">{stats.peakConcurrentViewers.toLocaleString()}</p>
              </div>
            </div>

            {/* Viewer Timeline (simplified bar chart) */}
            <div className="pt-4">
              <h4 className="text-sm font-medium text-foreground mb-3">Viewers Over Time (24h)</h4>
              <div className="flex items-end gap-1 h-24">
                {stats.viewerTimeline.map((point, i) => {
                  const maxViewers = Math.max(...stats.viewerTimeline.map((p) => p.viewers))
                  const height = (point.viewers / maxViewers) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60 rounded-t transition-all hover:bg-primary"
                      style={{ height: `${height}%` }}
                      title={`${point.time.toLocaleTimeString()}: ${point.viewers} viewers`}
                    />
                  )
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="geography" className="pt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Viewers by Country
              </h4>
              {Object.entries(stats.viewersByCountry)
                .sort((a, b) => b[1] - a[1])
                .map(([country, views]) => (
                  <div key={country} className="flex items-center gap-3">
                    <span className="w-8 text-sm font-medium text-foreground">{country}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(views / totalCountryViews) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">{views.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="devices" className="pt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Viewers by Device
              </h4>
              {Object.entries(stats.viewersByDevice)
                .sort((a, b) => b[1] - a[1])
                .map(([device, views]) => (
                  <div key={device} className="flex items-center gap-3">
                    <span className="w-20 flex items-center gap-2 text-sm font-medium text-foreground">
                      {deviceIcons[device]}
                      {device}
                    </span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(views / totalDeviceViews) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-16 text-right">{views.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
