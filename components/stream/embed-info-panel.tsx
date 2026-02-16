"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Globe, ExternalLink, Save } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EmbedInfoPanelProps {
  embedUrl: string | null
  embedType: "youtube_embed" | "third_party"
  isLive: boolean
  onUpdateUrl?: (url: string) => void
}

export function EmbedInfoPanel({
  embedUrl,
  embedType,
  isLive,
  onUpdateUrl,
}: EmbedInfoPanelProps) {
  const [editUrl, setEditUrl] = useState(embedUrl || "")
  const [isEditing, setIsEditing] = useState(!embedUrl)
  const [copied, setCopied] = useState(false)

  const copyEmbedCode = async () => {
    const code = `<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" })
    }
  }

  const handleSave = () => {
    if (!editUrl.trim()) {
      toast({ title: "URL required", description: "Please enter an embed URL", variant: "destructive" })
      return
    }
    onUpdateUrl?.(editUrl.trim())
    setIsEditing(false)
    toast({ title: "Embed URL updated" })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {embedType === "youtube_embed" ? (
            <>
              <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="white" />
              </svg>
              YouTube Embed
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 text-blue-500" />
              Third Party Embed
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={isLive ? "default" : "secondary"} className={isLive ? "bg-green-600 text-white" : ""}>
            {isLive ? "Active" : "Pending"}
          </Badge>
        </div>

        {/* Embed URL */}
        {isEditing ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {embedType === "youtube_embed"
                ? "YouTube Video/Live URL"
                : "Third Party Embed URL"}
            </Label>
            <Input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder={
                embedType === "youtube_embed"
                  ? "https://www.youtube.com/watch?v=..."
                  : "https://example.com/embed/stream"
              }
              className="bg-secondary border-0 text-sm font-mono"
            />
            <Button size="sm" onClick={handleSave} className="w-full">
              <Save className="h-3 w-3 mr-1" />
              Save URL
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Embed URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted/50 px-2 py-1 text-xs font-mono truncate">
                {embedUrl || "Not configured"}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setIsEditing(true)}
              >
                <Save className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Embed Code */}
        {embedUrl && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Embed Code</p>
            <code className="block rounded bg-muted/50 px-2 py-1 text-xs font-mono break-all">
              {`<iframe src="${embedUrl}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`}
            </code>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {embedUrl && (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={copyEmbedCode}>
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? "Copied" : "Copy Embed"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(embedUrl, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Open Source
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
