"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical, RefreshCw, Trash2, ExternalLink, CheckCircle } from "lucide-react"
import type { YouTubeChannel } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"

interface YouTubeChannelCardProps {
  channel: YouTubeChannel
  onRefresh: (channelId: string) => void
  onDisconnect: (channelId: string) => void
}

export function YouTubeChannelCard({ channel, onRefresh, onDisconnect }: YouTubeChannelCardProps) {
  const isTokenExpired = new Date(channel.tokenExpiresAt) < new Date()

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={channel.channelThumbnail || "/placeholder.svg"} alt={channel.channelTitle} />
              <AvatarFallback className="bg-red-600 text-white text-lg">
                {channel.channelTitle.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{channel.channelTitle}</h3>
                {channel.isActive && !isTokenExpired && <CheckCircle className="h-4 w-4 text-emerald-500" />}
              </div>
              <p className="text-sm text-muted-foreground">
                youtube.com/channel/{channel.channelId.substring(0, 12)}...
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isTokenExpired ? "destructive" : "secondary"} className="text-xs">
                  {isTokenExpired ? "Token Expired" : "Connected"}
                </Badge>
                <span className="text-xs text-muted-foreground">Added {formatRelativeTime(channel.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onRefresh(channel.id)} disabled={!isTokenExpired}>
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
                  onClick={() => window.open(`https://youtube.com/channel/${channel.channelId}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on YouTube
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDisconnect(channel.id)}>
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
