"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Video,
  Youtube,
  MonitorPlay,
  Globe,
  ShoppingCart,
  Minus,
  Plus,
  CreditCard,
  TrendingDown,
  Wallet,
  Clock,
  Users,
  Loader2,
  Sparkles,
} from "lucide-react"
import type { StreamTypeKey, StreamTypePricing, StreamTypeCredits } from "@/lib/types"
import { formatPaisa } from "@/lib/cascade-wallet-service"
import { getBestPriceForQuantity } from "@/lib/stream-type-pricing"
import { normalizeUserCreditsRow } from "@/lib/normalize-user-credits"
import type { ParsedValidityExtensions } from "@/lib/validity-extensions"
import { parseAiImagePricing, type AiImagePricingConfig } from "@/lib/ai-image-generation"
import { toast } from "sonner"

const streamTypeInfo = [
  { key: "rtmp" as StreamTypeKey, label: "RTMP Server", description: "Use OBS or Wirecast to stream", icon: Video },
  { key: "youtube_api" as StreamTypeKey, label: "YouTube API", description: "Direct broadcast via API", icon: Youtube, recommended: true },
  { key: "youtube_embed" as StreamTypeKey, label: "YouTube Embed", description: "Embed an existing stream", icon: MonitorPlay },
  { key: "third_party" as StreamTypeKey, label: "Third Party", description: "External embed URL", icon: Globe },
]

type Variant = "studio" | "streamer"

export function BuyStreamCreditsPage({ variant }: { variant: Variant }) {
  const [streamTypePricing, setStreamTypePricing] = useState<StreamTypePricing | null>(null)
  const [validityExtensions, setValidityExtensions] = useState<ParsedValidityExtensions | null>(null)
  const [aiImagePricing, setAiImagePricing] = useState<AiImagePricingConfig | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [credits, setCredits] = useState<StreamTypeCredits>({
    rtmp: 0,
    youtube_api: 0,
    youtube_embed: 0,
    third_party: 0,
  })
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading")
  const [purchaseBusy, setPurchaseBusy] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoadState("loading")
    try {
      const [pRes, wRes, cRes, sRes] = await Promise.all([
        fetch("/api/credits/pricing"),
        fetch("/api/wallets"),
        fetch("/api/credits"),
        fetch("/api/settings"),
      ])

      if (!pRes.ok) {
        const err = (await pRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || "Failed to load pricing")
      }
      const pData = (await pRes.json()) as {
        streamTypePricing?: StreamTypePricing
        validityExtensions?: ParsedValidityExtensions
      }
      if (!pData.streamTypePricing) throw new Error("Invalid pricing response")
      setStreamTypePricing(pData.streamTypePricing)
      setValidityExtensions(
        pData.validityExtensions ?? {
          defaultDays: 30,
          tiers: [],
        },
      )

      if (wRes.ok) {
        const wData = (await wRes.json()) as { wallet?: { balance?: number } }
        setWalletBalance(Number(wData.wallet?.balance ?? 0))
      } else {
        setWalletBalance(0)
      }

      if (cRes.ok) {
        const cData = (await cRes.json()) as { credits?: Record<string, unknown> }
        setCredits(normalizeUserCreditsRow(cData.credits))
      } else {
        setCredits({ rtmp: 0, youtube_api: 0, youtube_embed: 0, third_party: 0 })
      }

      if (sRes.ok) {
        const sData = (await sRes.json()) as { settings?: { key: string; value: unknown }[] }
        const aiSetting = sData.settings?.find((s) => s.key === "ai_image_pricing")?.value
        setAiImagePricing(parseAiImagePricing(aiSetting))
      } else {
        setAiImagePricing(parseAiImagePricing(null))
      }

      setLoadState("ready")
    } catch (e) {
      console.error(e)
      setLoadState("error")
      toast.error(e instanceof Error ? e.message : "Failed to load")
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

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

  const handlePurchase = async (streamType: StreamTypeKey) => {
    if (!streamTypePricing) return
    const qty = quantities[streamType] ?? 1
    setPurchaseBusy(streamType)
    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamType, quantity: qty }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        credits?: Record<string, unknown>
      }
      if (!res.ok) {
        toast.error(data.error || "Purchase failed")
        return
      }
      if (data.credits) {
        setCredits(normalizeUserCreditsRow(data.credits))
      }
      const wRes = await fetch("/api/wallets")
      if (wRes.ok) {
        const wData = (await wRes.json()) as { wallet?: { balance?: number } }
        setWalletBalance(Number(wData.wallet?.balance ?? 0))
      }
      toast.success(`Purchased ${qty}× ${streamType.replace(/_/g, " ")} credits`)
    } catch {
      toast.error("Network error")
    } finally {
      setPurchaseBusy(null)
    }
  }

  if (loadState === "loading" || !streamTypePricing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm">Loading credits and pricing…</p>
      </div>
    )
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-muted-foreground">Could not load pricing or wallet.</p>
        <Button type="button" onClick={() => void loadAll()}>
          Retry
        </Button>
      </div>
    )
  }

  const ve = validityExtensions ?? { defaultDays: 30, tiers: [] }
  const enabledStreamTypes = streamTypeInfo.filter((st) => streamTypePricing[st.key].enabled)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Buy Stream Credits</h1>
          <p className="text-muted-foreground">
            {variant === "studio"
              ? "Purchase credits for your streamers. Buy in bulk for volume discounts."
              : "Purchase credits per stream type. Buy in bulk for volume discounts."}
          </p>
        </div>
        <Card className="border-border bg-card px-4 py-2 shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Wallet:</span>
            <span className="font-bold">{formatPaisa(walletBalance)}</span>
          </div>
        </Card>
      </div>

      {variant === "studio" && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span>
              Credits purchased here are available for{" "}
              <span className="font-medium text-foreground">all streamers</span> in your studio to use when creating events.
            </span>
          </div>
        </div>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            {variant === "studio" ? "Studio Credits" : "Your Credits"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enabledStreamTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No stream credit types are available right now. Ask your platform admin to enable at least one stream type
              under Admin → Pricing.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {enabledStreamTypes.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold">{credits[key]}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        {enabledStreamTypes.map(({ key, label, description, icon: Icon, recommended }) => {
          const config = streamTypePricing[key]

          const qty = quantities[key] ?? 1
          const { pricePerEvent, tierLabel, totalPrice, savings } = getBestPriceForQuantity(key, qty, streamTypePricing)
          const walletEnough = walletBalance >= totalPrice
          const busy = purchaseBusy === key

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
                        {recommended && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Recommended
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Base price</p>
                    <p className="text-lg font-bold">
                      {formatPaisa(config.basePrice)}
                      <span className="text-xs font-normal text-muted-foreground">/credit</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row lg:items-end gap-4">
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

                      <div className="hidden md:flex items-center gap-1 ml-2">
                        {config.volumeDiscountTiers.map((tier) => (
                          <Button
                            key={tier.minQty}
                            variant={qty === tier.minQty ? "default" : "outline"}
                            size="sm"
                            className="h-8 text-xs"
                            type="button"
                            onClick={() => setQty(key, tier.minQty)}
                          >
                            {tier.minQty}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex items-end justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Price/credit:</span>
                        <span className="font-medium">{formatPaisa(pricePerEvent)}</span>
                        {tierLabel && (
                          <Badge variant="secondary" className="text-[10px]">
                            <TrendingDown className="mr-1 h-3 w-3" />
                            {tierLabel}
                          </Badge>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-xs text-emerald-500">You save {formatPaisa(savings)} with volume discount</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="text-xl font-bold">{formatPaisa(totalPrice)}</p>
                      </div>
                      <Button type="button" onClick={() => void handlePurchase(key)} disabled={!walletEnough || busy}>
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                        Buy {qty} Credits
                      </Button>
                    </div>
                  </div>
                </div>

                {config.volumeDiscountTiers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Volume Discounts</p>
                    <div className="flex flex-wrap gap-2">
                      {config.volumeDiscountTiers.map((tier) => {
                        const discount = Math.round((1 - tier.pricePerEvent / config.basePrice) * 100)
                        const isActive = qty >= tier.minQty
                        return (
                          <div
                            key={tier.minQty}
                            className={`rounded-md px-3 py-1.5 text-xs ${
                              isActive ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/50 text-muted-foreground"
                            }`}
                          >
                            {tier.minQty}+ credits: {formatPaisa(tier.pricePerEvent)}/ea ({discount}% off)
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!walletEnough && (
                  <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="text-destructive">
                      Insufficient wallet balance. You need {formatPaisa(totalPrice - walletBalance)} more.
                    </span>
                    <Link
                      href={variant === "studio" ? "/studio/wallet" : "/streamer/wallet"}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Add funds to wallet
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Event Validity Extensions</CardTitle>
          </div>
          <CardDescription>
            Each event is valid for {ve.defaultDays} days by default. Extending costs additional credits of the same stream type (admin-configured).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
              <p className="text-lg font-bold">{ve.defaultDays} days</p>
              <p className="text-xs text-primary">Default validity</p>
            </div>
            {ve.tiers
              .filter((t) => t.enabled)
              .map((tier) => (
                <div key={tier.days} className="rounded-lg bg-secondary/50 p-3 text-center">
                  <p className="text-lg font-bold">{tier.days} days</p>
                  <p className="text-xs text-muted-foreground">
                    +{tier.creditCost} credit{tier.creditCost > 1 ? "s" : ""}
                  </p>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Image Generation / On-Demand Features */}
      {aiImagePricing && aiImagePricing.enabled && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">On-Demand Features</CardTitle>
            </div>
            <CardDescription>
              Features billed instantly from your wallet balance as you use them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
              <div>
                <p className="font-semibold">AI Image Generation</p>
                <p className="text-sm text-muted-foreground">Generate high-fidelity event images via prompt.</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold">{formatPaisa(aiImagePricing.price)}</p>
                <p className="text-xs text-muted-foreground">per image</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

