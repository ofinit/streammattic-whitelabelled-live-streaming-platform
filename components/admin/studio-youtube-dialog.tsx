"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Youtube, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw, Trash2 } from "lucide-react"
import { mockYouTubeChannels } from "@/lib/mock-data"
import type { Studio, YouTubeChannel } from "@/lib/types"

interface StudioYouTubeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studio: Studio
}

export function StudioYouTubeDialog({ open, onOpenChange, studio }: StudioYouTubeDialogProps) {
  const existingChannels = mockYouTubeChannels.filter((c) => c.ownerId === studio.id)
  const [channelId, setChannelId] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [showSecret, setShowSecret] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [overrideAllowed, setOverrideAllowed] = useState(false)
  const [overrideLoading, setOverrideLoading] = useState(false)

  useEffect(() => {
    if (!open || !studio?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/admin/youtube-override?entityType=studio&entityId=${encodeURIComponent(studio.id)}`
        )
        if (!cancelled && res.ok) {
          const data = await res.json()
          setOverrideAllowed(Boolean(data?.allowed))
        }
      } catch {
        if (!cancelled) setOverrideAllowed(false)
      }
    })()
    return () => { cancelled = true }
  }, [open, studio?.id])

  const handleOverrideChange = async (checked: boolean) => {
    setOverrideAllowed(checked)
    setOverrideLoading(true)
    try {
      const res = await fetch("/api/admin/youtube-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType: "studio", entityId: studio.id, allowed: checked }),
      })
      if (!res.ok) throw new Error("Failed to save")
    } catch {
      setOverrideAllowed(!checked)
    } finally {
      setOverrideLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    if (apiKey && channelId) {
      setTestResult({ success: true, message: "Connection successful. YouTube API credentials are valid." })
    } else {
      setTestResult({ success: false, message: "Please provide both API Key and Channel ID." })
    }
    setIsTesting(false)
  }

  const handleSave = async () => {
    if (!apiKey || !channelId) return
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const getTokenBadge = (channel: YouTubeChannel) => {
    if (channel.tokenStatus === "valid") {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      )
    }
    return (
      <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">
        <AlertCircle className="h-3 w-3 mr-1" />
        Token Expired
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube API Configuration
          </DialogTitle>
          <DialogDescription>
            Configure YouTube API credentials for {studio.name} to enable live streaming.
          </DialogDescription>
        </DialogHeader>

        {/* Override: show YouTube API Configuration in this studio's dashboard */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="studio-override" className="text-sm font-medium cursor-pointer">
              Show YouTube API Configuration in this studio&apos;s dashboard
            </Label>
            <p className="text-xs text-muted-foreground">
              When ON, this studio will see the Integrations page and can view and configure YouTube API themselves. When OFF, they follow the platform setting (admin configures for all by default).
            </p>
          </div>
          <Switch
            id="studio-override"
            checked={overrideAllowed}
            onCheckedChange={handleOverrideChange}
            disabled={overrideLoading}
          />
        </div>

        <div className="space-y-6 pt-2">
          {/* Existing Connected Channels */}
          {existingChannels.length > 0 && (
            <div className="space-y-3">
              <Label>Connected Channels</Label>
              {existingChannels.map((channel) => (
                <div key={channel.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Youtube className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{channel.channelTitle}</p>
                      <p className="text-xs text-muted-foreground font-mono">{channel.channelId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTokenBadge(channel)}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add / Update Credentials */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              {existingChannels.length > 0 ? "Add Another Channel" : "Connect YouTube Channel"}
            </Label>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="yt-channel-id" className="text-sm">YouTube Channel ID</Label>
                <Input
                  id="yt-channel-id"
                  placeholder="e.g. UC1234567890abcdef"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="yt-api-key" className="text-sm">YouTube Data API Key</Label>
                <Input
                  id="yt-api-key"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  From Google Cloud Console &gt; APIs &amp; Services &gt; Credentials
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="yt-client-id" className="text-sm">OAuth Client ID (optional)</Label>
                <Input
                  id="yt-client-id"
                  placeholder="123456789-abcdef.apps.googleusercontent.com"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="yt-client-secret" className="text-sm">OAuth Client Secret (optional)</Label>
                <div className="relative">
                  <Input
                    id="yt-client-secret"
                    type={showSecret ? "text" : "password"}
                    placeholder="GOCSPX-..."
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowSecret(!showSecret)}
                    type="button"
                  >
                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for OAuth-based live streaming. Channel owner will need to authorize access.
                </p>
              </div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`rounded-lg border p-3 ${testResult.success ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <p className={`text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleTestConnection}
              disabled={isTesting || (!apiKey && !channelId)}
            >
              {isTesting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving || !apiKey || !channelId}
            >
              {isSaving ? "Saving..." : "Save Credentials"}
            </Button>
          </div>

          {/* Help */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-foreground">Setup Guide</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4">
              <li>Go to Google Cloud Console and create a project</li>
              <li>Enable the YouTube Data API v3 and YouTube Live Streaming API</li>
              <li>Create an API Key under Credentials</li>
              <li>For live streaming: Create OAuth 2.0 Client ID (Web application)</li>
              <li>Enter the credentials above and test the connection</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
