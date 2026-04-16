"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  Youtube,
  MonitorPlay,
  Globe,
  Save,
  IndianRupee,
  Plus,
  Trash2,
  Clock,
  CreditCard,
  ChevronDown,
  Loader2,
  Images,
  Info,
} from "lucide-react"
import type { StreamTypePriceConfig, VolumeDiscountTier, ValidityTier, StreamTypePricing } from "@/lib/types"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"
import { parseStreamTypePricing, parseSimulcastPricing } from "@/lib/stream-type-pricing"
import {
  parseValidityExtensionsSetting,
  validityCreditsForDuration,
  validityExtensionCredits,
} from "@/lib/validity-extensions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { parseAiImagePricing } from "@/lib/ai-image-generation"
import {
  FAL_IMAGE_MODEL_OPTIONS,
  OPENROUTER_IMAGE_MODEL_OPTIONS,
  getCatalogReferenceCostPaise,
  getDefaultFalModelOptionId,
  getDefaultOpenRouterModelOptionId,
} from "@/lib/ai-image-model-catalog"
import {
  DEFAULT_CLIENT_GALLERY_PATH,
  getDefaultPhotoGalleryAddonSettings,
  parsePhotoGalleryAddon,
  type PhotoGalleryAddonSettings,
} from "@/lib/photo-gallery-addon"
import { OPENROUTER_GALLERY_VISION_MODEL_OPTIONS } from "@/lib/photo-gallery-vision-model-catalog"
import type { OpenRouterGalleryJobPricing } from "@/lib/openrouter-model-pricing"

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
  const [streamPricing, setStreamPricing] = useState<StreamTypePricing>({
    rtmp: { enabled: true, basePrice: 2500, volumeDiscountTiers: [] },
    youtube_api: { enabled: true, basePrice: 1500, volumeDiscountTiers: [] },
    youtube_embed: { enabled: true, basePrice: 1000, volumeDiscountTiers: [] },
    third_party: { enabled: true, basePrice: 1000, volumeDiscountTiers: [] },
  })

  const [simulcastPricing, setSimulcastPricing] = useState({
    youtube: { enabled: true, price: 500 },
    facebook: { enabled: true, price: 500 },
    customRtmp: { enabled: true, price: 500 },
  })

  const [validityTiers, setValidityTiers] = useState<ValidityTier[]>([
    { days: 60, creditCost: 1, enabled: true, label: "60 Days (2 credits total)" },
    { days: 90, creditCost: 2, enabled: true, label: "90 Days (3 credits total)" },
    { days: 180, creditCost: 5, enabled: true, label: "180 Days (6 credits total)" },
    { days: 365, creditCost: 12, enabled: true, label: "365 Days (13 credits total)" },
  ])

  const [validityDefaultDays, setValidityDefaultDays] = useState(30)

  const [studioSubscription, setStudioSubscription] = useState({
    price: 1800000, // 18,000 INR in paisa
    enabled: true,
  })

  const [aiImagePricing, setAiImagePricing] = useState(() => {
    const falId = getDefaultFalModelOptionId()
    const orId = getDefaultOpenRouterModelOptionId()
    return {
      price: 500,
      enabled: true,
      imageBackend: null as "fal" | "openrouter" | null,
      falModelId: falId,
      openRouterModelId: orId,
      providerReferenceCostFalPaise: getCatalogReferenceCostPaise("fal", falId) ?? 180,
      providerReferenceCostOpenRouterPaise: getCatalogReferenceCostPaise("openrouter", orId) ?? 280,
    }
  })

  const [expandedStreams, setExpandedStreams] = useState<Record<string, boolean>>({ rtmp: true })
  const [settingsLoadState, setSettingsLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [saving, setSaving] = useState(false)
  const [photoGalleryAddon, setPhotoGalleryAddon] = useState<PhotoGalleryAddonSettings>(() =>
    getDefaultPhotoGalleryAddonSettings(),
  )
  const [savingPhotoGallery, setSavingPhotoGallery] = useState(false)
  const [galleryOpenRouterPricing, setGalleryOpenRouterPricing] = useState<OpenRouterGalleryJobPricing | null>(null)
  const [galleryOpenRouterPricingState, setGalleryOpenRouterPricingState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  )
  const [galleryOpenRouterPricingError, setGalleryOpenRouterPricingError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setSettingsLoadState("loading")
    try {
      const res = await fetch("/api/settings", { cache: "no-store" })
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
      setValidityTiers(ve.extendedTiers.map((t) => ({ ...t })))

      const sub = map.studio_annual_subscription
      if (sub && typeof sub === "object" && sub !== null) {
        const s = sub as Record<string, unknown>
        setStudioSubscription({
          price: typeof s.price === "number" ? s.price : 1_800_000,
          enabled: s.enabled !== false,
        })
      }

      const aiSettings = map.ai_image_pricing
      const parsed = parseAiImagePricing(aiSettings ?? null)
      const falId = parsed.falModelId?.trim() || getDefaultFalModelOptionId()
      const orId = parsed.openRouterModelId?.trim() || getDefaultOpenRouterModelOptionId()
      setAiImagePricing({
        price: parsed.price,
        enabled: parsed.enabled,
        imageBackend: parsed.imageBackend ?? null,
        falModelId: falId,
        openRouterModelId: orId,
        providerReferenceCostFalPaise:
          parsed.providerReferenceCostFalPaise ??
          getCatalogReferenceCostPaise("fal", falId) ??
          180,
        providerReferenceCostOpenRouterPaise:
          parsed.providerReferenceCostOpenRouterPaise ??
          getCatalogReferenceCostPaise("openrouter", orId) ??
          280,
      })

      setPhotoGalleryAddon(parsePhotoGalleryAddon(map.photo_gallery_addon))

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

  useEffect(() => {
    if (settingsLoadState !== "ready") return
    const id = photoGalleryAddon.faceIndexOpenRouterModelId?.trim()
    if (!id) {
      setGalleryOpenRouterPricing(null)
      setGalleryOpenRouterPricingState("idle")
      setGalleryOpenRouterPricingError(null)
      return
    }
    let cancelled = false
    setGalleryOpenRouterPricingState("loading")
    setGalleryOpenRouterPricingError(null)
    void fetch(`/api/admin/openrouter-model-pricing?modelId=${encodeURIComponent(id)}`, {
      credentials: "include",
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<OpenRouterGalleryJobPricing>
        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        if (!cancelled) {
          setGalleryOpenRouterPricing(data as OpenRouterGalleryJobPricing)
          setGalleryOpenRouterPricingState("ok")
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setGalleryOpenRouterPricing(null)
          setGalleryOpenRouterPricingState("error")
          setGalleryOpenRouterPricingError(e instanceof Error ? e.message : "Failed to load pricing")
        }
      })
    return () => {
      cancelled = true
    }
  }, [settingsLoadState, photoGalleryAddon.faceIndexOpenRouterModelId])

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

  const handleSavePhotoGallery = async () => {
    setSavingPhotoGallery(true)
    try {
      const res = await fetch("/api/admin/photo-gallery-addon", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoGalleryAddon),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(body.error || "Failed to save photo gallery settings")
        return
      }
      toast.success("Photo gallery add-on settings saved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSavingPhotoGallery(false)
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
        <h1 className="text-2xl font-bold">Packages</h1>
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
                <span className="text-foreground font-medium">{validityDefaultDays} days</span> (default with event creation).
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
              <span className="text-muted-foreground">-- included by default with every event creation (1 credit)</span>
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
              <p>
                Extend to 90 days = +{validityExtensionCredits(90, validityDefaultDays)} RTMP credits
              </p>
              <p className="text-foreground font-medium">
                Total: {validityCreditsForDuration(90, validityDefaultDays)} RTMP credits for a 90-day
                event
              </p>
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
          <CardContent className="space-y-6">
            <div className="grid max-w-2xl gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Generation backend</Label>
                <Select
                  value={aiImagePricing.imageBackend ?? "env"}
                  onValueChange={(v) =>
                    setAiImagePricing((prev) => ({
                      ...prev,
                      imageBackend: v === "env" ? null : (v as "fal" | "openrouter"),
                    }))
                  }
                >
                  <SelectTrigger className="border-0 bg-secondary">
                    <SelectValue placeholder="Backend" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="env">Use server env (AI_IMAGE_BACKEND)</SelectItem>
                    <SelectItem value="fal">Fal</SelectItem>
                    <SelectItem value="openrouter">OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Overrides Coolify <code className="text-xs">AI_IMAGE_BACKEND</code> when not &quot;Use server env&quot;.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiPrice">Retail price per image (wallet)</Label>
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
              </div>
            </div>

            <div className="grid max-w-4xl gap-6 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <Label className="text-sm font-semibold">Fal model</Label>
                <Select
                  value={aiImagePricing.falModelId}
                  onValueChange={(id) => {
                    const ref = getCatalogReferenceCostPaise("fal", id)
                    setAiImagePricing((prev) => ({
                      ...prev,
                      falModelId: id,
                      providerReferenceCostFalPaise: ref ?? prev.providerReferenceCostFalPaise,
                    }))
                  }}
                >
                  <SelectTrigger className="border-0 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FAL_IMAGE_MODEL_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Est. API cost (Fal) — adjust to match your bill</Label>
                  <div className="relative max-w-[12rem]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={aiImagePricing.providerReferenceCostFalPaise / 100}
                      onChange={(e) => {
                        const v = e.target.value
                        const n = parseFloat(v)
                        if (v === "" || Number.isNaN(n)) return
                        setAiImagePricing((prev) => ({
                          ...prev,
                          providerReferenceCostFalPaise: Math.round(n * 100),
                        }))
                      }}
                      className="border-0 bg-background pl-7"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Margin (Fal path):{" "}
                  <span className="font-medium text-foreground">
                    ₹{Math.max(0, (aiImagePricing.price - aiImagePricing.providerReferenceCostFalPaise) / 100).toFixed(2)}
                  </span>{" "}
                  per image (retail − est. cost)
                </p>
              </div>

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <Label className="text-sm font-semibold">OpenRouter model</Label>
                <Select
                  value={aiImagePricing.openRouterModelId}
                  onValueChange={(id) => {
                    const ref = getCatalogReferenceCostPaise("openrouter", id)
                    setAiImagePricing((prev) => ({
                      ...prev,
                      openRouterModelId: id,
                      providerReferenceCostOpenRouterPaise: ref ?? prev.providerReferenceCostOpenRouterPaise,
                    }))
                  }}
                >
                  <SelectTrigger className="border-0 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPENROUTER_IMAGE_MODEL_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Est. API cost (OpenRouter) — adjust to match your bill
                  </Label>
                  <div className="relative max-w-[12rem]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={aiImagePricing.providerReferenceCostOpenRouterPaise / 100}
                      onChange={(e) => {
                        const v = e.target.value
                        const n = parseFloat(v)
                        if (v === "" || Number.isNaN(n)) return
                        setAiImagePricing((prev) => ({
                          ...prev,
                          providerReferenceCostOpenRouterPaise: Math.round(n * 100),
                        }))
                      }}
                      className="border-0 bg-background pl-7"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Margin (OpenRouter path):{" "}
                  <span className="font-medium text-foreground">
                    ₹
                    {Math.max(
                      0,
                      (aiImagePricing.price - aiImagePricing.providerReferenceCostOpenRouterPaise) / 100,
                    ).toFixed(2)}
                  </span>{" "}
                  per image
                </p>
              </div>
            </div>

            <p className="max-w-3xl text-xs text-muted-foreground">
              Catalog costs are rough defaults. Generation uses the model for the active backend (env or override above).
              Charged amount is always the retail price per image.
            </p>
          </CardContent>
        )}
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Images className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Client photo gallery (BYOS)</CardTitle>
                <CardDescription>
                  Optional add-on: studios bring their own S3 storage; the gallery UI opens on this app at the path below (default{" "}
                  <code className="text-foreground">{DEFAULT_CLIENT_GALLERY_PATH}</code>). When &quot;List in Packages&quot; is on,
                  the card appears in Packages, but each studio/streamer must be enabled under Streamers / Studios — access is
                  not on by default.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="pg-listing" className="text-sm text-muted-foreground">
                List in Packages
              </Label>
              <Switch
                id="pg-listing"
                checked={photoGalleryAddon.listingEnabled}
                onCheckedChange={(checked) =>
                  setPhotoGalleryAddon((prev) => ({ ...prev, listingEnabled: checked }))
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-w-3xl">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <div className="flex gap-3">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" aria-hidden />
              <p className="min-w-0 text-xs leading-relaxed text-muted-foreground">
                <strong className="text-foreground">Monthly price</strong> — reference on Packages; use{" "}
                <code className="text-foreground">0</code> for contact admin / custom.{" "}
                <strong className="text-foreground">Face index credit</strong> — retail per job when billing exists; no free
                quota. Provider cost and margin for the selected model are shown below.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pg-product-name">Product name (customer-facing)</Label>
            <Input
              id="pg-product-name"
              value={photoGalleryAddon.productName}
              onChange={(e) => setPhotoGalleryAddon((p) => ({ ...p, productName: e.target.value }))}
              className="bg-secondary border-0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pg-gallery-path">Gallery path (same origin)</Label>
            <Input
              id="pg-gallery-path"
              placeholder={DEFAULT_CLIENT_GALLERY_PATH}
              value={photoGalleryAddon.galleryPath}
              onChange={(e) => setPhotoGalleryAddon((p) => ({ ...p, galleryPath: e.target.value || DEFAULT_CLIENT_GALLERY_PATH }))}
              className="bg-secondary border-0 font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Must start with <code className="text-foreground">/</code>. Packages &quot;Open gallery&quot; opens this path on the
              current host.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Monthly price (INR)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  className="bg-secondary border-0 pl-7"
                  value={photoGalleryAddon.monthlyPricePaisa / 100}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value)
                    if (e.target.value === "" || Number.isNaN(n)) return
                    setPhotoGalleryAddon((p) => ({ ...p, monthlyPricePaisa: Math.round(n * 100) }))
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">0 = contact admin / custom billing</p>
            </div>
            <div className="space-y-2">
              <Label>Face index credit (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  className="bg-secondary border-0 pl-7"
                  value={photoGalleryAddon.faceIndexCreditPricePaisa / 100}
                  onChange={(e) => {
                    const n = parseFloat(e.target.value)
                    if (e.target.value === "" || Number.isNaN(n)) return
                    setPhotoGalleryAddon((p) => ({ ...p, faceIndexCreditPricePaisa: Math.round(n * 100) }))
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">Retail per job; wallet billing when the gallery worker ships.</p>
            </div>
          </div>

          <div className="max-w-xl space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <Label className="text-sm font-semibold">Planned OpenRouter model (gallery vision / index jobs)</Label>
            <Select
              value={photoGalleryAddon.faceIndexOpenRouterModelId}
              onValueChange={(id) => {
                setPhotoGalleryAddon((prev) => ({ ...prev, faceIndexOpenRouterModelId: id }))
              }}
            >
              <SelectTrigger className="border-0 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPENROUTER_GALLERY_VISION_MODEL_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="space-y-2 rounded-md border border-border/50 bg-background/80 p-3 text-xs">
              <p className="font-medium text-foreground">OpenRouter list price (read-only)</p>
              {galleryOpenRouterPricingState === "loading" && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                  Loading pricing from OpenRouter…
                </p>
              )}
              {galleryOpenRouterPricingState === "error" && (
                <p className="text-destructive">{galleryOpenRouterPricingError ?? "Could not load pricing"}</p>
              )}
              {galleryOpenRouterPricingState === "ok" && galleryOpenRouterPricing && (
                <div className="space-y-1.5 text-muted-foreground">
                  <p>
                    <span className="text-foreground">{galleryOpenRouterPricing.name}</span>{" "}
                    <code className="text-[10px] text-foreground">({galleryOpenRouterPricing.modelId})</code>
                  </p>
                  <p>
                    List (INR):{" "}
                    <strong className="text-foreground">
                      ₹{galleryOpenRouterPricing.promptInrPer1M.toFixed(2)}
                    </strong>{" "}
                    / 1M prompt tokens,{" "}
                    <strong className="text-foreground">
                      ₹{galleryOpenRouterPricing.completionInrPer1M.toFixed(2)}
                    </strong>{" "}
                    / 1M completion tokens
                  </p>
                  <p>
                    Illustrative job (~{galleryOpenRouterPricing.promptTokensAssumed} + ~{galleryOpenRouterPricing.completionTokensAssumed}{" "}
                    tokens):{" "}
                    <strong className="text-foreground">
                      ₹{(galleryOpenRouterPricing.estimatedJobPaisa / 100).toFixed(2)}
                    </strong>{" "}
                    <span className="text-muted-foreground">
                      (FX {galleryOpenRouterPricing.usdInrRate} ₹ per $ OpenRouter list)
                    </span>
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Margin (illustrative):{" "}
              {galleryOpenRouterPricingState === "ok" && galleryOpenRouterPricing ? (
                <span className="font-medium text-foreground">
                  ₹
                  {Math.max(
                    0,
                    (photoGalleryAddon.faceIndexCreditPricePaisa - galleryOpenRouterPricing.estimatedJobPaisa) / 100,
                  ).toFixed(2)}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}{" "}
              per job (face index credit − OpenRouter-derived est.)
            </p>
            <p className="text-[10px] text-muted-foreground">
              Set <code className="text-foreground">OPENROUTER_API_KEY</code> on the server if OpenRouter returns 401 for
              models. Charged amount (future) remains the retail face index credit.
            </p>
          </div>

          <Button type="button" onClick={() => void handleSavePhotoGallery()} disabled={savingPhotoGallery}>
            {savingPhotoGallery ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save photo gallery settings
          </Button>
        </CardContent>
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
