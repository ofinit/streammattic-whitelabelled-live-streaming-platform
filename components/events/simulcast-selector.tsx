"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Youtube, Facebook, Radio } from "lucide-react"
import { formatCurrency, getSimulcastPrice } from "@/lib/cascade-wallet-service"

interface SimulcastSelectorProps {
  value: ("youtube" | "facebook" | "custom_rtmp")[]
  onChange: (value: ("youtube" | "facebook" | "custom_rtmp")[]) => void
  showPricing?: boolean
  userLevel?: "admin" | "reseller" | "sub_reseller" | "user"
}

const simulcastOptions: {
  id: "youtube" | "facebook" | "custom_rtmp"
  name: string
  description: string
  icon: typeof Youtube
  color: string
}[] = [
  {
    id: "youtube",
    name: "YouTube Live",
    description: "Stream to your YouTube channel",
    icon: Youtube,
    color: "red-500",
  },
  {
    id: "facebook",
    name: "Facebook Live",
    description: "Stream to your Facebook page",
    icon: Facebook,
    color: "blue-600",
  },
  {
    id: "custom_rtmp",
    name: "Custom RTMP",
    description: "Twitch, Twitter/X, LinkedIn, etc.",
    icon: Radio,
    color: "purple-500",
  },
]

export function SimulcastSelector({ value, onChange, showPricing = true, userLevel = "user" }: SimulcastSelectorProps) {
  const toggleDestination = (id: "youtube" | "facebook" | "custom_rtmp") => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id))
    } else {
      onChange([...value, id])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-sm">Simulcast Destinations</h3>
          <p className="text-xs text-muted-foreground">Stream to multiple platforms simultaneously (optional)</p>
        </div>
        {value.length > 0 && <Badge variant="secondary">{value.length} selected</Badge>}
      </div>

      <div className="space-y-2">
        {simulcastOptions.map((option) => {
          const Icon = option.icon
          const isSelected = value.includes(option.id)
          const price = getSimulcastPrice(option.id === "custom_rtmp" ? "custom_rtmp" : option.id, userLevel)

          return (
            <Card
              key={option.id}
              className={`transition-all ${isSelected ? "ring-1 ring-primary border-primary" : ""}`}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${option.color}/10`}>
                    <Icon className={`h-4 w-4 text-${option.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor={option.id} className="font-medium text-sm cursor-pointer">
                          {option.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {showPricing && (
                          <span className="text-sm font-medium text-primary">+{formatCurrency(price)}</span>
                        )}
                        <Switch
                          id={option.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleDestination(option.id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
