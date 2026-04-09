"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Youtube, AlertCircle } from "lucide-react"
import { ConnectYouTubeDialog } from "./connect-youtube-dialog"
import { getYoutubeSettingsHref } from "@/lib/youtube-settings-path"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ChannelData {
  id: string
  channelId: string
  channelTitle: string
  channelThumbnail?: string | null
  subscriberCount?: number
  tokenStatus: "valid" | "expired"
  isActive: boolean
}

interface YouTubeChannelSelectorProps {
  ownerId: string
  ownerType: "admin" | "studio" | "streamer"
  selectedChannelId: string | null
  onSelectChannel: (channelDbId: string | null) => void
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
  getDraftState?: () => {
    title?: string
    slug?: string
    scheduledAt?: string
    timezone?: string
  }
  oauthContext?: {
    mode?: "edit" | "create"
    eventId?: string
  }
}

export function YouTubeChannelSelector({
  ownerId,
  ownerType,
  selectedChannelId,
  onSelectChannel,
  broadcastSettings,
  onSettingsChange,
  getDraftState,
  oauthContext,
}: YouTubeChannelSelectorProps) {
  const [showConnectDialog, setShowConnectDialog] = useState(false)

  const openConnectDialog = () => {
    if (oauthContext) {
      try {
        sessionStorage.setItem("yt_oauth_context", JSON.stringify(oauthContext))
      } catch {
        // ignore storage errors
      }
    }
    if (getDraftState) {
      try {
        const draft = getDraftState()
        sessionStorage.setItem("yt_oauth_draft_event", JSON.stringify(draft))
      } catch {
        // ignore storage errors
      }
    }
    setShowConnectDialog(true)
  }

  const { data, mutate } = useSWR(
    ownerId ? `/api/youtube/channels?ownerId=${ownerId}&ownerType=${ownerType}` : null,
    fetcher
  )

  const channels: ChannelData[] = (data?.channels ?? []).filter(
    (c: ChannelData) => c.isActive
  )

  const selectedChannel = channels.find((c) => c.id === selectedChannelId)
  const selectedChannelExpired = !!selectedChannel && selectedChannel.tokenStatus === "expired"

  const settingsHref = getYoutubeSettingsHref(ownerType)

  if (channels.length === 0) {
    return (
      <div className="space-y-4">
        <Alert className="bg-muted/50 border-border">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <span className="block">
              No YouTube channels connected. Connect a channel to create broadcasts directly from StreamLivee.
            </span>
            <span className="block text-sm">
              <Link href={settingsHref} className="font-medium text-primary underline underline-offset-4">
                Open YouTube settings
              </Link>{" "}
              to configure channels.
            </span>
          </AlertDescription>
        </Alert>

        <Button type="button" variant="outline" className="w-full border-dashed bg-transparent" onClick={openConnectDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Connect YouTube Channel
        </Button>

        <ConnectYouTubeDialog
          open={showConnectDialog}
          onOpenChange={setShowConnectDialog}
          ownerId={ownerId}
          ownerType={ownerType}
          contextStreamType="youtube_api"
          onSuccess={() => mutate()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select YouTube Channel</Label>
        {selectedChannelExpired && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/40 mb-1">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The selected channel&apos;s YouTube access has expired. Please reconnect the channel to continue using
              YouTube API broadcasts.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid gap-2">
          {channels.map((channel) => (
            <Card
              key={channel.id}
              className={`cursor-pointer transition-colors border-border/60 bg-card/40 ${
                selectedChannelId === channel.id ? "border-primary bg-primary/10" : "hover:border-primary/60"
              }`}
              onClick={() => {
                if (channel.tokenStatus === "expired") {
                  // For expired channels, guide user to reconnect instead of just selecting
                  onSelectChannel(null)
                  openConnectDialog()
                } else {
                  onSelectChannel(channel.id)
                }
              }}
            >
              <CardContent className="px-3 py-2 flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={channel.channelThumbnail || "/placeholder.svg"} />
                  <AvatarFallback className="bg-red-600 text-white">{channel.channelTitle.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm truncate">{channel.channelTitle}</p>
                  {channel.tokenStatus === "expired" && (
                    <p className="text-[11px] text-muted-foreground">
                      Access expired - click to{" "}
                      <span className="font-semibold text-primary underline underline-offset-2">reconnect</span>{" "}
                      this channel.
                    </p>
                  )}
                </div>
                {channel.tokenStatus === "expired" && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Token Expired</Badge>
                )}
                {selectedChannelId === channel.id && (
                  <Badge className="bg-primary/90 text-[10px] px-1.5 py-0">Selected</Badge>
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="border-dashed bg-transparent text-xs h-8"
            onClick={openConnectDialog}
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
        ownerId={ownerId}
        ownerType={ownerType}
        contextStreamType="youtube_api"
        onSuccess={() => mutate()}
      />
    </div>
  )
}
