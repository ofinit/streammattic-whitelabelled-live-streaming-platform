"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Video, Youtube, Play, Globe } from "lucide-react"
import type { StreamTypeKey } from "@/lib/types"
import { streamTypePricing } from "@/lib/demo-user-states"

interface DemoStreamTypeSelectorProps {
  value: StreamTypeKey | ""
  onChange: (value: StreamTypeKey) => void
  availableEvents: number | null
}

const streamTypes: {
  id: StreamTypeKey
  name: string
  description: string
  icon: typeof Video
  color: string
}[] = [
  {
    id: "rtmp",
    name: "Live Server (RTMP)",
    description: "Stream using OBS, vMix, or any RTMP encoder. Full HD quality with DVR recording.",
    icon: Video,
    color: "primary",
  },
  {
    id: "youtube_api",
    name: "YouTube API",
    description: "Auto-create YouTube broadcast from your connected channel. Seamless integration.",
    icon: Youtube,
    color: "red-500",
  },
  {
    id: "youtube_embed",
    name: "YouTube Embed",
    description: "Embed your YouTube live stream. Great for public events with large audiences.",
    icon: Play,
    color: "blue-500",
  },
  {
    id: "third_party",
    name: "Third Party URL",
    description: "Embed any HLS (.m3u8) stream URL from external providers.",
    icon: Globe,
    color: "purple-500",
  },
]

export function DemoStreamTypeSelector({ value, onChange, availableEvents }: DemoStreamTypeSelectorProps) {
  const getAvailabilityText = (typeId: StreamTypeKey) => {
    // If user has available events from package
    if (availableEvents !== null && availableEvents > 0) {
      return `${availableEvents} events available from your package`
    }

    // If package is depleted
    if (availableEvents === 0) {
      const price = streamTypePricing[typeId]
      return `0 events remaining - Pay ₹${price.toLocaleString()}/event`
    }

    // No package - show pricing
    const price = streamTypePricing[typeId]
    return `₹${price.toLocaleString()}/event`
  }

  const getAvailabilityColor = (typeId: StreamTypeKey) => {
    if (availableEvents !== null && availableEvents > 0) {
      return "text-green-500"
    }
    if (availableEvents === 0) {
      return "text-orange-500"
    }
    return "text-muted-foreground"
  }

  return (
    <div className="space-y-3">
      {streamTypes.map((type) => {
        const Icon = type.icon
        const isSelected = value === type.id

        return (
          <Card
            key={type.id}
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              isSelected ? "ring-2 ring-primary border-primary" : ""
            }`}
            onClick={() => onChange(type.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{type.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                  <p className={`text-sm font-medium mt-2 ${getAvailabilityColor(type.id)}`}>
                    {getAvailabilityText(type.id)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
