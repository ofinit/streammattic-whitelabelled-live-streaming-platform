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
import { Video, Youtube, MonitorPlay, Globe, Save, RotateCcw } from "lucide-react"
import type { StreamTypePricing, StreamTypePriceLevel } from "@/lib/types"

// Master pricing defaults (same as admin packages page)
const MASTER_PRICING: StreamTypePricing = {
  rtmp: { userPrice: 1200, resellerPrice: 600, enabled: true },
  youtube_api: { userPrice: 800, resellerPrice: 350, enabled: true },
  youtube_embed: { userPrice: 400, resellerPrice: 120, enabled: true },
  third_party: { userPrice: 300, resellerPrice: 80, enabled: false },
}

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
  onSave: (pricing: Partial<StreamTypePricing> | undefined, note: string) => void
}

export function CustomPricingDialog({
  open,
  onOpenChange,
  targetName,
  targetType,
  existingCustomPricing,
  onSave,
}: CustomPricingDialogProps) {
  const [overrides, setOverrides] = useState<Record<string, { enabled: boolean; userPrice: string; resellerPrice: string }>>({})
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
      setNote("")
      setSaved(false)
    }
  }, [open, existingCustomPricing])

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

    onSave(hasOverrides ? customPricing : undefined, note)
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
  }

  const hasAnyOverride = Object.values(overrides).some((o) => o.enabled)
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
