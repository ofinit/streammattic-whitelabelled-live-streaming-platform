"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Video,
  Youtube,
  MonitorPlay,
  Globe,
  Package,
  PackageIcon,
  CheckCircle,
  Clock,
  Zap,
  Sparkles,
  Crown,
  Star,
  ArrowRight,
} from "lucide-react"
import { mockUserInventory } from "@/lib/mock-data"
import type { EventPack, ValidityTier, ValidityStreamKey } from "@/lib/types"
import { EventPackPurchaseDialog } from "@/components/packages/event-pack-purchase-dialog"
import { toast } from "sonner"

// Stream types with prices (from admin config -- in production fetched from API)
const streamTypes = [
  { key: "rtmp" as ValidityStreamKey, label: "RTMP Server", description: "Use OBS or Wirecast to stream", icon: Video, userPrice: 1200, enabled: true },
  { key: "youtube_api" as ValidityStreamKey, label: "YouTube API", description: "Direct broadcast via API", icon: Youtube, userPrice: 800, enabled: true, recommended: true },
  { key: "youtube_embed" as ValidityStreamKey, label: "YouTube Embed", description: "Embed an existing stream", icon: MonitorPlay, userPrice: 400, enabled: true },
  { key: "third_party" as ValidityStreamKey, label: "Third Party", description: "External embed URL", icon: Globe, userPrice: 300, enabled: false },
]

// Event packs (from admin config)
const availableEventPacks: EventPack[] = [
  { id: "pack-1", name: "Starter Pack", eventCount: 10, userPrice: 10000, resellerPrice: 5000, enabled: true, sortOrder: 1 },
  { id: "pack-2", name: "Growth Pack", eventCount: 50, userPrice: 40000, resellerPrice: 20000, enabled: true, sortOrder: 2 },
  { id: "pack-3", name: "Pro Pack", eventCount: 100, userPrice: 60000, resellerPrice: 30000, enabled: true, sortOrder: 3 },
  { id: "pack-4", name: "Enterprise Pack", eventCount: 500, userPrice: 200000, resellerPrice: 100000, enabled: true, sortOrder: 4 },
]

// Validity tiers (from admin config)
const validityTiers: ValidityTier[] = [
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

const packIcons: Record<string, typeof Zap> = {
  "Starter Pack": Zap,
  "Growth Pack": Sparkles,
  "Pro Pack": Crown,
  "Enterprise Pack": Star,
}

export default function UserPackagesPage() {
  const [activeTab, setActiveTab] = useState("pricing")
  const [inventory] = useState(mockUserInventory.filter((i) => i.userId === "user-1"))
  const [purchasePack, setPurchasePack] = useState<EventPack | null>(null)
  const walletBalance = 500

  const handlePurchase = (_packId: string, _validityDays: number) => {
    toast.success("Order placed. Pending approval.")
    setPurchasePack(null)
  }

  const enabledPacks = availableEventPacks.filter((p) => p.enabled)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Packages & Pricing</h1>
        <p className="text-muted-foreground">Per-event stream pricing, prepaid bundles, and your inventory</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pricing">Stream Pricing</TabsTrigger>
          <TabsTrigger value="packs">Event Packs</TabsTrigger>
          <TabsTrigger value="inventory">My Inventory</TabsTrigger>
        </TabsList>

        {/* ───── Tab 1: Per-Event Stream Pricing ───── */}
        <TabsContent value="pricing" className="mt-6 space-y-6">
          {/* Info banner */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>Every event includes <span className="font-medium text-foreground">30 days</span> of validity. Extended durations are available at an additional surcharge.</span>
            </div>
          </div>

          {/* Stream type cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {streamTypes.filter((st) => st.enabled).map((st) => {
              const Icon = st.icon
              return (
                <Card key={st.key} className="relative border-border bg-card">
                  {st.recommended && (
                    <div className="absolute -top-2.5 left-4">
                      <Badge className="bg-primary text-primary-foreground text-[10px]">Recommended</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base">{st.label}</CardTitle>
                        <CardDescription className="text-xs">{st.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">{"₹"}{(st.userPrice / 100).toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">/ event</span>
                    </div>

                    {/* Validity options */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Event Validity</p>
                      <div className="rounded-md bg-secondary/50 px-3 py-2 flex items-center justify-between text-sm">
                        <span>30 days</span>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Included</Badge>
                      </div>
                      {validityTiers.filter((t) => t.enabled).map((tier) => {
                        const surcharge = tier.surcharges[st.key]
                        return (
                          <div key={tier.days} className="rounded-md bg-secondary/30 px-3 py-2 flex items-center justify-between text-sm">
                            <span>{tier.days} days</span>
                            <span className="text-muted-foreground">+{"₹"}{(surcharge.userSurcharge / 100).toFixed(2)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* How it works */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">How Per-Event Pricing Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</div>
                  <div>
                    <p className="text-sm font-medium">Choose Stream Type</p>
                    <p className="text-xs text-muted-foreground">Select RTMP, YouTube API, YouTube Embed, or Third Party when creating an event</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</div>
                  <div>
                    <p className="text-sm font-medium">Select Validity</p>
                    <p className="text-xs text-muted-foreground">30 days is included free. Choose 60-365 days for a surcharge</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</div>
                  <div>
                    <p className="text-sm font-medium">Pay Per Event</p>
                    <p className="text-xs text-muted-foreground">Amount is deducted from your wallet balance when the event is created</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save with packs CTA */}
          {enabledPacks.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Save with Event Packs</p>
                    <p className="text-xs text-muted-foreground">Buy events in bulk and save up to 60% per event</p>
                  </div>
                </div>
  <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setActiveTab("packs")}>
                  View Packs
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ───── Tab 2: Event Packs ───── */}
        <TabsContent value="packs" className="mt-6 space-y-6">
          {/* Info banner */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <span>Prepaid event bundles at discounted rates. Events from packs can be used with <span className="font-medium text-foreground">any stream type</span>.</span>
            </div>
          </div>

          {enabledPacks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No event packs available</h3>
                <p className="mt-2 text-sm text-muted-foreground">Event packs are not currently available for purchase</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {enabledPacks.map((pack, index) => {
                const Icon = packIcons[pack.name] || Zap
                const perEvent = pack.userPrice / pack.eventCount
                const isPopular = index === 1
                // Compare against cheapest per-event stream price
                const cheapestStream = Math.min(...streamTypes.filter((s) => s.enabled).map((s) => s.userPrice))
                const savingsPercent = cheapestStream > 0 ? Math.round((1 - perEvent / cheapestStream) * 100) : 0

                return (
                  <Card key={pack.id} className={`relative flex flex-col border-border bg-card ${isPopular ? "border-primary shadow-md" : ""}`}>
                    {isPopular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground text-[10px]">Best Value</Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{pack.name}</CardTitle>
                      <CardDescription className="text-xs">{pack.eventCount} events</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-2xl font-bold">{"₹"}{(pack.userPrice / 100).toFixed(0)}</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          {savingsPercent > 0 && (
                            <span className="text-xs text-muted-foreground line-through">{"₹"}{(cheapestStream / 100).toFixed(2)}</span>
                          )}
                          <span className={`text-xs ${savingsPercent > 0 ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
                            {"₹"}{(perEvent / 100).toFixed(2)} per event
                          </span>
                        </div>
                        {savingsPercent > 0 && (
                          <div className="mt-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5">
                            <span className="text-sm font-semibold text-emerald-500">Save {savingsPercent}%</span>
                            <p className="text-[10px] text-emerald-500/70 mt-0.5">vs per-event pricing</p>
                          </div>
                        )}
                        {savingsPercent <= 0 && (
                          <div className="mt-2 rounded-md bg-muted/50 px-3 py-1.5">
                            <span className="text-xs text-muted-foreground">Same as per-event</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          <span>{pack.eventCount} events included</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          <span>Works with any stream type</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          <span>30 days default validity</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-primary" />
                          <span>Extended validity available</span>
                        </div>
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0">
                      <Button className="w-full" variant={isPopular ? "default" : "outline"} onClick={() => setPurchasePack(pack)}>
                        Purchase
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Validity surcharges reference */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Extended Validity Surcharges</CardTitle>
              </div>
              <CardDescription className="text-xs">Additional charges when selecting extended event validity. Applied per event in the pack.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground text-xs">
                      <th className="text-left py-2 pr-4 font-medium">Duration</th>
                      {streamTypes.filter((s) => s.enabled).map((st) => (
                        <th key={st.key} className="text-right py-2 px-2 font-medium">{st.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border/50">
                      <td className="py-2 pr-4 font-medium">30 days</td>
                      {streamTypes.filter((s) => s.enabled).map((st) => (
                        <td key={st.key} className="text-right py-2 px-2 text-primary text-xs">Included</td>
                      ))}
                    </tr>
                    {validityTiers.filter((t) => t.enabled).map((tier) => (
                      <tr key={tier.days} className="border-t border-border/50">
                        <td className="py-2 pr-4 font-medium">{tier.days} days</td>
                        {streamTypes.filter((s) => s.enabled).map((st) => (
                          <td key={st.key} className="text-right py-2 px-2 text-muted-foreground">
                            +{"₹"}{(tier.surcharges[st.key].userSurcharge / 100).toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ───── Tab 3: My Inventory ───── */}
        <TabsContent value="inventory" className="mt-6">
          {inventory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No events purchased yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Purchase per-event streams or an event pack to get started</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {inventory.map((inv) => {
                const usage = (inv.usedQty / inv.totalQty) * 100
                return (
                  <Card key={inv.id} className="border-border bg-card">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <PackageIcon className="h-4 w-4" />
                            {inv.package?.name}
                          </CardTitle>
                          <CardDescription className="text-xs">{inv.package?.description}</CardDescription>
                        </div>
                        <Badge variant={inv.availableQty > 0 ? "default" : "secondary"}>
                          {inv.availableQty > 0 ? "Active" : "Depleted"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Usage</span>
                          <span>
                            {inv.usedQty} / {inv.totalQty} events
                          </span>
                        </div>
                        <Progress value={usage} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded-md bg-secondary/50 p-2">
                          <div className="font-semibold">{inv.totalQty}</div>
                          <div className="text-[10px] text-muted-foreground">Total</div>
                        </div>
                        <div className="rounded-md bg-secondary/50 p-2">
                          <div className="font-semibold text-primary">{inv.availableQty}</div>
                          <div className="text-[10px] text-muted-foreground">Available</div>
                        </div>
                        <div className="rounded-md bg-secondary/50 p-2">
                          <div className="font-semibold">{inv.usedQty}</div>
                          <div className="text-[10px] text-muted-foreground">Used</div>
                        </div>
                      </div>

                      {inv.package?.features && (
                        <div className="space-y-1">
                          {inv.package.features.slice(0, 3).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-primary" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <EventPackPurchaseDialog
        open={!!purchasePack}
        onOpenChange={(open) => !open && setPurchasePack(null)}
        pack={purchasePack}
        validityTiers={validityTiers}
        streamTypes={streamTypes}
        walletBalance={walletBalance}
        onConfirm={handlePurchase}
      />
    </div>
  )
}
