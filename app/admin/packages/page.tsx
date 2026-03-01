"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Video, Youtube, MonitorPlay, Globe, Save, IndianRupee, Package, Plus, Trash2, Clock, ChevronDown } from "lucide-react"
import type { StreamTypePriceLevel, EventPack, ValidityTier, ValidityStreamKey } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const streamTypes = [
  { key: "rtmp" as const, label: "RTMP Server", description: "Use OBS/Wirecast", icon: Video },
  { key: "youtube_api" as const, label: "YouTube API", description: "Direct broadcast", icon: Youtube, recommended: true },
  { key: "youtube_embed" as const, label: "YouTube Embed", description: "Embed existing", icon: MonitorPlay },
  { key: "third_party" as const, label: "Third Party", description: "External embed", icon: Globe },
]

type StreamPricingState = Record<string, StreamTypePriceLevel>

export default function AdminPackagesPage() {
  const [streamPricing, setStreamPricing] = useState<StreamPricingState>({
    rtmp: { streamerPrice: 1200, studioPrice: 600, enabled: true },
    youtube_api: { streamerPrice: 800, studioPrice: 350, enabled: true },
    youtube_embed: { streamerPrice: 400, studioPrice: 120, enabled: true },
    third_party: { streamerPrice: 300, studioPrice: 80, enabled: false },
  })

  const [studioSubscription, setStudioSubscription] = useState({
    price: 1800000, // 18,000 INR in paisa
    enabled: true,
  })

  const [eventPacksEnabled, setEventPacksEnabled] = useState(true)
  const [eventPacks, setEventPacks] = useState<EventPack[]>([
    { id: "pack-1", name: "Starter Pack", eventCount: 10, streamerPrice: 10000, studioPrice: 5000, enabled: true, sortOrder: 1 },
    { id: "pack-2", name: "Growth Pack", eventCount: 50, streamerPrice: 40000, studioPrice: 20000, enabled: true, sortOrder: 2 },
    { id: "pack-3", name: "Pro Pack", eventCount: 100, streamerPrice: 60000, studioPrice: 30000, enabled: true, sortOrder: 3 },
    { id: "pack-4", name: "Enterprise Pack", eventCount: 500, streamerPrice: 200000, studioPrice: 100000, enabled: true, sortOrder: 4 },
  ])

  const [validityTiers, setValidityTiers] = useState<ValidityTier[]>([
    { days: 60, enabled: true, surcharges: {
      rtmp: { streamerSurcharge: 300, studioSurcharge: 150 },
      youtube_api: { streamerSurcharge: 200, studioSurcharge: 100 },
      youtube_embed: { streamerSurcharge: 100, studioSurcharge: 50 },
      third_party: { streamerSurcharge: 80, studioSurcharge: 40 },
    }},
    { days: 90, enabled: true, surcharges: {
      rtmp: { streamerSurcharge: 700, studioSurcharge: 350 },
      youtube_api: { streamerSurcharge: 500, studioSurcharge: 250 },
      youtube_embed: { streamerSurcharge: 250, studioSurcharge: 125 },
      third_party: { streamerSurcharge: 200, studioSurcharge: 100 },
    }},
    { days: 180, enabled: true, surcharges: {
      rtmp: { streamerSurcharge: 1200, studioSurcharge: 600 },
      youtube_api: { streamerSurcharge: 1000, studioSurcharge: 500 },
      youtube_embed: { streamerSurcharge: 500, studioSurcharge: 250 },
      third_party: { streamerSurcharge: 400, studioSurcharge: 200 },
    }},
    { days: 365, enabled: true, surcharges: {
      rtmp: { streamerSurcharge: 2500, studioSurcharge: 1250 },
      youtube_api: { streamerSurcharge: 2000, studioSurcharge: 1000 },
      youtube_embed: { streamerSurcharge: 1000, studioSurcharge: 500 },
      third_party: { streamerSurcharge: 800, studioSurcharge: 400 },
    }},
  ])
  const [expandedTiers, setExpandedTiers] = useState<Record<number, boolean>>({})

  const [saved, setSaved] = useState(false)

  const addPack = () => {
    const newId = `pack-${Date.now()}`
    setEventPacks((prev) => [
      ...prev,
      {
        id: newId,
        name: "",
        eventCount: 0,
        streamerPrice: 0,
        studioPrice: 0,
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

  const updateValidityTierEnabled = (days: number, enabled: boolean) => {
    setValidityTiers((prev) =>
      prev.map((t) => (t.days === days ? { ...t, enabled } : t))
    )
  }

  const updateValidityTierSurcharge = (days: number, streamKey: ValidityStreamKey, field: "streamerSurcharge" | "studioSurcharge", value: number) => {
    setValidityTiers((prev) =>
      prev.map((t) =>
        t.days === days
          ? { ...t, surcharges: { ...t.surcharges, [streamKey]: { ...t.surcharges[streamKey], [field]: value } } }
          : t
      )
    )
  }

  const toggleTierExpanded = (days: number) => {
    setExpandedTiers((prev) => ({ ...prev, [days]: !prev[days] }))
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
        <p className="text-muted-foreground">Configure per-event pricing and studio subscriptions</p>
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
            <span>Streamer Price</span>
            <span>Studio Price</span>
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

                    {/* Streamer Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Streamer Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pricing.streamerPrice / 100}
                          onBlur={(e) => updateStreamPrice(key, "streamerPrice", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                          disabled={!pricing.enabled}
                        />
                      </div>
                    </div>

                    {/* Studio Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Studio Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pricing.studioPrice / 100}
                          onBlur={(e) => updateStreamPrice(key, "studioPrice", Math.round(Number(e.target.value) * 100))}
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
            <span>Streamer Price</span>
            <span>Studio Price</span>
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
              const perEventStreamer = pack.eventCount > 0 ? pack.streamerPrice / pack.eventCount : 0
              const perEventStudio = pack.eventCount > 0 ? pack.studioPrice / pack.eventCount : 0
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

                    {/* Streamer Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Streamer Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pack.streamerPrice / 100}
                          onBlur={(e) => updatePack(pack.id, "streamerPrice", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                          disabled={!pack.enabled}
                        />
                      </div>
                      {pack.eventCount > 0 && pack.enabled && (
                        <p className="text-[10px] text-muted-foreground px-1">
                          {"₹"}{(perEventStreamer / 100).toFixed(2)}/event
                        </p>
                      )}
                    </div>

                    {/* Studio Price */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Studio Price</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pack.studioPrice / 100}
                          onBlur={(e) => updatePack(pack.id, "studioPrice", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                          disabled={!pack.enabled}
                        />
                      </div>
                      {pack.eventCount > 0 && pack.enabled && (
                        <p className="text-[10px] text-muted-foreground px-1">
                          {"₹"}{(perEventStudio / 100).toFixed(2)}/event
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
                Default validity for all stream types & event packs is <span className="text-foreground font-medium">30 days</span> (included in base price). Extended durations have per-stream-type surcharges.
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

          <div className="space-y-3">
            {validityTiers.map((tier) => {
              const isExpanded = expandedTiers[tier.days] ?? false
              return (
                <Collapsible key={tier.days} open={isExpanded} onOpenChange={() => toggleTierExpanded(tier.days)}>
                  <div
                    className={`rounded-lg border transition-colors ${
                      tier.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                    }`}
                  >
                    {/* Tier header row */}
                    <div className="flex items-center justify-between p-4">
                      <CollapsibleTrigger asChild disabled={!tier.enabled}>
                        <button
                          type="button"
                          className="flex items-center gap-3 text-left"
                          disabled={!tier.enabled}
                        >
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded && tier.enabled ? "rotate-180" : ""}`} />
                          <span className="font-medium text-sm">{tier.days} days</span>
                          {tier.enabled && (
                            <span className="text-xs text-muted-foreground">
                              {streamTypes.map((st) => {
                                const s = tier.surcharges[st.key]
                                return `${st.label}: +₹${(s.streamerSurcharge / 100).toFixed(2)}`
                              }).join(" / ")}
                            </span>
                          )}
                        </button>
                      </CollapsibleTrigger>
                      <Switch
                        checked={tier.enabled}
                        onCheckedChange={(checked) => updateValidityTierEnabled(tier.days, checked)}
                      />
                    </div>

                    {/* Expanded per-stream-type surcharges */}
                    <CollapsibleContent>
                      {tier.enabled && (
                        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                          {/* Sub-header */}
                          <div className="hidden md:grid md:grid-cols-[1fr_140px_140px] items-center gap-3 px-2 text-xs font-medium text-muted-foreground">
                            <span>Stream Type</span>
                            <span>Streamer Surcharge</span>
                            <span>Studio Surcharge</span>
                          </div>

                          {streamTypes.map(({ key, label, icon: Icon }) => {
                            const s = tier.surcharges[key]
                            return (
                              <div key={key} className="rounded-md bg-secondary/30 p-3">
                                <div className="grid items-center gap-3 md:grid-cols-[1fr_140px_140px]">
                                  {/* Stream label */}
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{label}</span>
                                  </div>

                                  {/* Streamer Surcharge */}
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground md:hidden">Streamer Surcharge</Label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        defaultValue={s.streamerSurcharge / 100}
                                        onBlur={(e) => updateValidityTierSurcharge(tier.days, key, "streamerSurcharge", Math.round(Number(e.target.value) * 100))}
                                        className="pl-7 bg-secondary border-0 h-8 text-sm"
                                      />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground px-1">+{"₹"}{(s.streamerSurcharge / 100).toFixed(2)}/event</p>
                                  </div>

                    {/* Studio Surcharge */}
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground md:hidden">Studio Surcharge</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={s.studioSurcharge / 100}
                          onBlur={(e) => updateValidityTierSurcharge(tier.days, key, "studioSurcharge", Math.round(Number(e.target.value) * 100))}
                          className="pl-7 bg-secondary border-0 h-9"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground px-1">+{"₹"}{(s.studioSurcharge / 100).toFixed(2)}/event</p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
          </div>

          {/* Example calculation */}
          <div className="mt-4 rounded-lg bg-secondary/50 p-4 space-y-2">
            <p className="text-sm font-medium">Example</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>RTMP event {"₹"}12.00 + 90-day RTMP surcharge {"₹"}{(validityTiers[1]?.surcharges.rtmp.streamerSurcharge / 100 || 7).toFixed(2)} = <span className="text-foreground font-medium">{"₹"}{(12 + (validityTiers[1]?.surcharges.rtmp.streamerSurcharge / 100 || 7)).toFixed(2)} total</span></p>
              <p>YouTube Embed event {"₹"}4.00 + 90-day YT Embed surcharge {"₹"}{(validityTiers[1]?.surcharges.youtube_embed.streamerSurcharge / 100 || 2.5).toFixed(2)} = <span className="text-foreground font-medium">{"₹"}{(4 + (validityTiers[1]?.surcharges.youtube_embed.streamerSurcharge / 100 || 2.5)).toFixed(2)} total</span></p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Studio Annual Subscription */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <CardTitle>Studio Annual Subscription</CardTitle>
            </div>
            <Switch
              checked={studioSubscription.enabled}
              onCheckedChange={(enabled) => setStudioSubscription((prev) => ({ ...prev, enabled }))}
            />
          </div>
        </CardHeader>
        {studioSubscription.enabled && (
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
                  defaultValue={studioSubscription.price / 100}
                  onBlur={(e) =>
                    setStudioSubscription((prev) => ({
                      ...prev,
                      price: Math.round(Number(e.target.value) * 100),
                    }))
                  }
                  className="pl-7 bg-secondary border-0"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Charged annually to each studio for white-label platform access and hosting.
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
