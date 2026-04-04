"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Video, Youtube, MonitorPlay, Globe, Save, IndianRupee, Plus, Trash2, Clock, CreditCard, ChevronDown, Loader2 } from "lucide-react"
import type { StreamTypePriceConfig, VolumeDiscountTier, ValidityTier, StreamTypePricing } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { masterStreamTypePricing, masterSimulcastPricing, masterValiditySettings } from "@/lib/mock-data"
import { toast } from "sonner"
import { parseStreamTypePricing, parseSimulcastPricing } from "@/lib/stream-type-pricing"
import { parseValidityExtensionsSetting } from "@/lib/validity-extensions"

const streamTypes = [
  { key: "rtmp" as const, label: "RTMP Server", description: "Use OBS/Wirecast", icon: Video },
  { key: "youtube_api" as const, label: "YouTube API", description: "Direct broadcast", icon: Youtube, recommended: true },
  { key: "youtube_embed" as const, label: "YouTube Embed", description: "Embed existing", icon: MonitorPlay },
  { key: "third_party" as const, label: "Third Party", description: "External embed", icon: Globe },
]

function cloneStreamPricing(source: StreamTypePricing): StreamTypePricing {
  return JSON.parse(JSON.stringify(source)) as StreamTypePricing
}

const STREAM_TYPE_KEYS = ["rtmp", "youtube_api", "youtube_embed", "third_party"] as const

/** API requires ≥1 paisa per volume tier; clamp so accidental 0 does not reject the whole save */
function sanitizeStreamPricingForSave(source: StreamTypePricing): StreamTypePricing {
  const out = cloneStreamPricing(source)
  for (const key of STREAM_TYPE_KEYS) {
    const cfg = out[key]
    out[key] = {
      ...cfg,
      volumeDiscountTiers: cfg.volumeDiscountTiers.map((t) => ({
        ...t,
        minQty: Math.max(1, Math.round(Number(t.minQty)) || 1),
        pricePerEvent: Math.max(1, Math.round(Number(t.pricePerEvent)) || 1),
      })),
    }
  }
  return out
}

export default function AdminPricingPage() {
  const [streamPricing, setStreamPricing] = useState<StreamTypePricing>(() => cloneStreamPricing(masterStreamTypePricing))

  const [simulcastPricing, setSimulcastPricing] = useState({ ...masterSimulcastPricing })

  const [validityTiers, setValidityTiers] = useState<ValidityTier[]>(
    masterValiditySettings.extendedTiers.map((t) => ({ ...t })),
  )

  const [validityDefaultDays, setValidityDefaultDays] = useState(30)

  const [studioSubscription, setStudioSubscription] = useState({
    price: 1800000, // 18,000 INR in paisa
    enabled: true,
  })

  const [aiImagePricing, setAiImagePricing] = useState({
    price: 500, // 5 INR in paisa
    enabled: true,
  })

  const [expandedStreams, setExpandedStreams] = useState<Record<string, boolean>>({ rtmp: true })
  const [settingsLoadState, setSettingsLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [saving, setSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    setSettingsLoadState("loading")
    try {
      const res = await fetch("/api/settings")
      const data = (await res.json()) as { settings?: { key: string; value: unknown }[]; error?: string }
      if (!res.ok) {
        throw new Error(data.error || "Failed to load settings")
      }
      const rows = data.settings ?? []
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>

      setStreamPricing(
        parseStreamTypePricing(map.stream_type_pricing ?? null, map.volume_discount_tiers ?? null),
      )
      setSimulcastPricing(parseSimulcastPricing(map.simulcast_pricing ?? null))
      const ve = parseValidityExtensionsSetting(map.validity_extensions ?? null)
      setValidityDefaultDays(ve.defaultDays)
      setValidityTiers(ve.tiers.map((t) => ({ ...t })))

      const sub = map.studio_annual_subscription
      if (sub && typeof sub === "object" && sub !== null) {
        const s = sub as Record<string, unknown>
        setStudioSubscription({
          price: typeof s.price === "number" ? s.price : 1_800_000,
          enabled: s.enabled !== false,
        })
      }

      const aiSettings = map.ai_image_pricing
      if (aiSettings && typeof aiSettings === "object" && aiSettings !== null) {
        const a = aiSettings as Record<string, unknown>
        setAiImagePricing({
          price: typeof a.price === "number" ? a.price : 500,
          enabled: a.enabled !== false,
        })
      }

      setSettingsLoadState("ready")
    } catch (e) {
      console.error(e)
      setSettingsLoadState("error")
      toast.error(e instanceof Error ? e.message : "Failed to load pricing settings")
    }
  }, [])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  // Stream type pricing updates
  const updateBasePrice = (key: keyof StreamTypePricing, value: number) => {
    setStreamPricing((prev) => ({
      ...prev,
      [key]: { ...prev[key], basePrice: value },
    }))
  }

  const toggleStreamType = (key: keyof StreamTypePricing, enabled: boolean) => {
    setStreamPricing((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled },
    }))
  }

  // Volume discount tier management
  const addDiscountTier = (streamKey: keyof StreamTypePricing) => {
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

  const updateDiscountTier = (
    streamKey: keyof StreamTypePricing,
    idx: number,
    field: keyof VolumeDiscountTier,
    value: string | number,
  ) => {
    setStreamPricing((prev) => {
      const config = prev[streamKey]
      const tiers = config.volumeDiscountTiers.map((t, i) =>
        i === idx ? { ...t, [field]: value } : t
      )
      return { ...prev, [streamKey]: { ...config, volumeDiscountTiers: tiers } }
    })
  }

  const removeDiscountTier = (streamKey: keyof StreamTypePricing, idx: number) => {
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/pricing", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamTypePricing: sanitizeStreamPricingForSave(streamPricing),
          simulcastPricing: { ...simulcastPricing },
          validityDefaultDays,
          validityTiers: validityTiers.map((t) => ({ ...t })),
          studioSubscription: { ...studioSubscription },
          aiImagePricing: { ...aiImagePricing },
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Not signed in. Open Admin Login, sign in, then try again.")
        } else if (res.status === 403) {
          toast.error("Admin role required to save pricing.")
        } else {
          toast.error(body.error || "Failed to save pricing")
        }
        return
      }

      toast.success("Pricing saved to database")
      setStreamPricing((prev) => sanitizeStreamPricingForSave(prev))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (settingsLoadState === "loading") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm">Loading pricing from database…</p>
      </div>
    )
  }

  if (settingsLoadState === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-muted-foreground">Could not load pricing settings.</p>
        <Button type="button" onClick={() => void loadSettings()}>
          Retry
        </Button>
      </div>
    )
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
              <div
                key={key}
                className={`rounded-lg border transition-colors ${
                  config.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"
                }`}
              >
                <Collapsible
                  open={isExpanded}
                  onOpenChange={(open) => setExpandedStreams((prev) => ({ ...prev, [key]: open }))}
                  className="min-w-0 w-full"
                >
                  <div className="flex min-w-0 flex-col gap-0">
                    {/* Header: title row + Base price + enable toggle (toggle beside base price) */}
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 p-4">
                      <CollapsibleTrigger asChild disabled={!config.enabled}>
                        <button
                          type="button"
                          className="flex min-w-[12rem] flex-1 items-center gap-3 text-left md:min-w-0"
                          disabled={!config.enabled}
                        >
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded && config.enabled ? "rotate-180" : ""}`}
                          />
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              config.enabled ? "bg-primary/10" : "bg-muted"
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${config.enabled ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="min-w-0">
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
                          {config.volumeDiscountTiers.length > 0 && !isExpanded && (
                            <Badge variant="secondary" className="ml-2 shrink-0 text-[10px] px-1.5 py-0">
                              {config.volumeDiscountTiers.length} tier{config.volumeDiscountTiers.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                        <Label className="whitespace-nowrap text-xs text-muted-foreground">Base Price</Label>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            {"₹"}
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={config.basePrice / 100}
                            onChange={(e) => {
                              const v = e.target.value
                              const n = parseFloat(v)
                              if (v === "" || Number.isNaN(n)) return
                              updateBasePrice(key, Math.round(n * 100))
                            }}
                            className="h-9 border-0 bg-secondary pl-7"
                            disabled={!config.enabled}
                          />
                        </div>
                        <div
                          className="relative z-10 flex shrink-0 items-center border-l border-border/60 pl-2 sm:pl-3"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Switch
                            checked={config.enabled}
                            onCheckedChange={(checked) => toggleStreamType(key, checked)}
                          />
                        </div>
                      </div>
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
                          const base = config.basePrice
                          const tierP = tier.pricePerEvent
                          let discountLabel: string
                          let discountClass: string
                          if (base <= 0) {
                            discountLabel = "Set a base price to see discount"
                            discountClass = "text-muted-foreground"
                          } else {
                            const pct = Math.round((1 - tierP / base) * 100)
                            if (pct > 0) {
                              discountLabel = `${pct}% off vs base`
                              discountClass = "text-emerald-500"
                            } else if (pct < 0) {
                              discountLabel = `${Math.abs(pct)}% above base`
                              discountClass = "text-amber-600 dark:text-amber-500"
                            } else {
                              discountLabel = "0% off (same as base)"
                              discountClass = "text-muted-foreground"
                            }
                          }
                          return (
                            <div key={idx} className="rounded-md bg-secondary/30 p-3">
                              <div className="grid items-start gap-3 md:grid-cols-[120px_120px_1fr_40px]">
                                {/* Min Qty */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground md:hidden">Min Quantity</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={tier.minQty}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      if (v === "") return
                                      const n = Number(v)
                                      if (Number.isNaN(n)) return
                                      updateDiscountTier(key, idx, "minQty", Math.round(n))
                                    }}
                                    className="h-8 border-0 bg-secondary text-sm"
                                  />
                                </div>

                                {/* Price per event */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground md:hidden">Price/Event</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                      {"₹"}
                                    </span>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={tier.pricePerEvent === 0 ? "" : tier.pricePerEvent / 100}
                                      onChange={(e) => {
                                        const v = e.target.value
                                        if (v === "") {
                                          updateDiscountTier(key, idx, "pricePerEvent", 0)
                                          return
                                        }
                                        const n = parseFloat(v)
                                        if (Number.isNaN(n)) return
                                        updateDiscountTier(key, idx, "pricePerEvent", Math.round(n * 100))
                                      }}
                                      className="h-8 border-0 bg-secondary pl-7 text-sm"
                                    />
                                  </div>
                                  <p className={`px-1 text-[10px] leading-tight ${discountClass}`}>{discountLabel}</p>
                                </div>

                                {/* Label */}
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground md:hidden">Label</Label>
                                  <Input
                                    value={tier.label ?? ""}
                                    onChange={(e) => updateDiscountTier(key, idx, "label", e.target.value)}
                                    className="h-8 border-0 bg-secondary text-sm"
                                    placeholder="e.g. Starter Pack"
                                  />
                                </div>

                                {/* Delete */}
                                <div className="flex justify-center pt-1 md:pt-0 md:items-center">
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
              </div>
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
                Default validity is{" "}
                <span className="text-foreground font-medium">{validityDefaultDays} days</span> (free with event creation).
                Extensions cost additional credits of the same stream type.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Default validity info */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Default: {validityDefaultDays} days</span>
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
                    <span className="text-xs text-muted-foreground">
                      (+{Math.max(0, tier.days - validityDefaultDays)} extra days)
                    </span>
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
              <p>Create RTMP event = 1 RTMP credit (includes {validityDefaultDays} days validity)</p>
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
                  value={studioSubscription.price / 100}
                  onChange={(e) => {
                    const v = e.target.value
                    const n = parseFloat(v)
                    if (v === "" || Number.isNaN(n)) return
                    setStudioSubscription((prev) => ({ ...prev, price: Math.round(n * 100) }))
                  }}
                  className="border-0 bg-secondary pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Charged annually to each studio for white-label platform access and hosting. Deducted directly from wallet.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* AI Image Generation Pricing */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary shrink-0"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <CardTitle>AI Image Generation Pricing</CardTitle>
            </div>
            <Switch
              checked={aiImagePricing.enabled}
              onCheckedChange={(enabled) => setAiImagePricing((prev) => ({ ...prev, enabled }))}
            />
          </div>
        </CardHeader>
        {aiImagePricing.enabled && (
          <CardContent>
            <div className="max-w-sm space-y-2">
              <Label htmlFor="aiPrice">Price Per Image</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                <Input
                  id="aiPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={aiImagePricing.price / 100}
                  onChange={(e) => {
                    const v = e.target.value
                    const n = parseFloat(v)
                    if (v === "" || Number.isNaN(n)) return
                    setAiImagePricing((prev) => ({ ...prev, price: Math.round(n * 100) }))
                  }}
                  className="border-0 bg-secondary pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Charged per generation from the user's wallet.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
        <span className="text-xs text-muted-foreground">Persists to platform_settings (Postgres).</span>
      </div>
    </div>
  )
}
