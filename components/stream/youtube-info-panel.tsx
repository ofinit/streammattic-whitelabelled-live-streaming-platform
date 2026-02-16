"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, ExternalLink, Youtube, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface YouTubeInfoPanelProps {
  broadcastId: string | null
  streamId: string | null
  rtmpUrl: string | null
  streamKey: string | null
  channelName: string
  broadcastStatus: "created" | "ready" | "testing" | "live" | "complete"
  healthStatus?: "good" | "ok" | "bad" | "noData"
  youtubeUrl?: string | null
}

export function YouTubeInfoPanel({
  broadcastId,
  streamId,
  rtmpUrl,
  streamKey,
  channelName,
  broadcastStatus,
  healthStatus = "noData",
  youtubeUrl,
}: YouTubeInfoPanelProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" })
    }
  }

  const getStatusColor = () => {
    switch (broadcastStatus) {
      case "live":
        return "bg-red-600 text-white"
      case "testing":
        return "bg-yellow-600 text-white"
      case "ready":
        return "bg-blue-600 text-white"
      case "complete":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getHealthColor = () => {
    switch (healthStatus) {
      case "good":
        return "text-green-500"
      case "ok":
        return "text-yellow-500"
      case "bad":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Youtube className="h-4 w-4 text-red-500" />
          YouTube Live
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Channel Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Channel</span>
          <span className="font-medium">{channelName}</span>
        </div>

        {/* Broadcast Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Broadcast Status</span>
          <Badge className={getStatusColor()}>{broadcastStatus}</Badge>
        </div>

        {/* Stream Health */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Stream Health</span>
          <span className={`font-medium capitalize ${getHealthColor()}`}>{healthStatus}</span>
        </div>

        {/* RTMP URL for YouTube */}
        {rtmpUrl && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">YouTube RTMP URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted/50 px-2 py-1 text-xs font-mono truncate">
                {rtmpUrl}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(rtmpUrl, "rtmpUrl")}
              >
                {copiedField === "rtmpUrl" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Stream Key */}
        {streamKey && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Stream Key</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted/50 px-2 py-1 text-xs font-mono truncate">
                {"*".repeat(16)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => copyToClipboard(streamKey, "streamKey")}
              >
                {copiedField === "streamKey" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Broadcast ID */}
        {broadcastId && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Broadcast ID</span>
            <code className="text-xs font-mono">{broadcastId.slice(0, 16)}...</code>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {youtubeUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(youtubeUrl, "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              YouTube Studio
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() =>
              toast({ title: "Checking health...", description: "Fetching YouTube stream health" })
            }
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Check Health
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
