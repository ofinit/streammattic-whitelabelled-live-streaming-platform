"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Video, Youtube, MonitorPlay, Globe, Save, IndianRupee, Plus, Trash2, Clock, CreditCard, ChevronDown } from "lucide-react"
import type { StreamTypePriceConfig, VolumeDiscountTier, ValidityTier } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { masterStreamTypePricing, masterSimulcastPricing, masterValiditySettings } from "@/lib/mock-data"

const streamTypes = [
  { key: "rtmp" as const, label: "RTMP Server", description: "Use OBS/Wirecast", icon: Video },
  { key: "youtube_api" as const, label: "YouTube API", description: "Direct broadcast", icon: Youtube, recommended: true },
  { key: "youtube_embed" as const, label: "YouTube Embed", description: "Embed existing", icon: MonitorPlay },
  { key: "third_party" as const, label: "Third Party", description: "External embed", icon: Globe },
]

type StreamPricingState = Record<string, StreamTypePriceConfig>

export default function AdminPricingPage() {
  // Initialize from master pricing
  const [streamPricing, setStreamPricing] = useState<StreamPricingState>(() => {
    const state: StreamPricingState = {}
    for (const key of Object.keys(masterStreamTypePricing)) {
      const config = masterStreamTypePricing[key as keyof typeof masterStreamTypePricing]
      state[key] = { ...config, volumeDiscountTiers: [...config.volumeDiscountTiers] }
    }
    return state
  })

  const [simulcastPricing, setSimulcastPricing] = useState({ ...masterSimulcastPricing })

  const [validityTiers, setValidityTiers] = useState<ValidityTier[]>(
    masterValiditySettings.extendedTiers.map((t) => ({ ...t }))
  )

  const [studioSubscription, setStudioSubscription] = useState({
    price: 1800000, // 18,000 INR in paisa
    enabled: true,
  })

  const [expandedStreams, setExpandedStreams] = useState<Record<string, boolean>>({ rtmp: true })
  const [saved, setSaved] = useState(false)

  // Stream type pricing updates
  const updateBasePrice = (key: string, value: number) => {
    setStreamPricing((prev) => ({
      ...prev,
      [key]: { ...prev[key], basePrice: value },
    }))
  }

  const toggleStreamType = (key: string, enabled: boolean) => {
    setStreamPricing((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }))
  }

  // Volume discount tier management
  const addDiscountTier = (streamKey: string) => {
    setStreamPricing((prev) => {
      const config = prev[streamKey]
      const lastTier = config.volumeDiscountTiers[config.volumeDiscountTiers.length - 1]
      const newMinQty = lastTier ? lastTier.minQty * 2 : 5
      const newPrice = Math.round(config.basePrice * 0.8)
      return {
        ...prev,
        [streamKey]: {
          ...config,
          volumeDiscountTiers: [
            ...config.volumeDiscountTiers,
            { minQty: newMinQty, pricePerEvent: newPrice, label: `${newMinQty} Pack` },
          ],
        },
      }
    })
  }

  const updateDiscountTier = (streamKey: string, idx: number, field: keyof VolumeDiscountTier, value: string | number) => {
    setStreamPricing((prev) => {
      const config = prev[streamKey]
      const tiers = config.volumeDiscountTiers.map((t, i) =>
        i === idx ? { ...t, [field]: value } : t
      )
      return { ...prev, [streamKey]: { ...config, volumeDiscountTiers: tiers } }
    })
  }

  const removeDiscountTier = (streamKey: string, idx: number) => {
    setStreamPricing((prev) => {
      const config = prev[streamKey]
      return {
        ...prev,
        [streamKey]: {
          ...config,
          volumeDiscountTiers: config.volumeDiscountTiers.filter((_, i) => i !== idx),
        },
      }
    })
  }

  // Validity tier updates
  const updateValidityTier = (days: number, field: keyof ValidityTier, value: number | boolean | string) => {
    setValidityTiers((prev) =>
      prev.map((t) => (t.days === days ? { ...t, [field]: value } : t))
    )
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing</h1>
        <p className="text-muted-foreground">Configure stream type pricing, volume discounts, and validity extensions</p>
      </div>

      {/* Per-Event Stream Pricing with Volume Discounts */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <IndianRupee className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Stream Type Pricing</CardTitle>
              <CardDescription>Set base price per event. Click any stream type row to expand and configure volume discount tiers for bulk purchases.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {streamTypes.map(({ key, label, description, icon: Icon, recommended }) => {
            const config = streamPricing[key]
            const isExpanded = expandedStreams[key] ?? false
            return (
              <Collapsible key={key} open={isExpanded} onOpenChange={() => setExpandedStreams((prev) => ({ ...prev, [key]: !prev[key] }))}>
                <div
                  className={`rounded-lg border transition-colors ${
                    config.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                  }`}
                >
                  {/* Stream type header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1">
                      <CollapsibleTrigger asChild disabled={!config.enabled}>
                        <button type="button" className="flex items-center gap-3 text-left flex-1" disabled={!config.enabled}>
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded && config.enabled ? "rotate-180" : ""}`} />
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            config.enabled ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <Icon className={`h-5 w-5 ${config.enabled ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{label}</span>
                              {recommended && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Recommended</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                          {config.volumeDiscountTiers.length > 0 && !isExpanded && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-2 shrink-0">
                              {config.volumeDiscountTiers.length} tier{config.volumeDiscountTiers.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </button>
                      </CollapsibleTrigger>

                      {/* Base price inline */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Base Price</Label>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={config.basePrice / 100}
                            onBlur={(e) => updateBasePrice(key, Math.round(Number(e.target.value) * 100))}
                            className="pl-7 bg-secondary border-0 h-9"
                            disabled={!config.enabled}
                          />
                        </div>
                      </div>
                    </div>

                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => toggleStreamType(key, checked)}
                    />
                  </div>

                  {/* Volume Discount Tiers */}
                  <CollapsibleContent>
                    {config.enabled && (
                      <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-muted-foreground">Volume Discount Tiers</p>
                          <Button size="sm" variant="ghost" onClick={() => addDiscountTier(key)}>
                            <Plus className="mr-1 h-3 w-3" />
                            Add Tier
                          </Button>
                        </div>

                        {/* Tier header */}
                        <div className="hidden md:grid md:grid-cols-[120px_120px_1fr_40px] items-center gap-3 px-2 text-xs font-medium text-muted-foreground">
                          <span>Min Quantity</span>
                          <span>Price/Event</span>
                          <span>Label</span>
                          <span></span>
                        </div>

                        {config.volumeDiscountTiers.length === 0 && (
                          <p className="text-sm text-muted-foreground py-2">No volume discounts configured. Users pay the base price for any quantity.</p>
                        )}

                        {config.volumeDiscountTiers.map((tier, idx) => {
                          const discount = config.basePrice > 0
                            ? Math.round((1 - tier.pricePerEvent / config.basePrice) * 100)
                            : 0
                          return (
                            <div key={idx} className="rounded-md bg-secondary/30 p-3">
                              <div className="grid items-center gap-3 md:grid-cols-[120px_120px_1fr_40px]">
                                {/* Min Qty */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground md:hidden">Min Quantity</Label>
                                  <Input
                                    type="number"
                                    min="2"
                                    defaultValue={tier.minQty}
                                    onBlur={(e) => updateDiscountTier(key, idx, "minQty", Number(e.target.value))}
                                    className="bg-secondary border-0 h-8 text-sm"
                                  />
                                </div>

                                {/* Price per event */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground md:hidden">Price/Event</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      defaultValue={tier.pricePerEvent / 100}
                                      onBlur={(e) => updateDiscountTier(key, idx, "pricePerEvent", Math.round(Number(e.target.value) * 100))}
                                      className="pl-7 bg-secondary border-0 h-8 text-sm"
                                    />
                                  </div>
                                  {discount > 0 && (
                                    <p className="text-[10px] text-emerald-500 px-1">{discount}% discount</p>
                                  )}
                                </div>

                                {/* Label */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground md:hidden">Label</Label>
                                  <Input
                                    defaultValue={tier.label ?? ""}
                                    onBlur={(e) => updateDiscountTier(key, idx, "label", e.target.value)}
                                    className="bg-secondary border-0 h-8 text-sm"
                                    placeholder="e.g. Starter Pack"
                                  />
                                </div>

                                {/* Delete */}
                                <div className="flex items-center justify-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeDiscountTier(key, idx)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">Remove tier</span>
                                  </Button>
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
        </CardContent>
      </Card>

      {/* Event Validity (credit-based) */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Event Validity Extensions</CardTitle>
              <CardDescription>
                Default validity is <span className="text-foreground font-medium">30 days</span> (free with event creation). Extensions cost additional credits of the same stream type.
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
              <span className="text-muted-foreground">-- included free with every event creation (1 credit)</span>
            </div>
          </div>

          {/* Header */}
          <div className="hidden md:grid md:grid-cols-[1fr_120px_1fr_80px] items-center gap-4 px-4 pb-3 text-sm font-medium text-muted-foreground">
            <span>Duration</span>
            <span>Credit Cost</span>
            <span>Label</span>
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
                <div className="grid items-center gap-4 md:grid-cols-[1fr_120px_1fr_80px]">
                  {/* Duration */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tier.days} days</span>
                    <span className="text-xs text-muted-foreground">(+{tier.days - 30} extra days)</span>
                  </div>

                  {/* Credit Cost */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground md:hidden">Credits Required</Label>
                    <Input
                      type="number"
                      min="1"
                      defaultValue={tier.creditCost}
                      onBlur={(e) => updateValidityTier(tier.days, "creditCost", Number(e.target.value))}
                      className="bg-secondary border-0 h-9"
                      disabled={!tier.enabled}
                    />
                  </div>

                  {/* Label */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground md:hidden">Display Label</Label>
                    <Input
                      defaultValue={tier.label ?? ""}
                      onBlur={(e) => updateValidityTier(tier.days, "label", e.target.value)}
                      className="bg-secondary border-0 h-9"
                      placeholder="e.g. 60 Days (+1 credit)"
                      disabled={!tier.enabled}
                    />
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
              <p>Create RTMP event = 1 RTMP credit (includes 30 days validity)</p>
              <p>Extend to 90 days = +{validityTiers.find((t) => t.days === 90)?.creditCost ?? 2} RTMP credits</p>
              <p className="text-foreground font-medium">Total: {1 + (validityTiers.find((t) => t.days === 90)?.creditCost ?? 2)} RTMP credits for a 90-day event</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulcast Pricing */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Simulcast Pricing</CardTitle>
              <CardDescription>Per-destination fee charged from wallet when streaming to multiple platforms.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="hidden md:grid md:grid-cols-[1fr_140px_80px] items-center gap-4 px-4 pb-3 text-sm font-medium text-muted-foreground">
            <span>Destination</span>
            <span>Price/Event</span>
            <span className="text-center">Status</span>
          </div>
          <Separator className="mb-4 hidden md:block" />
          <div className="space-y-3">
            {[
              { key: "youtube" as const, label: "YouTube", icon: Youtube },
              { key: "facebook" as const, label: "Facebook", icon: Globe },
              { key: "customRtmp" as const, label: "Custom RTMP", icon: Video },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className={`rounded-lg border p-4 transition-colors ${
                simulcastPricing[key].enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
              }`}>
                <div className="grid items-center gap-4 md:grid-cols-[1fr_140px_80px]">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={simulcastPricing[key].price / 100}
                      onBlur={(e) =>
                        setSimulcastPricing((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], price: Math.round(Number(e.target.value) * 100) },
                        }))
                      }
                      className="pl-7 bg-secondary border-0 h-9"
                      disabled={!simulcastPricing[key].enabled}
                    />
                  </div>
                  <div className="flex items-center justify-center">
                    <Switch
                      checked={simulcastPricing[key].enabled}
                      onCheckedChange={(checked) =>
                        setSimulcastPricing((prev) => ({
                          ...prev,
                          [key]: { ...prev[key], enabled: checked },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
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
                Charged annually to each studio for white-label platform access and hosting. Deducted directly from wallet.
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
