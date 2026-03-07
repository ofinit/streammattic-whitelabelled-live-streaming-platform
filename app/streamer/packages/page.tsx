"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Video, Youtube, MonitorPlay, Globe, ShoppingCart, Minus, Plus, CreditCard, TrendingDown, CheckCircle2, Wallet, Clock,
} from "lucide-react"
import { masterStreamTypePricing, masterValiditySettings, mockStreamers, getBestPriceForQuantity } from "@/lib/mock-data"
import type { StreamTypeKey } from "@/lib/types"
import { formatCurrency } from "@/lib/cascade-wallet-service"

const streamTypeInfo = [
  { key: "rtmp" as StreamTypeKey, label: "RTMP Server", description: "Use OBS or Wirecast to stream", icon: Video },
  { key: "youtube_api" as StreamTypeKey, label: "YouTube API", description: "Direct broadcast via API", icon: Youtube, recommended: true },
  { key: "youtube_embed" as StreamTypeKey, label: "YouTube Embed", description: "Embed an existing stream", icon: MonitorPlay },
  { key: "third_party" as StreamTypeKey, label: "Third Party", description: "External embed URL", icon: Globe },
]

export default function StreamerPricingPage() {
  const streamer = mockStreamers[0]
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)

  const updateQty = (key: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[key] ?? 1
      const next = Math.max(1, current + delta)
      return { ...prev, [key]: next }
    })
  }

  const setQty = (key: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [key]: Math.max(1, value) }))
  }

  const handlePurchase = (streamType: StreamTypeKey) => {
    const qty = quantities[streamType] ?? 1
    const { totalPrice, tierLabel } = getBestPriceForQuantity(streamType, qty)
    setPurchaseSuccess(`Purchased ${qty}x ${streamType.replace(/_/g, " ")} credits${tierLabel ? ` (${tierLabel})` : ""} for ${formatCurrency(totalPrice)}`)
    setTimeout(() => setPurchaseSuccess(null), 4000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buy Stream Credits</h1>
          <p className="text-muted-foreground">Purchase credits per stream type. Buy in bulk for volume discounts.</p>
        </div>
        <Card className="border-border bg-card px-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Wallet:</span>
            <span className="font-bold">{formatCurrency(streamer.walletBalance)}</span>
          </div>
        </Card>
      </div>

      {/* Success message */}
      {purchaseSuccess && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{purchaseSuccess}</p>
        </div>
      )}

      {/* Current Credits Summary */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Your Credits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {streamTypeInfo.filter((st) => masterStreamTypePricing[st.key].enabled).map(({ key, label, icon: Icon }) => (
              <div key={key} className="rounded-lg bg-secondary/50 p-3 flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold">{streamer.credits[key]}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stream Type Purchase Cards */}
      <div className="space-y-4">
        {streamTypeInfo.map(({ key, label, description, icon: Icon, recommended }) => {
          const config = masterStreamTypePricing[key]
          if (!config.enabled) return null

          const qty = quantities[key] ?? 1
          const { pricePerEvent, tierLabel, totalPrice, savings } = getBestPriceForQuantity(key, qty)
          const walletEnough = streamer.walletBalance >= totalPrice

          return (
            <Card key={key} className="border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {label}
                        {recommended && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Recommended</Badge>}
                      </CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Base price</p>
                    <p className="text-lg font-bold">{formatCurrency(config.basePrice)}<span className="text-xs font-normal text-muted-foreground">/event</span></p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                  {/* Quantity selector */}
                  <div className="space-y-2">
                    <Label className="text-sm">Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQty(key, -1)} disabled={qty <= 1}>
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">Decrease quantity</span>
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) => setQty(key, Number(e.target.value))}
                        className="w-20 h-9 text-center bg-secondary border-0"
                      />
                      <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQty(key, 1)}>
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">Increase quantity</span>
                      </Button>

                      {/* Quick quantity buttons */}
                      <div className="hidden md:flex items-center gap-1 ml-2">
                        {config.volumeDiscountTiers.map((tier) => (
                          <Button
                            key={tier.minQty}
                            variant={qty === tier.minQty ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setQty(key, tier.minQty)}
                          >
                            {tier.minQty}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="flex-1 flex items-end justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Price/event:</span>
                        <span className="font-medium">{formatCurrency(pricePerEvent)}</span>
                        {tierLabel && (
                          <Badge variant="secondary" className="text-[10px]">
                            <TrendingDown className="mr-1 h-3 w-3" />
                            {tierLabel}
                          </Badge>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-xs text-emerald-500">You save {formatCurrency(savings)} with volume discount</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">{formatCurrency(totalPrice)}</p>
                      </div>
                      <Button onClick={() => handlePurchase(key)} disabled={!walletEnough}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Buy {qty} Credits
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Volume discount tiers info */}
                {config.volumeDiscountTiers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Volume Discounts</p>
                    <div className="flex flex-wrap gap-2">
                      {config.volumeDiscountTiers.map((tier) => {
                        const discount = Math.round((1 - tier.pricePerEvent / config.basePrice) * 100)
                        const isActive = qty >= tier.minQty
                        return (
                          <div key={tier.minQty} className={`rounded-md px-3 py-1.5 text-xs ${
                            isActive ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/50 text-muted-foreground"
                          }`}>
                            {tier.minQty}+ events: {formatCurrency(tier.pricePerEvent)}/ea ({discount}% off)
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!walletEnough && (
                  <p className="mt-3 text-xs text-destructive">Insufficient wallet balance. You need {formatCurrency(totalPrice - streamer.walletBalance)} more.</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Validity Info */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Event Validity Extensions</CardTitle>
          </div>
          <CardDescription>Each event includes 30 days free. Extending costs additional credits of the same stream type.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
              <p className="text-lg font-bold">30 days</p>
              <p className="text-xs text-primary">Included free</p>
            </div>
            {masterValiditySettings.extendedTiers.filter((t) => t.enabled).map((tier) => (
              <div key={tier.days} className="rounded-lg bg-secondary/50 p-3 text-center">
                <p className="text-lg font-bold">{tier.days} days</p>
                <p className="text-xs text-muted-foreground">+{tier.creditCost} credit{tier.creditCost > 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>

          {/* Example */}
          <div className="mt-4 rounded-lg bg-secondary/50 p-4 space-y-1">
            <p className="text-sm font-medium">Example</p>
            <p className="text-sm text-muted-foreground">
              Create RTMP event = 1 RTMP credit (includes 30 days). Extend to 90 days = +{masterValiditySettings.extendedTiers.find((t) => t.days === 90)?.creditCost ?? 2} more RTMP credits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
