"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Video,
  Youtube,
  Globe,
  MoreVertical,
  Play,
  Square,
  Edit,
  Trash,
  Eye,
  Copy,
  ExternalLink,
  Users,
  Lock,
} from "lucide-react"
import type { LiveEvent } from "@/lib/types"
import { format } from "date-fns"
import { useRouter } from "next/navigation"

interface EventCardProps {
  event: LiveEvent
  onEdit?: (event: LiveEvent) => void
  onDelete?: (event: LiveEvent) => void
  onStart?: (event: LiveEvent) => void
  onStop?: (event: LiveEvent) => void
}

export function EventCard({ event, onEdit, onDelete, onStart, onStop }: EventCardProps) {
  const router = useRouter()

  const openControlRoom = () => {
    router.push(`/streamer/events/${event.id}/stream`)
  }

  const getStreamIcon = () => {
    switch (event.streamType) {
      case "youtube":
        return <Youtube className="h-4 w-4" />
      case "embedded":
        return <Globe className="h-4 w-4" />
      default:
        return <Video className="h-4 w-4" />
    }
  }

  const getStatusColor = () => {
    switch (event.status) {
      case "live":
        return "bg-red-500"
      case "scheduled":
        return "bg-blue-500"
      case "completed":
        return "bg-gray-500"
      case "draft":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src={
            event.thumbnail ||
            `/placeholder.svg?height=180&width=320&query=${encodeURIComponent(event.title + " event thumbnail")}`
          }
          alt={event.title}
          className="w-full h-40 object-cover"
        />
        <div className="absolute top-2 left-2 flex items-center gap-2">
          <Badge className={`${getStatusColor()} text-white`}>
            {event.status === "live" && (
              <span className="mr-1 h-2 w-2 rounded-full bg-white animate-pulse inline-block" />
            )}
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>
          {event.isPasswordProtected && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
            </Badge>
          )}
        </div>
        {event.status === "live" && (
          <div className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1 flex items-center gap-1">
            <Users className="h-3 w-3 text-white" />
            <span className="text-xs text-white font-medium">{event.currentViewers}</span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold line-clamp-1">{event.title}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(`/watch/${event.id}`, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Event Page
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/watch/${event.id}`)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(event)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem onClick={() => onDelete(event)} className="text-destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description || "No description"}</p>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            {getStreamIcon()}
            <span className="capitalize">{event.streamType}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{event.totalViews.toLocaleString()}</span>
          </div>
        </div>

        {event.scheduledAt && (
          <p className="text-xs text-muted-foreground mb-3">
            {event.status === "scheduled" ? "Scheduled for " : ""}
            {format(new Date(event.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}

        <div className="flex gap-2">
          {event.status === "draft" || event.status === "scheduled" ? (
            <Button size="sm" className="flex-1" onClick={openControlRoom}>
              <Play className="h-4 w-4 mr-1" />
              Go Live
            </Button>
          ) : event.status === "live" ? (
            <Button size="sm" variant="destructive" className="flex-1" onClick={openControlRoom}>
              <Square className="h-4 w-4 mr-1" />
              Control Room
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex-1 bg-transparent" onClick={openControlRoom}>
              View Details
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit?.(event)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
