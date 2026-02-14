"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StreamHealthBadge } from "./stream-health-badge"
import { streamingService, type StreamStatus } from "@/lib/streaming-service"
import { mockEvents } from "@/lib/mock-data"
import type { LiveEvent } from "@/lib/types"
import { Radio, Eye, Clock, ExternalLink, StopCircle, RefreshCw } from "lucide-react"

interface LiveStreamItemProps {
  event: LiveEvent
  status: StreamStatus
  onStop?: () => void
  onView?: () => void
}

function LiveStreamItem({ event, status, onStop, onView }: LiveStreamItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/50">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{event.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {status.viewers.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {status.duration ? streamingService.formatDuration(status.duration) : "0s"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StreamHealthBadge health={status.health} showLabel={false} />
        <Button variant="ghost" size="icon" onClick={onView}>
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onStop} className="text-red-500 hover:text-red-600">
          <StopCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface LiveStreamsMonitorProps {
  refreshInterval?: number
}

export function LiveStreamsMonitor({ refreshInterval = 5000 }: LiveStreamsMonitorProps) {
  const [liveStreams, setLiveStreams] = useState<Array<{ event: LiveEvent; status: StreamStatus }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchLiveStreams = async () => {
    try {
      const liveEvents = mockEvents.filter((e) => e.status === "live")
      const streamsWithStatus = await Promise.all(
        liveEvents.map(async (event) => {
          const status = await streamingService.getStreamStatus(event)
          return { event, status }
        }),
      )
      setLiveStreams(streamsWithStatus.filter((s) => s.status.isLive))
    } catch (error) {
      console.error("Failed to fetch live streams:", error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLiveStreams()
    const interval = setInterval(fetchLiveStreams, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLiveStreams()
  }

  const totalViewers = liveStreams.reduce((sum, s) => sum + s.status.viewers, 0)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Radio className="h-5 w-5 text-red-500" />
            Live Streams
            <Badge variant="outline" className="ml-2">
              {liveStreams.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{totalViewers.toLocaleString()} viewers</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Radio className="h-5 w-5 animate-pulse mr-2" />
            Loading live streams...
          </div>
        ) : liveStreams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No live streams at the moment</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {liveStreams.map(({ event, status }) => (
                <LiveStreamItem
                  key={event.id}
                  event={event}
                  status={status}
                  onView={() => window.open(`/watch/${event.id}`, "_blank")}
                  onStop={() => console.log("Stop stream:", event.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
