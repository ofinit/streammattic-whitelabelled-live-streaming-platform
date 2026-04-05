"use client"

import Link from "next/link"
import { Video, Youtube, MonitorPlay, Globe, Package, IndianRupee } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPaisa } from "@/lib/cascade-wallet-service"
import type { StreamTypeKey, StreamTypePricing } from "@/lib/types"
import type { ParsedValidityExtensions } from "@/lib/validity-extensions"

const STREAM_ROWS: {
  key: StreamTypeKey
  label: string
  description: string
  icon: typeof Video
}[] = [
  { key: "rtmp", label: "RTMP Server", description: "OBS / Wirecast", icon: Video },
  { key: "youtube_api", label: "YouTube API", description: "Direct broadcast", icon: Youtube },
  { key: "youtube_embed", label: "YouTube Embed", description: "Embed existing", icon: MonitorPlay },
  { key: "third_party", label: "Third Party", description: "External embed", icon: Globe },
]

export type StreamCreditPricingSnapshot = {
  streamTypePricing: StreamTypePricing
  validityExtensions: ParsedValidityExtensions
}

type StreamCreditPricingSummaryProps = {
  packagesHref: string
  creditPricing?: StreamCreditPricingSnapshot | null
  loading?: boolean
}

export function StreamCreditPricingSummary({
  packagesHref,
  creditPricing,
  loading,
}: StreamCreditPricingSummaryProps) {
  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Stream credit pricing</CardTitle>
          </div>
          <CardDescription>Admin-configured prices per credit (loading…)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
    )
  }

  if (!creditPricing) {
    return null
  }

  const { streamTypePricing, validityExtensions } = creditPricing
  const ve = validityExtensions
  const enabledRows = STREAM_ROWS.filter((row) => streamTypePricing[row.key]?.enabled)

  if (enabledRows.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IndianRupee className="h-5 w-5 text-primary" />
            Stream credit pricing
          </CardTitle>
          <CardDescription>No stream types are currently enabled for purchase. Contact support or check back later.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={packagesHref}>Open Packages</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IndianRupee className="h-5 w-5 text-primary" />
            Stream credit pricing
          </CardTitle>
          <CardDescription>
            Current rates per event credit. Each new event consumes one credit of the stream type you choose. Default
            validity window: {ve.defaultDays} days included; extensions may cost extra credits (see Packages).
          </CardDescription>
        </div>
        <Button className="shrink-0 bg-primary hover:bg-primary/90" asChild>
          <Link href={packagesHref}>
            <Package className="mr-2 h-4 w-4" />
            Buy credits
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-bold">Stream type</th>
                <th className="px-4 py-3 font-bold text-center">Base Price</th>
                <th className="px-4 py-3 font-bold">Volume Packing / Discounts</th>
              </tr>
            </thead>
            <tbody>
              {enabledRows.map(({ key, label, description, icon: Icon }) => {
                const config = streamTypePricing[key]
                const tiers = config.volumeDiscountTiers ?? []
                
                return (
                  <tr key={key} className="border-b border-border/60 last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted/50">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm">{label}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[120px] md:max-w-none">
                            {description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-bold text-foreground tabular-nums">
                        {formatPaisa(config.basePrice)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {tiers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {tiers.map((tier, idx) => (
                            <div 
                              key={idx} 
                              className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium"
                            >
                              <span className="text-primary mr-1.5">{tier.minQty}+ Pack</span>
                              <span className="font-bold text-foreground">{formatPaisa(tier.pricePerEvent)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Standard base pricing only</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground sm:hidden">
          Open Packages on a wider screen or tap Buy credits for full volume tiers and checkout.
        </p>
      </CardContent>
    </Card>
  )
}
