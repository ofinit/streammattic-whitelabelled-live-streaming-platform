"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Youtube, Shield, Video, Settings } from "lucide-react"

interface ConnectYouTubeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ownerId: string
  ownerType: "admin" | "studio" | "user"
  returnUrl?: string
  onSuccess?: () => void
}

export function ConnectYouTubeDialog({
  open,
  onOpenChange,
  ownerId,
  ownerType,
  returnUrl,
  onSuccess,
}: ConnectYouTubeDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")

  // Listen for the OAuth callback redirect message
  const handleOAuthComplete = useCallback(() => {
    // After the popup completes, check URL params for success/error
    const params = new URLSearchParams(window.location.search)
    const connected = params.get("yt_connected")
    const ytError = params.get("yt_error")

    if (connected) {
      // Clean up URL params
      const url = new URL(window.location.href)
      url.searchParams.delete("yt_connected")
      window.history.replaceState({}, "", url.toString())

      setIsConnecting(false)
      onOpenChange(false)
      onSuccess?.()
    } else if (ytError) {
      const url = new URL(window.location.href)
      url.searchParams.delete("yt_error")
      window.history.replaceState({}, "", url.toString())

      setError(ytError)
      setIsConnecting(false)
    }
  }, [onOpenChange, onSuccess])

  useEffect(() => {
    // Check on mount in case we just returned from OAuth redirect
    handleOAuthComplete()
  }, [handleOAuthComplete])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError("")

    try {
      // Request the OAuth URL from our backend
      const res = await fetch("/api/auth/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          ownerType,
          returnUrl: returnUrl || window.location.pathname,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to start OAuth flow")
      }

      const { url } = await res.json()

      // Redirect to Google OAuth consent screen (same tab)
      // After consent, Google redirects to /api/auth/youtube/callback
      // which processes tokens and redirects back to returnUrl with yt_connected param
      window.location.href = url
    } catch (err) {
      setError((err as Error).message || "Failed to connect YouTube channel. Please try again.")
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
