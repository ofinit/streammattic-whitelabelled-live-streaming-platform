"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StreamHealthBadge } from "./stream-health-badge"
import { streamingService, type StreamStatus } from "@/lib/streaming-service"
import type { LiveEvent } from "@/lib/types"
import { Radio, Eye, Clock, Wifi, Monitor, Zap, TrendingUp } from "lucide-react"

interface StreamStatsPanelProps {
  event: LiveEvent
  refreshInterval?: number
}

export function StreamStatsPanel({ event, refreshInterval = 5000 }: StreamStatsPanelProps) {
  const [status, setStatus] = useState<StreamStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await streamingService.getStreamStatus(event)
        setStatus(data)
      } catch (error) {
        console.error("Failed to fetch stream status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, refreshInterval)
    return () => clearInterval(interval)
  }, [event, refreshInterval])

  if (isLoading || !status) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="h-5 w-5 animate-pulse" />
            <span>Loading stream status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Stream Status
          </CardTitle>
          <div className="flex items-center gap-2">
            {status.isLive ? (
              <Badge className="bg-red-600 text-white animate-pulse">
                <span className="mr-1 h-2 w-2 rounded-full bg-white inline-block" />
                LIVE
              </Badge>
            ) : (
              <Badge variant="outline">Offline</Badge>
            )}
            <StreamHealthBadge health={status.health} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              Current Viewers
            </div>
            <p className="text-2xl font-bold text-foreground">{status.viewers.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Peak Viewers
            </div>
            <p className="text-2xl font-bold text-foreground">{status.peakViewers.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Duration
            </div>
            <p className="text-2xl font-bold text-foreground">
              {status.duration ? streamingService.formatDuration(status.duration) : "--"}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Wifi className="h-3 w-3" />
              Bitrate
            </div>
            <p className="text-2xl font-bold text-foreground">
              {status.bitrate ? streamingService.formatBitrate(status.bitrate) : "--"}
            </p>
          </div>
        </div>

        {status.isLive && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Resolution:</span>
              <span className="font-medium text-foreground">{status.resolution || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Frame Rate:</span>
              <span className="font-medium text-foreground">{status.fps || 0} FPS</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
