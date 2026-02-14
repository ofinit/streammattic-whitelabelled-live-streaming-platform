"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Youtube, AlertCircle } from "lucide-react"
import type { YouTubeChannel } from "@/lib/types"
import { ConnectYouTubeDialog } from "./connect-youtube-dialog"

interface YouTubeChannelSelectorProps {
  channels: YouTubeChannel[]
  selectedChannelId: string | null
  onSelectChannel: (channelId: string | null) => void
  broadcastSettings: {
    privacyStatus: "public" | "unlisted" | "private"
    enableDvr: boolean
    enableAutoStart: boolean
    enableAutoStop: boolean
  }
  onSettingsChange: (settings: {
    privacyStatus: "public" | "unlisted" | "private"
    enableDvr: boolean
    enableAutoStart: boolean
    enableAutoStop: boolean
  }) => void
  onChannelConnected: (channel: YouTubeChannel) => void
}

export function YouTubeChannelSelector({
  channels,
  selectedChannelId,
  onSelectChannel,
  broadcastSettings,
  onSettingsChange,
  onChannelConnected,
}: YouTubeChannelSelectorProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  const selectedChannel = channels.find((c) => c.id === selectedChannelId)

  const handleConnectSuccess = (data: {
    channelId: string
    channelTitle: string
    channelThumbnail: string
    accessToken: string
    refreshToken: string
  }) => {
    const newChannel: YouTubeChannel = {
      id: `yt-${Date.now()}`,
      ownerId: "current-user",
      ownerType: "user",
      channelId: data.channelId,
      channelTitle: data.channelTitle,
      channelThumbnail: data.channelThumbnail,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: new Date(Date.now() + 3600000),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    onChannelConnected(newChannel)
    onSelectChannel(newChannel.id)
  }

  if (channels.length === 0) {
    return (
      <div className="space-y-4">
        <Alert className="bg-muted/50 border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No YouTube channels connected. Connect a channel to create broadcasts directly from StreamMattic.
          </AlertDescription>
        </Alert>

        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed bg-transparent"
          onClick={() => setShowConnectDialog(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Connect YouTube Channel
        </Button>

        <ConnectYouTubeDialog
          open={showConnectDialog}
          onOpenChange={setShowConnectDialog}
          onSuccess={handleConnectSuccess}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select YouTube Channel</Label>
        <div className="grid gap-2">
          {channels.map((channel) => (
            <Card
              key={channel.id}
              className={`cursor-pointer transition-colors ${
                selectedChannelId === channel.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
              }`}
              onClick={() => onSelectChannel(channel.id)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={channel.channelThumbnail || "/placeholder.svg"} />
                  <AvatarFallback className="bg-red-600 text-white">{channel.channelTitle.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">{channel.channelTitle}</p>
                  <p className="text-xs text-muted-foreground">{channel.channelId.substring(0, 16)}...</p>
                </div>
                {selectedChannelId === channel.id && <Badge className="bg-primary">Selected</Badge>}
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="border-dashed bg-transparent"
            onClick={() => setShowConnectDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Connect Another Channel
          </Button>
        </div>
      </div>

      {selectedChannel && (
        <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
          <h4 className="font-medium flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-500" />
            Broadcast Settings
          </h4>

          <div className="space-y-2">
            <Label>Privacy</Label>
            <Select
              value={broadcastSettings.privacyStatus}
              onValueChange={(value: "public" | "unlisted" | "private") =>
                onSettingsChange({ ...broadcastSettings, privacyStatus: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can watch</SelectItem>
                <SelectItem value="unlisted">Unlisted - Only with link</SelectItem>
                <SelectItem value="private">Private - Only you</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable DVR</p>
                <p className="text-xs text-muted-foreground">Allow viewers to rewind live stream</p>
              </div>
              <Switch
                checked={broadcastSettings.enableDvr}
                onCheckedChange={(checked) => onSettingsChange({ ...broadcastSettings, enableDvr: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Start Broadcast</p>
                <p className="text-xs text-muted-foreground">Go live automatically when stream is healthy</p>
              </div>
              <Switch
                checked={broadcastSettings.enableAutoStart}
                onCheckedChange={(checked) => onSettingsChange({ ...broadcastSettings, enableAutoStart: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-Stop Broadcast</p>
                <p className="text-xs text-muted-foreground">End broadcast when stream stops</p>
              </div>
              <Switch
                checked={broadcastSettings.enableAutoStop}
                onCheckedChange={(checked) => onSettingsChange({ ...broadcastSettings, enableAutoStop: checked })}
              />
            </div>
          </div>
        </div>
      )}

      <ConnectYouTubeDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onSuccess={handleConnectSuccess}
      />
    </div>
  )
}
