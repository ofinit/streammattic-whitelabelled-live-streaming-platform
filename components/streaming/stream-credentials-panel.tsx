"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Eye, EyeOff, RefreshCw, Radio, AlertTriangle, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface StreamCredentialsPanelProps {
  rtmpUrl: string
  streamKey: string
  hlsPlaybackUrl?: string
  dashPlaybackUrl?: string
  isLive?: boolean
  onRegenerateKey?: () => Promise<string>
}

export function StreamCredentialsPanel({
  rtmpUrl,
  streamKey,
  hlsPlaybackUrl,
  dashPlaybackUrl,
  isLive = false,
  onRegenerateKey,
}: StreamCredentialsPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [currentStreamKey, setCurrentStreamKey] = useState(streamKey)

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast.success(`${label} copied to clipboard`)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast.error("Failed to copy")
    }
  }

  const handleRegenerate = async () => {
    if (!onRegenerateKey) return
    setIsRegenerating(true)
    try {
      const newKey = await onRegenerateKey()
      setCurrentStreamKey(newKey)
      toast.success("Stream key regenerated successfully")
    } catch (error) {
      toast.error("Failed to regenerate stream key")
    } finally {
      setIsRegenerating(false)
      setRegenerateDialogOpen(false)
    }
  }

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-5 w-5 text-primary" />
              Stream Credentials
            </CardTitle>
            {isLive && (
              <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                <span className="mr-1 h-2 w-2 rounded-full bg-red-500 animate-pulse inline-block" />
                Live
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLive && (
            <Alert className="border-yellow-500/30 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">
                Stream is currently live. Changing the stream key will disconnect your encoder.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="publish" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="publish">Publish</TabsTrigger>
              <TabsTrigger value="playback">Playback</TabsTrigger>
            </TabsList>

            <TabsContent value="publish" className="space-y-4 mt-4">
              {/* RTMP URL */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">RTMP URL (Server)</Label>
                <div className="flex gap-2">
                  <Input value={rtmpUrl} readOnly className="font-mono text-sm bg-secondary" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(rtmpUrl, "RTMP URL")}>
                    {copied === "RTMP URL" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Stream Key */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Stream Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={currentStreamKey}
                      readOnly
                      type={showStreamKey ? "text" : "password"}
                      className="font-mono text-sm bg-secondary pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                    >
                      {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(currentStreamKey, "Stream Key")}>
                    {copied === "Stream Key" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  {onRegenerateKey && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRegenerateDialogOpen(true)}
                      disabled={isRegenerating}
                      title="Regenerate Stream Key"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Never share your stream key. Anyone with it can stream to your channel.
                </p>
              </div>

              {/* OBS Instructions */}
              <div className="rounded-lg border border-border bg-secondary/50 p-4">
                <h4 className="font-medium text-sm mb-2">OBS Studio Setup</h4>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open OBS Studio and go to Settings → Stream</li>
                  <li>Select "Custom..." as the Service</li>
                  <li>Paste the RTMP URL in the "Server" field</li>
                  <li>Paste the Stream Key in the "Stream Key" field</li>
                  <li>Click Apply and start streaming</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="playback" className="space-y-4 mt-4">
              {/* HLS URL */}
              {hlsPlaybackUrl && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">HLS Playback URL</Label>
                  <div className="flex gap-2">
                    <Input value={hlsPlaybackUrl} readOnly className="font-mono text-sm bg-secondary" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(hlsPlaybackUrl, "HLS URL")}>
                      {copied === "HLS URL" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(hlsPlaybackUrl, "_blank")}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* DASH URL */}
              {dashPlaybackUrl && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">DASH Playback URL</Label>
                  <div className="flex gap-2">
                    <Input value={dashPlaybackUrl} readOnly className="font-mono text-sm bg-secondary" />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(dashPlaybackUrl, "DASH URL")}>
                      {copied === "DASH URL" ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Embed Code */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Embed Code</Label>
                <div className="relative">
                  <pre className="p-3 rounded-lg bg-secondary text-xs font-mono overflow-x-auto">
                    {`<iframe 
  src="${hlsPlaybackUrl?.replace("playlist.m3u8", "embed")}"
  width="640" 
  height="360" 
  frameborder="0" 
  allowfullscreen>
</iframe>`}
                  </pre>
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-transparent"
                    onClick={() =>
                      copyToClipboard(
                        `<iframe src="${hlsPlaybackUrl?.replace("playlist.m3u8", "embed")}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`,
                        "Embed Code",
                      )
                    }
                  >
                    {copied === "Embed Code" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Stream Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new stream key and invalidate the current one.
              {isLive && (
                <span className="block mt-2 text-yellow-500 font-medium">
                  Warning: Your current stream will be disconnected!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
