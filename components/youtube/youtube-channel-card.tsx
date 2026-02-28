"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, RefreshCw, Trash2, ExternalLink, CheckCircle, Users, Video } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

/** Shape returned by GET /api/youtube/channels (no raw tokens exposed) */
interface ChannelData {
  id: string
  channelId: string
  channelTitle: string
  channelThumbnail?: string | null
  subscriberCount?: number
  videoCount?: number
  isActive: boolean
  tokenStatus: "valid" | "expired"
  tokenExpiresAt?: string
  createdAt: string
  updatedAt: string
}

interface YouTubeChannelCardProps {
  channel: ChannelData | Record<string, unknown>
  onRefresh: (channelDbId: string) => void
  onDisconnect: (channelDbId: string) => void
}

export function YouTubeChannelCard({ channel, onRefresh, onDisconnect }: YouTubeChannelCardProps) {
  const ch = channel as ChannelData
  const isTokenExpired = ch.tokenStatus === "expired"

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={ch.channelThumbnail || "/placeholder.svg"} alt={ch.channelTitle} />
              <AvatarFallback className="bg-red-600 text-white text-lg">
                {ch.channelTitle?.charAt(0) || "Y"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{ch.channelTitle}</h3>
                {ch.isActive && !isTokenExpired && <CheckCircle className="h-4 w-4 text-emerald-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                youtube.com/channel/{ch.channelId?.substring(0, 12)}...
              </p>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={isTokenExpired ? "destructive" : "secondary"} className="text-xs">
                  {isTokenExpired ? "Token Expired" : "Connected"}
                </Badge>
                {typeof ch.subscriberCount === "number" && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {ch.subscriberCount.toLocaleString()} subs
                  </span>
                )}
                {typeof ch.videoCount === "number" && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    {ch.videoCount.toLocaleString()} videos
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Added {ch.createdAt ? formatRelativeTime(new Date(ch.createdAt)) : "recently"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onRefresh(ch.id)} disabled={!isTokenExpired}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Token
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => window.open(`https://youtube.com/channel/${ch.channelId}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on YouTube
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDisconnect(ch.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
