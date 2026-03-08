"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Youtube, Plus, Info, Loader2 } from "lucide-react"
import { YouTubeChannelCard } from "@/components/youtube/youtube-channel-card"
import { ConnectYouTubeDialog } from "@/components/youtube/connect-youtube-dialog"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function YouTubeSettingsPage() {
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  const OWNER_ID = user?.id || ""
  const OWNER_TYPE = (user?.role || "streamer") as "streamer" | "studio" | "admin"

  const { data, isLoading, mutate } = useSWR(
    OWNER_ID ? `/api/youtube/channels?ownerId=${OWNER_ID}&ownerType=${OWNER_TYPE}` : null,
    fetcher
  )

  const channels = data?.channels ?? []

  const handleRefreshToken = async (channelDbId: string) => {
    toast({
      title: "Refreshing token...",
      description: "Please wait while we refresh your YouTube access.",
    })

    try {
      const res = await fetch("/api/youtube/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token-refresh", channelDbId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to refresh token")
      }

      await mutate()

      toast({
        title: "Token refreshed",
        description: "Your YouTube channel access has been renewed.",
      })
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: (err as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = async (channelDbId: string) => {
    const channel = channels.find((c: Record<string, string>) => c.id === channelDbId)

    try {
      const res = await fetch("/api/youtube/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", channelDbId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to disconnect")
      }

      await mutate()

      toast({
        title: "Channel disconnected",
        description: `${channel?.channelTitle || "Channel"} has been removed from your account.`,
      })
    } catch (err) {
      toast({
        title: "Disconnect failed",
        description: (err as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleConnectSuccess = () => {
    mutate()
    toast({
      title: "Channel connected",
      description: "Your YouTube channel has been linked to your account.",
    })
  }

  return (
    <div className="min-h-screen">
      <Header title="YouTube Channels" subtitle="Manage your connected YouTube channels for live streaming" />

      <div className="space-y-6 max-w-3xl">
        <Alert className="bg-muted/50 border-border">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Connect your YouTube channels to create live broadcasts directly from StreamLivee. You can connect multiple
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : channels.length === 0 ? (
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
              channels.map((channel: Record<string, string>) => (
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
                <span>{"Click \"Connect Channel\" and sign in with your Google account"}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  2
                </span>
                <span>Grant StreamLivee permission to manage your live streams</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  3
                </span>
                <span>{"When creating an event, select \"YouTube API\" and choose your channel"}</span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                  4
                </span>
                <span>StreamLivee will automatically create the broadcast and provide RTMP credentials</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <ConnectYouTubeDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
        ownerId={OWNER_ID}
        ownerType={OWNER_TYPE}
        returnUrl="/streamer/settings/youtube"
        onSuccess={handleConnectSuccess}
      />
    </div>
  )
}
