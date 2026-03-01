"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Video, Youtube, MonitorPlay, Globe, Save, IndianRupee } from "lucide-react"
import type { StreamTypePriceLevel } from "@/lib/types"

const streamTypes = [
  { key: "rtmp" as const, label: "RTMP Server", description: "Use OBS/Wirecast", icon: Video },
  { key: "youtube_api" as const, label: "YouTube API", description: "Direct broadcast", icon: Youtube, recommended: true },
  { key: "youtube_embed" as const, label: "YouTube Embed", description: "Embed existing", icon: MonitorPlay },
  { key: "third_party" as const, label: "Third Party", description: "External embed", icon: Globe },
]

type StreamPricingState = Record<string, StreamTypePriceLevel>

export default function AdminPackagesPage() {
  const [streamPricing, setStreamPricing] = useState<StreamPricingState>({
    rtmp: { userPrice: 1200, resellerPrice: 600, enabled: true },
    youtube_api: { userPrice: 800, resellerPrice: 350, enabled: true },
    youtube_embed: { userPrice: 400, resellerPrice: 120, enabled: true },
    third_party: { userPrice: 300, resellerPrice: 80, enabled: false },
  })

  const [resellerSubscription, setResellerSubscription] = useState({
    price: 1800000, // 18,000 INR in paisa
    enabled: true,
  })

  const [saved, setSaved] = useState(false)

  const updateStreamPrice = (key: string, field: keyof StreamTypePriceLevel, value: number | boolean) => {
    setStreamPricing((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Packages</h1>
        <p className="text-muted-foreground">Configure per-event pricing and reseller subscriptions</p>
      </div>

      {/* Per-Event Stream Pricing */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Per-Event Stream Pricing</CardTitle>
              <CardDescription>Set pricing for each stream type. Prices are in paisa (100 paisa = ₹1).</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_140px_140px_80px] items-center gap-4 px-4 pb-3 text-sm font-medium text-muted-foreground">
            <span>Stream Type</span>
            <span>User Price</span>
            <span>Reseller Price</span>
            <span className="text-center">Status</span>
          </div>
          <Separator className="mb-4 hidden md:block" />

          <div className="space-y-3">
            {streamTypes.map(({ key, label, description, icon: Icon, recommended }) => {
              const pricing = streamPricing[key]
              return (
                <div
                  key={key}
                  className={`rounded-lg border p-4 transition-colors ${
                    pricing.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="grid items-center gap-4 md:grid-cols-[1fr_140px_140px_80px]">
                    {/* Stream Type Info */}
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        pricing.enabled ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Icon className={`h-5 w-5 ${pricing.enabled ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{label}</span>
                          {recommended && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>

                    {/* User Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">User Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pricing.userPrice / 100}
                          onBlur={(e) => updateStreamPrice(key, "userPrice", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                          disabled={!pricing.enabled}
                        />
                      </div>
                    </div>

                    {/* Reseller Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Reseller Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pricing.resellerPrice / 100}
                          onBlur={(e) => updateStreamPrice(key, "resellerPrice", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                          disabled={!pricing.enabled}
                        />
                      </div>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={pricing.enabled}
                        onCheckedChange={(checked) => updateStreamPrice(key, "enabled", checked)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reseller Annual Subscription */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Reseller Annual Subscription</CardTitle>
                <CardDescription>White-label charges including custom domain, branding, platform hosting, SSL & CDN</CardDescription>
              </div>
            </div>
            <Switch
              checked={resellerSubscription.enabled}
              onCheckedChange={(enabled) => setResellerSubscription((prev) => ({ ...prev, enabled }))}
            />
          </div>
        </CardHeader>
        {resellerSubscription.enabled && (
          <CardContent>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="annualPrice">Annual Price</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  id="annualPrice"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={resellerSubscription.price / 100}
                  onBlur={(e) =>
                    setResellerSubscription((prev) => ({
                      ...prev,
                      price: Math.round(Number(e.target.value) * 100),
                    }))
                  }
                  className="pl-7 bg-secondary border-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Charged annually to each reseller for white-label platform access and hosting.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
        {saved && <span className="text-sm text-emerald-500">Changes saved successfully!</span>}
      </div>
    </div>
  )
}
