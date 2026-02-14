"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Youtube, Plus, Info } from "lucide-react"
import type { YouTubeChannel } from "@/lib/types"
import { YouTubeChannelCard } from "@/components/youtube/youtube-channel-card"
import { ConnectYouTubeDialog } from "@/components/youtube/connect-youtube-dialog"
import { useToast } from "@/hooks/use-toast"

// Mock initial channels
const initialChannels: YouTubeChannel[] = [
  {
    id: "yt-1",
    ownerId: "user-1",
    ownerType: "user",
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    channelTitle: "My Live Streaming Channel",
    channelThumbnail: "/youtube-channel-avatar.png",
    accessToken: "ya29.mock_token_1",
    refreshToken: "1//mock_refresh_1",
    tokenExpiresAt: new Date(Date.now() + 3600000),
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
  },
]

export default function YouTubeSettingsPage() {
  const [channels, setChannels] = useState<YouTubeChannel[]>(initialChannels)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const { toast } = useToast()

  const handleRefreshToken = async (channelId: string) => {
    toast({
      title: "Refreshing token...",
      description: "Please wait while we refresh your YouTube access.",
    })

    // Simulate token refresh
    await new Promise((r) => setTimeout(r, 1500))

    setChannels(
      channels.map((c) =>
        c.id === channelId ? { ...c, tokenExpiresAt: new Date(Date.now() + 3600000), updatedAt: new Date() } : c,
      ),
    )

    toast({
      title: "Token refreshed",
      description: "Your YouTube channel access has been renewed.",
    })
  }

  const handleDisconnect = async (channelId: string) => {
    const channel = channels.find((c) => c.id === channelId)

    // Simulate disconnect
    await new Promise((r) => setTimeout(r, 500))

    setChannels(channels.filter((c) => c.id !== channelId))

    toast({
      title: "Channel disconnected",
      description: `${channel?.channelTitle} has been removed from your account.`,
    })
  }

  const handleConnectSuccess = (data: {
    channelId: string
    channelTitle: string
    channelThumbnail: string
    accessToken: string
    refreshToken: string
  }) => {
    const newChannel: YouTubeChannel = {
      id: `yt-${Date.now()}`,
      ownerId: "user-1",
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

    setChannels([...channels, newChannel])

    toast({
      title: "Channel connected",
      description: `${data.channelTitle} has been linked to your account.`,
    })
  }

  return (
    <div className="min-h-screen">
      <Header title="YouTube Channels" subtitle="Manage your connected YouTube channels for live streaming" />

      <div className="p-6 space-y-6 max-w-3xl">
        <Alert className="bg-muted/50 border-border">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Connect your YouTube channels to create live broadcasts directly from StreamMattic. You can connect multiple
            channels and choose which one to use for each event.
          </AlertDescription>
        </Alert>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20">
                  <Youtube className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle>Connected Channels</CardTitle>
                  <CardDescription>
                    {channels.length} channel{channels.length !== 1 ? "s" : ""} connected
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => setShowConnectDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Channel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {channels.length === 0 ? (
              <div className="text-center py-8">
                <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-foreground mb-1">No channels connected</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Connect a YouTube channel to start creating live broadcasts
                </p>
                <Button onClick={() => setShowConnectDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Your First Channel
                </Button>
              </div>
            ) : (
              channels.map((channel) => (
                <YouTubeChannelCard
                  key={channel.id}
                  channel={channel}
                  onRefresh={handleRefreshToken}
                  onDisconnect={handleDisconnect}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  1
                </span>
                <span>Click "Connect Channel" and sign in with your Google account</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  2
                </span>
                <span>Grant StreamMattic permission to manage your live streams</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  3
                </span>
                <span>When creating an event, select "YouTube API" and choose your channel</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  4
                </span>
                <span>StreamMattic will automatically create the broadcast and provide RTMP credentials</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <ConnectYouTubeDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        onSuccess={handleConnectSuccess}
      />
    </div>
  )
}
