"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Video, Youtube, MonitorPlay, Globe, Save, IndianRupee, Package, Plus, Trash2, Clock } from "lucide-react"
import type { StreamTypePriceLevel, EventPack, ValidityTier } from "@/lib/types"

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

  const [eventPacksEnabled, setEventPacksEnabled] = useState(true)
  const [eventPacks, setEventPacks] = useState<EventPack[]>([
    { id: "pack-1", name: "Starter Pack", eventCount: 10, userPrice: 10000, resellerPrice: 5000, enabled: true, sortOrder: 1 },
    { id: "pack-2", name: "Growth Pack", eventCount: 50, userPrice: 40000, resellerPrice: 20000, enabled: true, sortOrder: 2 },
    { id: "pack-3", name: "Pro Pack", eventCount: 100, userPrice: 60000, resellerPrice: 30000, enabled: true, sortOrder: 3 },
    { id: "pack-4", name: "Enterprise Pack", eventCount: 500, userPrice: 200000, resellerPrice: 100000, enabled: true, sortOrder: 4 },
  ])

  const [validityTiers, setValidityTiers] = useState<ValidityTier[]>([
    { days: 60, userSurcharge: 200, resellerSurcharge: 100, enabled: true },
    { days: 90, userSurcharge: 500, resellerSurcharge: 250, enabled: true },
    { days: 180, userSurcharge: 1000, resellerSurcharge: 500, enabled: true },
    { days: 365, userSurcharge: 2000, resellerSurcharge: 1000, enabled: true },
  ])

  const [saved, setSaved] = useState(false)

  const addPack = () => {
    const newId = `pack-${Date.now()}`
    setEventPacks((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        eventCount: 0,
        userPrice: 0,
        resellerPrice: 0,
        enabled: true,
        sortOrder: prev.length + 1,
      },
    ])
  }

  const updatePack = (id: string, field: keyof EventPack, value: string | number | boolean) => {
    setEventPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    )
  }

  const removePack = (id: string) => {
    setEventPacks((prev) => prev.filter((p) => p.id !== id))
  }

  const updateValidityTier = (days: number, field: keyof ValidityTier, value: number | boolean) => {
    setValidityTiers((prev) =>
      prev.map((t) => (t.days === days ? { ...t, [field]: value } : t))
    )
  }

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

      {/* Event Packs */}
      <Card className={`border-border bg-card transition-opacity ${!eventPacksEnabled ? "opacity-60" : ""}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Event Packs</CardTitle>
                <CardDescription>Sell prepaid event bundles at discounted rates</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {eventPacksEnabled && (
                <Button size="sm" variant="outline" onClick={addPack}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Pack
                </Button>
              )}
              <Switch
                checked={eventPacksEnabled}
                onCheckedChange={setEventPacksEnabled}
              />
            </div>
          </div>
        </CardHeader>
        {eventPacksEnabled && <CardContent className="space-y-4">
          {/* Table Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_80px_120px_120px_60px_40px] items-center gap-3 px-4 text-sm font-medium text-muted-foreground">
            <span>Pack Name</span>
            <span>Events</span>
            <span>User Price</span>
            <span>Reseller Price</span>
            <span className="text-center">Status</span>
            <span></span>
          </div>
          <Separator className="hidden md:block" />

          {eventPacks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No event packs configured</p>
              <p className="text-xs">Click "Add Pack" to create a prepaid bundle</p>
            </div>
          )}

          <div className="space-y-3">
            {eventPacks.map((pack) => {
              const perEventUser = pack.eventCount > 0 ? pack.userPrice / pack.eventCount : 0
              const perEventReseller = pack.eventCount > 0 ? pack.resellerPrice / pack.eventCount : 0
              return (
                <div
                  key={pack.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    pack.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                  }`}
                >
                  <div className="grid items-center gap-3 md:grid-cols-[1fr_80px_120px_120px_60px_40px]">
                    {/* Pack Name */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Pack Name</Label>
                      <Input
                        defaultValue={pack.name}
                        onBlur={(e) => updatePack(pack.id, "name", e.target.value)}
                        className="bg-secondary border-0 h-9"
                        placeholder="e.g. Starter Pack"
                        disabled={!pack.enabled}
                      />
                    </div>

                    {/* Event Count */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Events</Label>
                      <Input
                        type="number"
                        min="1"
                        defaultValue={pack.eventCount}
                        onBlur={(e) => updatePack(pack.id, "eventCount", Number(e.target.value))}
                        className="bg-secondary border-0 h-9"
                        disabled={!pack.enabled}
                      />
                    </div>

                    {/* User Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">User Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pack.userPrice / 100}
                          onBlur={(e) => updatePack(pack.id, "userPrice", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                          disabled={!pack.enabled}
                        />
                      </div>
                      {pack.eventCount > 0 && pack.enabled && (
                        <p className="text-[10px] text-muted-foreground px-1">
                          {"₹"}{(perEventUser / 100).toFixed(2)}/event
                        </p>
                      )}
                    </div>

                    {/* Reseller Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Reseller Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pack.resellerPrice / 100}
                          onBlur={(e) => updatePack(pack.id, "resellerPrice", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                          disabled={!pack.enabled}
                        />
                      </div>
                      {pack.eventCount > 0 && pack.enabled && (
                        <p className="text-[10px] text-muted-foreground px-1">
                          {"₹"}{(perEventReseller / 100).toFixed(2)}/event
                        </p>
                      )}
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={pack.enabled}
                        onCheckedChange={(checked) => updatePack(pack.id, "enabled", checked)}
                      />
                    </div>

                    {/* Delete */}
                    <div className="flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removePack(pack.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove pack</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </CardContent>}
      </Card>

      {/* Event Validity */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Event Validity</CardTitle>
              <CardDescription>
                Default validity for all stream types & event packs is <span className="text-foreground font-medium">30 days</span> (included in base price). Extended durations are chargeable.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Default validity info */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Default: 30 days</span>
              <span className="text-muted-foreground">-- included free with every per-event stream & event pack purchase</span>
            </div>
          </div>

          {/* Extended tiers header */}
          <div className="hidden md:grid md:grid-cols-[100px_1fr_1fr_80px] items-center gap-4 px-4 pb-3 text-sm font-medium text-muted-foreground">
            <span>Duration</span>
            <span>User Surcharge</span>
            <span>Reseller Surcharge</span>
            <span className="text-center">Status</span>
          </div>
          <Separator className="mb-4 hidden md:block" />

          <div className="space-y-3">
            {validityTiers.map((tier) => (
              <div
                key={tier.days}
                className={`rounded-lg border p-4 transition-colors ${
                  tier.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                }`}
              >
                <div className="grid items-center gap-4 md:grid-cols-[100px_1fr_1fr_80px]">
                  {/* Duration label */}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{tier.days} days</span>
                  </div>

                  {/* User Surcharge */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground md:hidden">User Surcharge</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={tier.userSurcharge / 100}
                        onBlur={(e) => updateValidityTier(tier.days, "userSurcharge", Math.round(Number(e.target.value) * 100))}
                        className="pl-7 bg-secondary border-0 h-9"
                        disabled={!tier.enabled}
                      />
                    </div>
                    {tier.enabled && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        +{"₹"}{(tier.userSurcharge / 100).toFixed(2)} per event
                      </p>
                    )}
                  </div>

                  {/* Reseller Surcharge */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground md:hidden">Reseller Surcharge</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={tier.resellerSurcharge / 100}
                        onBlur={(e) => updateValidityTier(tier.days, "resellerSurcharge", Math.round(Number(e.target.value) * 100))}
                        className="pl-7 bg-secondary border-0 h-9"
                        disabled={!tier.enabled}
                      />
                    </div>
                    {tier.enabled && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        +{"₹"}{(tier.resellerSurcharge / 100).toFixed(2)} per event
                      </p>
                    )}
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center justify-center">
                    <Switch
                      checked={tier.enabled}
                      onCheckedChange={(checked) => updateValidityTier(tier.days, "enabled", checked)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Example calculation */}
          <div className="mt-4 rounded-lg bg-secondary/50 p-4 space-y-2">
            <p className="text-sm font-medium">Example</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>RTMP event base price: {"₹"}12.00 + 90-day validity surcharge: {"₹"}5.00 = <span className="text-foreground font-medium">{"₹"}17.00 total</span></p>
              <p>Starter Pack (10 events): {"₹"}100.00 + 90-day surcharge {"₹"}5.00 x 10 = <span className="text-foreground font-medium">{"₹"}150.00 total</span></p>
            </div>
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
