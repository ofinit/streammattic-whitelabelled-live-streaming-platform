"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Copy, Check, Eye, EyeOff, RefreshCw, Shield, AlertTriangle } from "lucide-react"
import type { Stream } from "@/lib/streaming/types"
import { BACKEND_INFO, type StreamingBackendType } from "@/lib/streaming/types"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json()).catch(() => null)

interface RtmpInfoPanelProps {
  stream: Stream | null
  eventId: string
  onRegenerateKey?: () => void
}

export function RtmpInfoPanel({ stream, eventId, onRegenerateKey }: RtmpInfoPanelProps) {
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Get active backend info for dynamic fallback URLs
  const { data: backendData } = useSWR("/api/streaming/backend-info", fetcher)
  const backendType = (backendData?.type as StreamingBackendType) ?? "nimble"
  const backendInfo = BACKEND_INFO[backendType]

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Fallback URLs use env var names as hints rather than hardcoded Nimble URLs
  const fallbackRtmpUrl = `rtmp://{your-server}:${backendInfo.defaultPorts.rtmp}/live/event-${eventId}`
  const fallbackHlsUrl = `http://{your-server}:${backendInfo.defaultPorts.http}/live/event-${eventId}/playlist.m3u8`

  const rtmpUrl = stream?.rtmpUrl || fallbackRtmpUrl
  const streamKey = stream?.streamKey || "Stream key will be generated when event is created"
  const hlsPlayback = stream?.hlsPlaybackUrl || fallbackHlsUrl

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Stream Connection Details
          </CardTitle>
          <Badge variant={stream?.status === "live" ? "default" : "secondary"} className={stream?.status === "live" ? "bg-red-600 text-white" : ""}>
            {stream?.status || "Not Created"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server URL */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Server URL (RTMP)</Label>
          <div className="flex gap-2">
            <Input value={rtmpUrl} readOnly className="font-mono text-sm bg-muted/50" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(rtmpUrl, "rtmpUrl")}
              className="shrink-0"
            >
              {copiedField === "rtmpUrl" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Stream Key */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Stream Key</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={showStreamKey ? streamKey : streamKey.replace(/./g, "\u2022")}
                readOnly
                className="font-mono text-sm bg-muted/50 pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowStreamKey(!showStreamKey)}
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              >
                {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(streamKey, "streamKey")}
              className="shrink-0"
            >
              {copiedField === "streamKey" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {onRegenerateKey && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={onRegenerateKey}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Regenerate Stream Key
            </Button>
          )}
        </div>

        {/* HLS Playback URL */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">HLS Playback URL</Label>
          <div className="flex gap-2">
            <Input value={hlsPlayback} readOnly className="font-mono text-sm bg-muted/50" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(hlsPlayback, "hlsPlayback")}
              className="shrink-0"
            >
              {copiedField === "hlsPlayback" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Setup Instructions */}
        <Alert className="bg-muted/30 border-border">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>OBS Studio Setup:</strong> Go to Settings {">"} Stream {">"} Service: Custom {">"} Paste the Server
            URL and Stream Key above. Use H.264 encoder with 2500-4500 kbps bitrate for best results.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
