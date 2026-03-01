"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Video, Youtube, MonitorPlay, Globe, Save, RotateCcw, CreditCard, Package, Clock, ChevronDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { StreamTypePricing, StreamTypePriceLevel, EventPack, ValidityTier, ValidityStreamKey } from "@/lib/types"

// Master pricing defaults (same as admin packages page)
const MASTER_PRICING: StreamTypePricing = {
  rtmp: { userPrice: 1200, resellerPrice: 600, enabled: true },
  youtube_api: { userPrice: 800, resellerPrice: 350, enabled: true },
  youtube_embed: { userPrice: 400, resellerPrice: 120, enabled: true },
  third_party: { userPrice: 300, resellerPrice: 80, enabled: false },
}

const MASTER_ANNUAL_SUBSCRIPTION = {
  price: 1800000, // 18,000 INR in paisa
  enabled: true,
}

const MASTER_EVENT_PACKS: EventPack[] = [
  { id: "pack-1", name: "Starter Pack", eventCount: 10, userPrice: 10000, resellerPrice: 5000, enabled: true, sortOrder: 1 },
  { id: "pack-2", name: "Growth Pack", eventCount: 50, userPrice: 40000, resellerPrice: 20000, enabled: true, sortOrder: 2 },
  { id: "pack-3", name: "Pro Pack", eventCount: 100, userPrice: 60000, resellerPrice: 30000, enabled: true, sortOrder: 3 },
  { id: "pack-4", name: "Enterprise Pack", eventCount: 500, userPrice: 200000, resellerPrice: 100000, enabled: true, sortOrder: 4 },
]

const MASTER_VALIDITY_TIERS: ValidityTier[] = [
  { days: 60, enabled: true, surcharges: {
    rtmp: { userSurcharge: 300, resellerSurcharge: 150 },
    youtube_api: { userSurcharge: 200, resellerSurcharge: 100 },
    youtube_embed: { userSurcharge: 100, resellerSurcharge: 50 },
    third_party: { userSurcharge: 80, resellerSurcharge: 40 },
  }},
  { days: 90, enabled: true, surcharges: {
    rtmp: { userSurcharge: 700, resellerSurcharge: 350 },
    youtube_api: { userSurcharge: 500, resellerSurcharge: 250 },
    youtube_embed: { userSurcharge: 250, resellerSurcharge: 125 },
    third_party: { userSurcharge: 200, resellerSurcharge: 100 },
  }},
  { days: 180, enabled: true, surcharges: {
    rtmp: { userSurcharge: 1200, resellerSurcharge: 600 },
    youtube_api: { userSurcharge: 1000, resellerSurcharge: 500 },
    youtube_embed: { userSurcharge: 500, resellerSurcharge: 250 },
    third_party: { userSurcharge: 400, resellerSurcharge: 200 },
  }},
  { days: 365, enabled: true, surcharges: {
    rtmp: { userSurcharge: 2500, resellerSurcharge: 1250 },
    youtube_api: { userSurcharge: 2000, resellerSurcharge: 1000 },
    youtube_embed: { userSurcharge: 1000, resellerSurcharge: 500 },
    third_party: { userSurcharge: 800, resellerSurcharge: 400 },
  }},
]

const streamTypes = [
  { key: "rtmp" as const, label: "RTMP Server", description: "Use OBS/Wirecast", icon: Video },
  { key: "youtube_api" as const, label: "YouTube API", description: "Direct broadcast", icon: Youtube, recommended: true },
  { key: "youtube_embed" as const, label: "YouTube Embed", description: "Embed existing", icon: MonitorPlay },
  { key: "third_party" as const, label: "Third Party", description: "External embed", icon: Globe },
]

interface CustomPricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  targetType: "user" | "reseller"
  existingCustomPricing?: Partial<StreamTypePricing>
  existingAnnualOverride?: { price: number; enabled: boolean } | null
  existingPackOverrides?: Record<string, { userPrice: number; resellerPrice: number }> | null
  existingValidityOverrides?: Record<number, Record<ValidityStreamKey, { userSurcharge: number; resellerSurcharge: number }>> | null
  onSave: (pricing: Partial<StreamTypePricing> | undefined, note: string, annualOverride?: { price: number; enabled: boolean } | null, packOverrides?: Record<string, { userPrice: number; resellerPrice: number }> | null, validityOverrides?: Record<number, Record<ValidityStreamKey, { userSurcharge: number; resellerSurcharge: number }>> | null) => void
}

export function CustomPricingDialog({
  open,
  onOpenChange,
  targetName,
  targetType,
  existingCustomPricing,
  existingAnnualOverride,
  existingPackOverrides,
  existingValidityOverrides,
  onSave,
}: CustomPricingDialogProps) {
  const [overrides, setOverrides] = useState<Record<string, { enabled: boolean; userPrice: string; resellerPrice: string }>>({})
  const [annualOverride, setAnnualOverride] = useState<{ enabled: boolean; price: string }>({ enabled: false, price: "" })
  const [packOverrides, setPackOverrides] = useState<Record<string, { enabled: boolean; userPrice: string; resellerPrice: string }>>({})
  const [validityOverrides, setValidityOverrides] = useState<Record<number, { enabled: boolean; surcharges: Record<ValidityStreamKey, { userSurcharge: string; resellerSurcharge: string }> }>>({})
  const [expandedValidityTiers, setExpandedValidityTiers] = useState<Record<number, boolean>>({})
  const [note, setNote] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      // Initialize overrides from existing custom pricing
      const initial: Record<string, { enabled: boolean; userPrice: string; resellerPrice: string }> = {}
      for (const { key } of streamTypes) {
        const custom = existingCustomPricing?.[key]
        if (custom) {
          initial[key] = {
            enabled: true,
            userPrice: (custom.userPrice / 100).toString(),
            resellerPrice: (custom.resellerPrice / 100).toString(),
          }
        } else {
          initial[key] = {
            enabled: false,
            userPrice: (MASTER_PRICING[key].userPrice / 100).toString(),
            resellerPrice: (MASTER_PRICING[key].resellerPrice / 100).toString(),
          }
        }
      }
      setOverrides(initial)
      // Initialize annual subscription override
      if (existingAnnualOverride) {
        setAnnualOverride({
          enabled: true,
          price: (existingAnnualOverride.price / 100).toString(),
        })
      } else {
        setAnnualOverride({
          enabled: false,
          price: (MASTER_ANNUAL_SUBSCRIPTION.price / 100).toString(),
        })
      }
      // Initialize event pack overrides
      const packInit: Record<string, { enabled: boolean; userPrice: string; resellerPrice: string }> = {}
      for (const pack of MASTER_EVENT_PACKS) {
        const custom = existingPackOverrides?.[pack.id]
        if (custom) {
          packInit[pack.id] = {
            enabled: true,
            userPrice: (custom.userPrice / 100).toString(),
            resellerPrice: (custom.resellerPrice / 100).toString(),
          }
        } else {
          packInit[pack.id] = {
            enabled: false,
            userPrice: (pack.userPrice / 100).toString(),
            resellerPrice: (pack.resellerPrice / 100).toString(),
          }
        }
      }
      setPackOverrides(packInit)
      // Initialize validity overrides (per stream type)
      const validityInit: Record<number, { enabled: boolean; surcharges: Record<ValidityStreamKey, { userSurcharge: string; resellerSurcharge: string }> }> = {}
      for (const tier of MASTER_VALIDITY_TIERS) {
        const custom = existingValidityOverrides?.[tier.days]
        const surchargesInit = {} as Record<ValidityStreamKey, { userSurcharge: string; resellerSurcharge: string }>
        for (const st of streamTypes) {
          const masterS = tier.surcharges[st.key]
          const customS = custom?.[st.key]
          surchargesInit[st.key] = {
            userSurcharge: customS ? (customS.userSurcharge / 100).toString() : (masterS.userSurcharge / 100).toString(),
            resellerSurcharge: customS ? (customS.resellerSurcharge / 100).toString() : (masterS.resellerSurcharge / 100).toString(),
          }
        }
        validityInit[tier.days] = {
          enabled: !!custom,
          surcharges: surchargesInit,
        }
      }
      setValidityOverrides(validityInit)
      setNote("")
      setSaved(false)
    }
  }, [open, existingCustomPricing, existingAnnualOverride, existingPackOverrides, existingValidityOverrides])

  const toggleOverride = (key: string, enabled: boolean) => {
    setOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled,
        // Reset to master price when disabling
        ...(!enabled
          ? {
              userPrice: (MASTER_PRICING[key as keyof StreamTypePricing].userPrice / 100).toString(),
              resellerPrice: (MASTER_PRICING[key as keyof StreamTypePricing].resellerPrice / 100).toString(),
            }
          : {}),
      },
    }))
  }

  const updatePrice = (key: string, field: "userPrice" | "resellerPrice", value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }))
  }

  const handleSave = () => {
    const customPricing: Partial<StreamTypePricing> = {}
    let hasOverrides = false

    for (const { key } of streamTypes) {
      const override = overrides[key]
      if (override?.enabled) {
        hasOverrides = true
        ;(customPricing as Record<string, StreamTypePriceLevel>)[key] = {
          userPrice: Math.round(Number(override.userPrice) * 100),
          resellerPrice: Math.round(Number(override.resellerPrice) * 100),
          enabled: MASTER_PRICING[key].enabled, // keep master enabled status
        }
      }
    }

    const annualResult = annualOverride.enabled
      ? { price: Math.round(Number(annualOverride.price) * 100), enabled: true }
      : null

    // Build pack overrides
    const packResult: Record<string, { userPrice: number; resellerPrice: number }> = {}
    let hasPackOverrides = false
    for (const pack of MASTER_EVENT_PACKS) {
      const po = packOverrides[pack.id]
      if (po?.enabled) {
        hasPackOverrides = true
        packResult[pack.id] = {
          userPrice: Math.round(Number(po.userPrice) * 100),
          resellerPrice: Math.round(Number(po.resellerPrice) * 100),
        }
      }
    }

    // Build validity overrides (per stream type)
    const validityResult: Record<number, Record<ValidityStreamKey, { userSurcharge: number; resellerSurcharge: number }>> = {}
    let hasValidityOverrides = false
    for (const tier of MASTER_VALIDITY_TIERS) {
      const vo = validityOverrides[tier.days]
      if (vo?.enabled) {
        hasValidityOverrides = true
        const tierResult = {} as Record<ValidityStreamKey, { userSurcharge: number; resellerSurcharge: number }>
        for (const st of streamTypes) {
          const s = vo.surcharges[st.key]
          tierResult[st.key] = {
            userSurcharge: Math.round(Number(s.userSurcharge) * 100),
            resellerSurcharge: Math.round(Number(s.resellerSurcharge) * 100),
          }
        }
        validityResult[tier.days] = tierResult
      }
    }

    onSave(hasOverrides ? customPricing : undefined, note, annualResult, hasPackOverrides ? packResult : null, hasValidityOverrides ? validityResult : null)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onOpenChange(false)
    }, 1500)
  }

  const resetAll = () => {
    const reset: Record<string, { enabled: boolean; userPrice: string; resellerPrice: string }> = {}
    for (const { key } of streamTypes) {
      reset[key] = {
        enabled: false,
        userPrice: (MASTER_PRICING[key].userPrice / 100).toString(),
        resellerPrice: (MASTER_PRICING[key].resellerPrice / 100).toString(),
      }
    }
    setOverrides(reset)
    setAnnualOverride({ enabled: false, price: (MASTER_ANNUAL_SUBSCRIPTION.price / 100).toString() })
    const packReset: Record<string, { enabled: boolean; userPrice: string; resellerPrice: string }> = {}
    for (const pack of MASTER_EVENT_PACKS) {
      packReset[pack.id] = {
        enabled: false,
        userPrice: (pack.userPrice / 100).toString(),
        resellerPrice: (pack.resellerPrice / 100).toString(),
      }
    }
    setPackOverrides(packReset)
    const validityReset: Record<number, { enabled: boolean; surcharges: Record<ValidityStreamKey, { userSurcharge: string; resellerSurcharge: string }> }> = {}
    for (const tier of MASTER_VALIDITY_TIERS) {
      const surchargesReset = {} as Record<ValidityStreamKey, { userSurcharge: string; resellerSurcharge: string }>
      for (const st of streamTypes) {
        const masterS = tier.surcharges[st.key]
        surchargesReset[st.key] = {
          userSurcharge: (masterS.userSurcharge / 100).toString(),
          resellerSurcharge: (masterS.resellerSurcharge / 100).toString(),
        }
      }
      validityReset[tier.days] = { enabled: false, surcharges: surchargesReset }
    }
    setValidityOverrides(validityReset)
  }

  const hasAnyOverride = Object.values(overrides).some((o) => o.enabled) || annualOverride.enabled || Object.values(packOverrides).some((o) => o.enabled) || Object.values(validityOverrides).some((o) => o.enabled)
  // Determine the correct price column label based on target type
  const priceLabel = targetType === "reseller" ? "Reseller Price" : "User Price"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Pricing - {targetName}</DialogTitle>
          <DialogDescription>
            Override master pricing for this {targetType}. Toggle on a stream type to set a custom price.
            Disabled rows use the master price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            {hasAnyOverride && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">
                Custom pricing active
              </Badge>
            )}
            {!hasAnyOverride && (
              <Badge variant="outline" className="text-muted-foreground">
                Using master pricing
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={resetAll} disabled={!hasAnyOverride}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Reset to Master
            </Button>
          </div>

          <Separator />

          {/* Stream Type Overrides */}
          <div className="space-y-3">
            {streamTypes.map(({ key, label, description, icon: Icon, recommended }) => {
              const override = overrides[key]
              if (!override) return null
              const master = MASTER_PRICING[key]
              const isOverridden = override.enabled

              return (
                <div
                  key={key}
                  className={`rounded-lg border p-4 transition-colors ${
                    isOverridden
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Row header: icon, label, toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isOverridden ? "bg-amber-500/10" : "bg-muted"
                      }`}>
                        <Icon className={`h-4 w-4 ${isOverridden ? "text-amber-500" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{label}</span>
                          {recommended && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Recommended
                            </Badge>
                          )}
                          {isOverridden && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">
                              Custom
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Override</span>
                      <Switch
                        checked={isOverridden}
                        onCheckedChange={(checked) => toggleOverride(key, checked)}
                      />
                    </div>
                  </div>

                  {/* Price fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{priceLabel}</Label>
                      {isOverridden ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={override.userPrice}
                            onChange={(e) => updatePrice(key, "userPrice", e.target.value)}
                            className="pl-7 bg-secondary border-0 h-9"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center h-9 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                          {"₹"}{(master.userPrice / 100).toFixed(2)}
                          <span className="ml-auto text-[10px]">master</span>
                        </div>
                      )}
                    </div>

                    {/* Only show reseller price column for user targets */}
                    {targetType === "user" && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Reseller Price</Label>
                        {isOverridden ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={override.resellerPrice}
                              onChange={(e) => updatePrice(key, "resellerPrice", e.target.value)}
                              className="pl-7 bg-secondary border-0 h-9"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center h-9 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                            {"₹"}{(master.resellerPrice / 100).toFixed(2)}
                            <span className="ml-auto text-[10px]">master</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* For reseller targets, show the single reseller price */}
                    {targetType === "reseller" && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Master Price</Label>
                        <div className="flex items-center h-9 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                          {"₹"}{(master.resellerPrice / 100).toFixed(2)}
                          <span className="ml-auto text-[10px]">reference</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Reseller Annual Subscription Override (only for resellers) */}
          {targetType === "reseller" && (
            <>
              <Separator />
              <Card className={`transition-colors ${annualOverride.enabled ? "border-amber-500/30 bg-amber-500/5" : "border-border"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${annualOverride.enabled ? "bg-amber-500/10" : "bg-muted"}`}>
                        <CreditCard className={`h-4 w-4 ${annualOverride.enabled ? "text-amber-500" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-sm">
                          Annual Subscription
                          {annualOverride.enabled && (
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">White-label & hosting charges</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Override</span>
                      <Switch
                        checked={annualOverride.enabled}
                        onCheckedChange={(checked) =>
                          setAnnualOverride((prev) => ({
                            ...prev,
                            enabled: checked,
                            ...(!checked ? { price: (MASTER_ANNUAL_SUBSCRIPTION.price / 100).toString() } : {}),
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Annual Price</Label>
                      {annualOverride.enabled ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={annualOverride.price}
                            onChange={(e) => setAnnualOverride((prev) => ({ ...prev, price: e.target.value }))}
                            className="pl-7 bg-secondary border-0 h-9"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center h-9 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                          {"₹"}{(MASTER_ANNUAL_SUBSCRIPTION.price / 100).toLocaleString("en-IN")}
                          <span className="ml-auto text-[10px]">master</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Master Price</Label>
                      <div className="flex items-center h-9 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                        {"₹"}{(MASTER_ANNUAL_SUBSCRIPTION.price / 100).toLocaleString("en-IN")}
                        <span className="ml-auto text-[10px]">reference</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Event Pack Overrides */}
          <Separator />
          <Card className={`transition-colors ${Object.values(packOverrides).some((o) => o.enabled) ? "border-amber-500/30 bg-amber-500/5" : "border-border"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${Object.values(packOverrides).some((o) => o.enabled) ? "bg-amber-500/10" : "bg-muted"}`}>
                  <Package className={`h-4 w-4 ${Object.values(packOverrides).some((o) => o.enabled) ? "text-amber-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <CardTitle className="text-sm">
                    Event Packs
                    {Object.values(packOverrides).some((o) => o.enabled) && (
                      <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">Override prepaid bundle pricing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {MASTER_EVENT_PACKS.map((pack) => {
                const po = packOverrides[pack.id]
                if (!po) return null
                const isOverridden = po.enabled
                const priceCol = targetType === "reseller" ? "resellerPrice" : "userPrice"
                const masterPrice = targetType === "reseller" ? pack.resellerPrice : pack.userPrice

                return (
                  <div key={pack.id} className={`rounded-lg border p-3 transition-colors ${isOverridden ? "border-amber-500/20 bg-amber-500/5" : "border-border/50"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium">{pack.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{pack.eventCount} events</span>
                        {isOverridden && (
                          <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Override</span>
                        <Switch
                          checked={isOverridden}
                          onCheckedChange={(checked) =>
                            setPackOverrides((prev) => ({
                              ...prev,
                              [pack.id]: {
                                ...prev[pack.id],
                                enabled: checked,
                                ...(!checked
                                  ? {
                                      userPrice: (pack.userPrice / 100).toString(),
                                      resellerPrice: (pack.resellerPrice / 100).toString(),
                                    }
                                  : {}),
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">{targetType === "reseller" ? "Reseller Price" : "User Price"}</Label>
                        {isOverridden ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={po[priceCol]}
                              onChange={(e) =>
                                setPackOverrides((prev) => ({
                                  ...prev,
                                  [pack.id]: { ...prev[pack.id], [priceCol]: e.target.value },
                                }))
                              }
                              className="pl-7 bg-secondary border-0 h-8 text-sm"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center h-8 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                            {"₹"}{(masterPrice / 100).toFixed(2)}
                            <span className="ml-auto text-[10px]">master</span>
                          </div>
                        )}
                        {isOverridden && pack.eventCount > 0 && (
                          <p className="text-[10px] text-muted-foreground px-1">
                            {"₹"}{(Number(po[priceCol]) / pack.eventCount).toFixed(2)}/event
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Master Price</Label>
                        <div className="flex items-center h-8 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                          {"₹"}{(masterPrice / 100).toFixed(2)}
                          <span className="ml-auto text-[10px]">reference</span>
                        </div>
                        {pack.eventCount > 0 && (
                          <p className="text-[10px] text-muted-foreground px-1">
                            {"₹"}{(masterPrice / 100 / pack.eventCount).toFixed(2)}/event
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Event Validity Surcharge Overrides (per stream type) */}
          <Separator />
          <Card className={`transition-colors ${Object.values(validityOverrides).some((o) => o.enabled) ? "border-amber-500/30 bg-amber-500/5" : "border-border"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${Object.values(validityOverrides).some((o) => o.enabled) ? "bg-amber-500/10" : "bg-muted"}`}>
                  <Clock className={`h-4 w-4 ${Object.values(validityOverrides).some((o) => o.enabled) ? "text-amber-500" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <CardTitle className="text-sm">
                    Event Validity Surcharges
                    {Object.values(validityOverrides).some((o) => o.enabled) && (
                      <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">Override per-stream-type extended validity surcharges (30 days always free)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {MASTER_VALIDITY_TIERS.map((tier) => {
                const vo = validityOverrides[tier.days]
                if (!vo) return null
                const isOverridden = vo.enabled
                const isExpanded = expandedValidityTiers[tier.days] ?? false
                const surchargeField = targetType === "reseller" ? "resellerSurcharge" : "userSurcharge"

                return (
                  <Collapsible
                    key={tier.days}
                    open={isExpanded && isOverridden}
                    onOpenChange={() => setExpandedValidityTiers((prev) => ({ ...prev, [tier.days]: !prev[tier.days] }))}
                  >
                    <div className={`rounded-lg border transition-colors ${isOverridden ? "border-amber-500/20 bg-amber-500/5" : "border-border/50"}`}>
                      {/* Tier header */}
                      <div className="flex items-center justify-between p-3">
                        <CollapsibleTrigger asChild disabled={!isOverridden}>
                          <button type="button" className="flex items-center gap-2 text-left" disabled={!isOverridden}>
                            {isOverridden && (
                              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            )}
                            <span className="text-sm font-medium">{tier.days} days</span>
                            {isOverridden && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
                            )}
                            {!isOverridden && (
                              <span className="text-xs text-muted-foreground">
                                {streamTypes.map((st) => {
                                  const ms = tier.surcharges[st.key]
                                  const val = targetType === "reseller" ? ms.resellerSurcharge : ms.userSurcharge
                                  return `+₹${(val / 100).toFixed(2)}`
                                }).join(" / ")}
                              </span>
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Override</span>
                          <Switch
                            checked={isOverridden}
                            onCheckedChange={(checked) => {
                              const surchargesReset = {} as Record<ValidityStreamKey, { userSurcharge: string; resellerSurcharge: string }>
                              for (const st of streamTypes) {
                                const masterS = tier.surcharges[st.key]
                                surchargesReset[st.key as ValidityStreamKey] = {
                                  userSurcharge: (masterS.userSurcharge / 100).toString(),
                                  resellerSurcharge: (masterS.resellerSurcharge / 100).toString(),
                                }
                              }
                              setValidityOverrides((prev) => ({
                                ...prev,
                                [tier.days]: {
                                  enabled: checked,
                                  surcharges: checked ? prev[tier.days]?.surcharges ?? surchargesReset : surchargesReset,
                                },
                              }))
                              if (checked) {
                                setExpandedValidityTiers((prev) => ({ ...prev, [tier.days]: true }))
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Expanded per-stream surcharge inputs */}
                      <CollapsibleContent>
                        {isOverridden && (
                          <div className="border-t border-border/30 px-3 pb-3 pt-2 space-y-2">
                            {streamTypes.map(({ key, label, icon: Icon }) => {
                              const masterS = tier.surcharges[key]
                              const customS = vo.surcharges[key]
                              const masterVal = targetType === "reseller" ? masterS.resellerSurcharge : masterS.userSurcharge

                              return (
                                <div key={key} className="rounded-md bg-secondary/30 p-2.5">
                                  <div className="grid items-center gap-2 md:grid-cols-[1fr_120px_120px]">
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-xs font-medium">{label}</span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <Label className="text-[10px] text-muted-foreground md:hidden">{targetType === "reseller" ? "Reseller" : "User"} Surcharge</Label>
                                      <div className="relative">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{"₹"}</span>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          value={customS?.[surchargeField] ?? ""}
                                          onChange={(e) =>
                                            setValidityOverrides((prev) => ({
                                              ...prev,
                                              [tier.days]: {
                                                ...prev[tier.days],
                                                surcharges: {
                                                  ...prev[tier.days].surcharges,
                                                  [key]: { ...prev[tier.days].surcharges[key as ValidityStreamKey], [surchargeField]: e.target.value },
                                                },
                                              },
                                            }))
                                          }
                                          className="pl-6 bg-secondary border-0 h-7 text-xs"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <Label className="text-[10px] text-muted-foreground md:hidden">Master</Label>
                                      <div className="flex items-center h-7 px-2.5 rounded-md bg-muted/50 text-xs text-muted-foreground">
                                        +{"₹"}{(masterVal / 100).toFixed(2)}
                                        <span className="ml-auto text-[9px]">ref</span>
                                      </div>
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

          <Separator />

          {/* Note */}
          <div className="space-y-2">
            <Label htmlFor="pricing-note">Admin Note (optional)</Label>
            <Textarea
              id="pricing-note"
              placeholder="Reason for custom pricing, e.g. bulk deal, partner discount..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-secondary border-0 resize-none"
              rows={2}
            />
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              {hasAnyOverride ? "Save Custom Pricing" : "Remove Custom Pricing"}
            </Button>
            {saved && <span className="text-sm text-emerald-500">Saved!</span>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
