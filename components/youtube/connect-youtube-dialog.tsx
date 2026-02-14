"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Youtube, Shield, Video, Settings } from "lucide-react"

interface ConnectYouTubeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (channelData: {
    channelId: string
    channelTitle: string
    channelThumbnail: string
    accessToken: string
    refreshToken: string
  }) => void
}

export function ConnectYouTubeDialog({ open, onOpenChange, onSuccess }: ConnectYouTubeDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")

  const handleConnect = async () => {
    setIsConnecting(true)
    setError("")

    try {
      // In production, this would open a popup or redirect to Google OAuth
      // For demo, we simulate the OAuth flow
      await new Promise((r) => setTimeout(r, 2000))

      // Simulate successful OAuth
      const mockChannelData = {
        channelId: `UC${Math.random().toString(36).substring(2, 15)}`,
        channelTitle: "My YouTube Channel",
        channelThumbnail: "/youtube-channel-avatar.png",
        accessToken: `ya29.mock_${Date.now()}`,
        refreshToken: `1//mock_refresh_${Date.now()}`,
      }

      onSuccess(mockChannelData)
      onOpenChange(false)
    } catch (err) {
      setError("Failed to connect YouTube channel. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-6 w-6 text-red-500" />
            Connect YouTube Channel
          </DialogTitle>
          <DialogDescription>
            Link your YouTube channel to create live broadcasts directly from StreamMattic
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">What you can do after connecting:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Video className="h-4 w-4 mt-0.5 text-primary" />
                Create live broadcasts without opening YouTube Studio
              </li>
              <li className="flex items-start gap-2">
                <Settings className="h-4 w-4 mt-0.5 text-primary" />
                Get RTMP credentials automatically for each event
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-primary" />
                Control stream state (go live, end stream) with one click
              </li>
            </ul>
          </div>

          <Alert className="bg-muted/50 border-border">
            <AlertDescription className="text-xs">
              StreamMattic will request permission to manage your YouTube live streams. We will never post videos or
              access your private content without your action.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Youtube className="h-4 w-4 mr-2" />
                Connect with Google
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">You can connect multiple YouTube channels</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
