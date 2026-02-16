"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  ArrowLeft,
  Play,
  Square,
  Radio,
  Activity,
  Settings,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Users,
  Eye,
  Clock,
} from "lucide-react"
import { StreamPlayer } from "@/components/stream/stream-player"
import { StreamStatsPanel } from "@/components/stream/stream-stats-panel"
import { RtmpInfoPanel } from "@/components/stream/rtmp-info-panel"
import { YouTubeInfoPanel } from "@/components/stream/youtube-info-panel"
import { EmbedInfoPanel } from "@/components/stream/embed-info-panel"
import { ViewerChart } from "@/components/stream/viewer-chart"
import { mockEvents } from "@/lib/mock-data"
import { getMockStreamStats } from "@/lib/nimble-service"
import { useStreamMonitor } from "@/hooks/use-stream-monitor"
import type { NimbleStream, NimbleStreamStats, LiveEvent } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

export default function StreamControlRoomPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [event, setEvent] = useState<LiveEvent | null>(null)
  const [stream, setStream] = useState<NimbleStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGoingLive, setIsGoingLive] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [showStopDialog, setShowStopDialog] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Real-time stream monitoring via polling hook
  const { stats, history, isConnected, error: monitorError } = useStreamMonitor({
    eventId,
    enabled: event?.status === "live",
    pollInterval: 5000,
  })

  // Load event data
  useEffect(() => {
    const found = mockEvents.find((e) => e.id === eventId)
    if (found) {
      setEvent(found)
      // Create a mock stream object from event data
      setStream({
        id: `ns-${eventId}`,
        eventId,
        applicationName: `event-${eventId}`,
        streamName: "live",
        rtmpUrl: found.rtmpUrl || `rtmp://stream.streammattic.com/live/event-${eventId}`,
        streamKey: found.streamKey || `sk_${eventId}_live`,
        hlsPlaybackUrl: found.hlsUrl || `https://cdn.streammattic.com/event-${eventId}/live/playlist.m3u8`,
        dashPlaybackUrl: `https://cdn.streammattic.com/event-${eventId}/live/manifest.mpd`,
        status: found.status === "live" ? "live" : "created",
        isRecording: false,
        transcodingEnabled: true,
        createdAt: found.createdAt,
        startedAt: found.startedAt,
      })
    }
    setIsLoading(false)
  }, [eventId])

  // Go Live handler
  const handleGoLive = async () => {
    setIsGoingLive(true)
    try {
      const res = await fetch("/api/stream/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: stream?.id, applicationName: stream?.applicationName }),
      })

      if (res.ok) {
        setEvent((prev) => (prev ? { ...prev, status: "live", startedAt: new Date() } : prev))
        setStream((prev) => (prev ? { ...prev, status: "live", startedAt: new Date() } : prev))
        toast({ title: "Stream is now LIVE", description: "Viewers can now watch your stream" })
      }
    } catch {
      toast({ title: "Failed to start stream", variant: "destructive" })
    } finally {
      setIsGoingLive(false)
    }
  }

  // Stop Stream handler
  const handleStopStream = async () => {
    setIsStopping(true)
    try {
      const res = await fetch("/api/stream/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: stream?.id, applicationName: stream?.applicationName }),
      })

      if (res.ok) {
        setEvent((prev) => (prev ? { ...prev, status: "completed", endedAt: new Date() } : prev))
        setStream((prev) => (prev ? { ...prev, status: "stopped", stoppedAt: new Date() } : prev))
        toast({ title: "Stream ended", description: "Your stream has been stopped" })
      }
    } catch {
      toast({ title: "Failed to stop stream", variant: "destructive" })
    } finally {
      setIsStopping(false)
      setShowStopDialog(false)
    }
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/watch/${eventId}`)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading stream control room...</div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/events")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
      </div>
    )
  }

  const isLive = event.status === "live"
  const isCompleted = event.status === "completed"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/events")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
                  {isLive && (
                    <Badge className="bg-red-600 text-white animate-pulse">
                      <Radio className="h-3 w-3 mr-1" />
                      LIVE
                    </Badge>
                  )}
                  {isCompleted && <Badge variant="secondary">Completed</Badge>}
                  {!isLive && !isCompleted && <Badge variant="outline">Offline</Badge>}
                </div>
                <p className="text-sm text-muted-foreground capitalize">{event.streamType} Stream</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                {linkCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {linkCopied ? "Copied" : "Copy Link"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/watch/${eventId}`, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Page
              </Button>

              {!isLive && !isCompleted && (
                <Button onClick={handleGoLive} disabled={isGoingLive} className="bg-red-600 hover:bg-red-700 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  {isGoingLive ? "Starting..." : "Go Live"}
                </Button>
              )}

              {isLive && (
                <Button
                  variant="destructive"
                  onClick={() => setShowStopDialog(true)}
                  disabled={isStopping}
                >
                  <Square className="h-4 w-4 mr-2" />
                  {isStopping ? "Stopping..." : "End Stream"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Preview + Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stream Preview */}
            <StreamPlayer
              hlsUrl={stream?.hlsPlaybackUrl || null}
              youtubeUrl={event.youtubeUrl}
              embedUrl={event.hlsUrl}
              isLive={isLive}
              eventTitle={event.title}
              streamType={event.streamType}
            />

            {/* Quick Stats Bar */}
            {isLive && stats && (
              <div className="grid grid-cols-4 gap-3">
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Viewers</p>
                      <p className="text-lg font-bold">{stats.currentViewers}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total Views</p>
                      <p className="text-lg font-bold">{stats.totalViews.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Uptime</p>
                      <p className="text-lg font-bold">
                        {Math.floor(stats.uptime / 60)}m {stats.uptime % 60}s
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Health</p>
                      <p className="text-lg font-bold capitalize">{stats.health.status}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">
                  <Settings className="h-4 w-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="stats">
                  <Activity className="h-4 w-4 mr-2" />
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="share">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <StreamStatsPanel stats={isLive ? stats : null} isLoading={isLive && !stats} />
              </TabsContent>

              <TabsContent value="stats" className="mt-4 space-y-4">
                {/* Live Viewer Chart */}
                {isLive && <ViewerChart history={history} />}

                {/* Connection Status */}
                {isLive && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
                    <span className="text-muted-foreground">
                      {isConnected ? "Connected - Polling every 5s" : monitorError || "Reconnecting..."}
                    </span>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Stream Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <p className="text-3xl font-bold text-foreground">{event.totalViews.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground mt-1">Total Views</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <p className="text-3xl font-bold text-foreground">{event.maxViewers}</p>
                        <p className="text-sm text-muted-foreground mt-1">Max Viewers</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/30">
                        <p className="text-3xl font-bold text-foreground">{stats?.currentViewers || event.currentViewers}</p>
                        <p className="text-sm text-muted-foreground mt-1">Current Viewers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="share" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Share Event</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Event Page URL</p>
                      <div className="flex gap-2">
                        <code className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-sm font-mono">
                          {typeof window !== "undefined" ? `${window.location.origin}/watch/${eventId}` : `/watch/${eventId}`}
                        </code>
                        <Button variant="outline" size="sm" onClick={copyLink}>
                          {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {stream?.hlsPlaybackUrl && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Embed Code</p>
                        <code className="block rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono overflow-x-auto">
                          {`<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${eventId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`}
                        </code>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Stream Config */}
          <div className="space-y-6">
            {/* RTMP Connection Details (only for RTMP streams) */}
            {(event.streamType === "rtmp" || event.streamType === "hls") && (
              <RtmpInfoPanel
                stream={stream}
                eventId={eventId}
                onRegenerateKey={() => {
                  toast({
                    title: "Stream key regenerated",
                    description: "Update your encoder with the new key",
                  })
                }}
              />
            )}

            {/* YouTube Live API Panel */}
            {event.streamType === "youtube_api" && (
              <YouTubeInfoPanel
                broadcastId={`broadcast_${eventId}`}
                streamId={`stream_${eventId}`}
                rtmpUrl="rtmp://a.rtmp.youtube.com/live2"
                streamKey={stream?.streamKey || null}
                channelName={event.youtubeChannelName || "Connected Channel"}
                broadcastStatus={isLive ? "live" : isCompleted ? "complete" : "created"}
                healthStatus={isLive ? "good" : "noData"}
                youtubeUrl={event.youtubeUrl}
              />
            )}

            {/* YouTube Embed Panel */}
            {event.streamType === "youtube_embed" && (
              <EmbedInfoPanel
                embedUrl={event.youtubeUrl || null}
                embedType="youtube_embed"
                isLive={isLive}
                onUpdateUrl={(url) => {
                  setEvent((prev) => prev ? { ...prev, youtubeUrl: url } : prev)
                  toast({ title: "YouTube URL updated" })
                }}
              />
            )}

            {/* Third Party Embed Panel */}
            {(event.streamType === "embedded" || event.streamType === "third_party") && (
              <EmbedInfoPanel
                embedUrl={event.hlsUrl || null}
                embedType="third_party"
                isLive={isLive}
                onUpdateUrl={(url) => {
                  setEvent((prev) => prev ? { ...prev, hlsUrl: url } : prev)
                  toast({ title: "Embed URL updated" })
                }}
              />
            )}

            {/* Event Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge
                    variant={isLive ? "default" : "secondary"}
                    className={isLive ? "bg-red-600 text-white" : ""}
                  >
                    {event.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stream Type</span>
                  <span className="font-medium capitalize">{event.streamType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Viewers</span>
                  <span className="font-medium">{event.maxViewers.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Chat</span>
                  <span className="font-medium">{event.allowChat ? "Enabled" : "Disabled"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Password Protected</span>
                  <span className="font-medium">{event.isPasswordProtected ? "Yes" : "No"}</span>
                </div>
                {event.scheduledAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Scheduled</span>
                    <span className="font-medium">
                      {new Date(event.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Server Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Server Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Nimble Server Online</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Region</span>
                  <span className="font-medium">AP South 1 (Mumbai)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-medium text-green-500">12ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stop Stream Confirmation Dialog */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Live Stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop the stream for all viewers. If recording is enabled, the recording will be processed and
              available for download shortly. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStopStream} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isStopping ? "Stopping..." : "End Stream"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
