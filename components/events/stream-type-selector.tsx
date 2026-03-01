"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Video, Youtube, Play, Globe } from "lucide-react"
import type { StreamTypeKey } from "@/lib/types"

interface StreamTypeSelectorProps {
  value: StreamTypeKey | ""
  onChange: (value: StreamTypeKey) => void
  showPricing?: boolean
  userLevel?: "admin" | "studio" | "streamer"
}

const streamTypes: {
  id: StreamTypeKey
  name: string
  description: string
  availability: string
  icon: typeof Video
  color: string
  recommended?: boolean
}[] = [
  {
    id: "rtmp",
    name: "Live Server (RTMP)",
    description: "Stream using OBS, vMix, or any RTMP encoder. Full HD quality with DVR recording.",
    availability: "12 events available from your package",
    icon: Video,
    color: "primary",
  },
  {
    id: "youtube_api",
    name: "YouTube API",
    description: "Auto-create YouTube broadcast from your connected channel. Seamless integration.",
    availability: "Free - No package required",
    icon: Youtube,
    color: "red-500",
    recommended: true,
  },
  {
    id: "youtube_embed",
    name: "YouTube Embed",
    description: "Embed your YouTube live stream. Great for public events with large audiences.",
    availability: "Free - No package required",
    icon: Play,
    color: "blue-500",
  },
  {
    id: "third_party",
    name: "Third Party URL",
    description: "Embed any HLS (.m3u8) stream URL from external providers.",
    availability: "Free - No package required",
    icon: Globe,
    color: "purple-500",
  },
]

export function StreamTypeSelector({
  value,
  onChange,
  showPricing = true,
  userLevel = "streamer",
}: StreamTypeSelectorProps) {
  return (
    <div className="space-y-3">
      {streamTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.id

        return (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:border-${type.color}/50 ${
              isSelected ? `ring-2 ring-${type.color} border-${type.color}` : ""
            }`}
            onClick={() => onChange(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-${type.color}/10`}>
                  <Icon className={`h-5 w-5 text-${type.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{type.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                  <p className="text-sm font-medium text-green-500 mt-2">{type.availability}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
