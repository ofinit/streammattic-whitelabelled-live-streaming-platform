"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Youtube } from "lucide-react"

interface StreamerYouTubeOverrideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  streamer: { id: string; name: string } | null
}

export function StreamerYouTubeOverrideDialog({
  open,
  onOpenChange,
  streamer,
}: StreamerYouTubeOverrideDialogProps) {
  const [overrideAllowed, setOverrideAllowed] = useState(false)
  const [overrideLoading, setOverrideLoading] = useState(false)

  useEffect(() => {
    if (!open || !streamer?.id) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/admin/youtube-override?entityType=streamer&entityId=${encodeURIComponent(streamer.id)}`
        )
        if (!cancelled && res.ok) {
          const data = await res.json()
          setOverrideAllowed(Boolean(data?.allowed))
        }
      } catch {
        if (!cancelled) setOverrideAllowed(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, streamer?.id])

  const handleOverrideChange = async (checked: boolean) => {
    if (!streamer?.id) return
    setOverrideAllowed(checked)
    setOverrideLoading(true)
    try {
      const res = await fetch("/api/admin/youtube-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "streamer",
          entityId: streamer.id,
          allowed: checked,
        }),
      })
      if (!res.ok) throw new Error("Failed to save")
    } catch {
      setOverrideAllowed(!checked)
    } finally {
      setOverrideLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Show YouTube API Configuration in dashboard
          </DialogTitle>
          <DialogDescription>
            By default the admin configures YouTube API for everyone. When enabled, {streamer?.name ?? "this streamer"} will see the YouTube Channels / API Configuration page in their dashboard and can configure it themselves.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
          <div className="space-y-0.5">
            <Label htmlFor="streamer-override" className="text-sm font-medium cursor-pointer">
              Show YouTube API Configuration in this streamer&apos;s dashboard
            </Label>
            <p className="text-xs text-muted-foreground">
              When ON, they can view and configure YouTube API (YouTube Channels page). When OFF, they follow the platform setting.
            </p>
          </div>
          <Switch
            id="streamer-override"
            checked={overrideAllowed}
            onCheckedChange={handleOverrideChange}
            disabled={overrideLoading}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
