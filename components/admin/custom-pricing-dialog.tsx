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
import { Video, Youtube, MonitorPlay, Globe, Save, RotateCcw, Gift } from "lucide-react"
import { getDefaultStreamTypePricing } from "@/lib/stream-type-pricing"
import { formatCurrency } from "@/lib/cascade-wallet-service"
import type { StreamTypeKey } from "@/lib/types"

const streamTypes = [
  { key: "rtmp" as StreamTypeKey, label: "RTMP Server", description: "Use OBS/Wirecast", icon: Video },
  { key: "youtube_api" as StreamTypeKey, label: "YouTube API", description: "Direct broadcast", icon: Youtube, recommended: true },
  { key: "youtube_embed" as StreamTypeKey, label: "YouTube Embed", description: "Embed existing", icon: MonitorPlay },
  { key: "third_party" as StreamTypeKey, label: "Third Party", description: "External embed", icon: Globe },
]

interface CustomPricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  targetType: "streamer" | "studio"
  existingCustomPricing?: Partial<Record<StreamTypeKey, { basePrice: number }>>
  existingBonusCredits?: Partial<Record<StreamTypeKey, number>>
  onSave: (
    pricing: Partial<Record<StreamTypeKey, { basePrice: number }>> | undefined,
    note: string,
    bonusCredits?: Partial<Record<StreamTypeKey, number>>,
  ) => void
}

export function CustomPricingDialog({
  open,
  onOpenChange,
  targetName,
  targetType,
  existingCustomPricing,
  existingBonusCredits,
  onSave,
}: CustomPricingDialogProps) {
  const [priceOverrides, setPriceOverrides] = useState<Record<string, { enabled: boolean; basePrice: string }>>({})
  const [bonusCredits, setBonusCredits] = useState<Record<string, string>>({})
  const [note, setNote] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) {
      const initialPrices: Record<string, { enabled: boolean; basePrice: string }> = {}
      const initialBonus: Record<string, string> = {}

      for (const { key } of streamTypes) {
        const custom = existingCustomPricing?.[key]
        const master = getDefaultStreamTypePricing()[key]
        initialPrices[key] = {
          enabled: !!custom,
          basePrice: custom ? custom.basePrice.toString() : master.basePrice.toString(),
        }
        initialBonus[key] = existingBonusCredits?.[key]?.toString() || "0"
      }

      setPriceOverrides(initialPrices)
      setBonusCredits(initialBonus)
      setNote("")
      setSaved(false)
    }
  }, [open, existingCustomPricing, existingBonusCredits])

  const toggleOverride = (key: string, enabled: boolean) => {
    setPriceOverrides((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled,
        ...(!enabled ? { basePrice: getDefaultStreamTypePricing()[key as StreamTypeKey].basePrice.toString() } : {}),
      },
    }))
  }

  const handleSave = () => {
    const pricing: Partial<Record<StreamTypeKey, { basePrice: number }>> = {}
    let hasPriceOverrides = false

    for (const { key } of streamTypes) {
      const override = priceOverrides[key]
      if (override?.enabled) {
        hasPriceOverrides = true
        pricing[key] = { basePrice: Number(override.basePrice) }
      }
    }

    const bonus: Partial<Record<StreamTypeKey, number>> = {}
    let hasBonusCredits = false
    for (const { key } of streamTypes) {
      const val = Number(bonusCredits[key] || 0)
      if (val > 0) {
        hasBonusCredits = true
        bonus[key] = val
      }
    }

    onSave(
      hasPriceOverrides ? pricing : undefined,
      note,
      hasBonusCredits ? bonus : undefined,
    )
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onOpenChange(false)
    }, 1500)
  }

  const resetAll = () => {
    const reset: Record<string, { enabled: boolean; basePrice: string }> = {}
    const resetBonus: Record<string, string> = {}
    for (const { key } of streamTypes) {
      reset[key] = {
        enabled: false,
        basePrice: getDefaultStreamTypePricing()[key].basePrice.toString(),
      }
      resetBonus[key] = "0"
    }
    setPriceOverrides(reset)
    setBonusCredits(resetBonus)
  }

  const hasAnyOverride = Object.values(priceOverrides).some((o) => o.enabled) || Object.values(bonusCredits).some((v) => Number(v) > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom Pricing - {targetName}</DialogTitle>
          <DialogDescription>
            Override credit prices or grant bonus credits for this {targetType}. Disabled rows use master pricing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            {hasAnyOverride ? (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30">Custom pricing active</Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">Using master pricing</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={resetAll} disabled={!hasAnyOverride}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Reset to Master
            </Button>
          </div>

          <Separator />

          {/* Credit Price Overrides */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Credit Prices</p>
            {streamTypes.filter((st) => getDefaultStreamTypePricing()[st.key].enabled).map(({ key, label, description, icon: Icon, recommended }) => {
              const override = priceOverrides[key]
              if (!override) return null
              const master = getDefaultStreamTypePricing()[key]
              const isOverridden = override.enabled

              return (
                <div key={key} className={`rounded-lg border p-4 transition-colors ${isOverridden ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isOverridden ? "bg-amber-500/10" : "bg-muted"}`}>
                        <Icon className={`h-4 w-4 ${isOverridden ? "text-amber-500" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{label}</span>
                          {recommended && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Recommended</Badge>}
                          {isOverridden && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">Custom</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Override</span>
                      <Switch checked={isOverridden} onCheckedChange={(checked) => toggleOverride(key, checked)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Custom Base Price</Label>
                      {isOverridden ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{"₹"}</span>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            value={override.basePrice}
                            onChange={(e) => setPriceOverrides((prev) => ({ ...prev, [key]: { ...prev[key], basePrice: e.target.value } }))}
                            className="pl-7 bg-secondary border-0 h-9"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center h-9 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                          {formatCurrency(master.basePrice)}
                          <span className="ml-auto text-[10px]">master</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Master Price</Label>
                      <div className="flex items-center h-9 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
                        {formatCurrency(master.basePrice)}
                        <span className="ml-auto text-[10px]">reference</span>
                      </div>
                    </div>
                  </div>

                  {isOverridden && Number(override.basePrice) < master.basePrice && (
                    <p className="mt-2 text-xs text-emerald-500">
                      {Math.round((1 - Number(override.basePrice) / master.basePrice) * 100)}% discount from master price
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Bonus Credits */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">Grant Bonus Credits</p>
            </div>
            <p className="text-xs text-muted-foreground">Add free credits to this {targetType}'s balance.</p>

            <div className="grid grid-cols-2 gap-3">
              {streamTypes.filter((st) => getDefaultStreamTypePricing()[st.key].enabled).map(({ key, label, icon: Icon }) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Icon className="h-3 w-3" />
                    {label}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={bonusCredits[key] || "0"}
                    onChange={(e) => setBonusCredits((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="bg-secondary border-0 h-9"
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-sm">Admin Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for custom pricing..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saved}>
              <Save className="mr-2 h-4 w-4" />
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
