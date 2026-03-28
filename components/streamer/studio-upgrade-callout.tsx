"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPaisa } from "@/lib/cascade-wallet-service"
import { Building2, Globe, Mail } from "lucide-react"

export type StudioUpgradeCalloutProps = {
  /** Parsed from `studio_annual_subscription` setting; omit if unknown */
  subscription?: { enabled: boolean; pricePaisa: number } | null
  /** When set, shows a secondary “Contact sales” button with mailto */
  salesEmail?: string
  /** Compact card for dashboard; relaxed padding for upgrade page top */
  variant?: "dashboard" | "page"
  /** Opens checkout (payment) when subscription is available */
  onUpgradeClick?: () => void
  /** When true, primary “Upgrade to Studio” is enabled (subscription on + price) */
  upgradeAvailable?: boolean
}

export function StudioUpgradeCallout({
  subscription,
  salesEmail,
  variant = "dashboard",
  onUpgradeClick,
  upgradeAvailable = false,
}: StudioUpgradeCalloutProps) {
  const showPricing = Boolean(subscription?.enabled && subscription.pricePaisa > 0)
  const salesHref = salesEmail?.trim()
    ? `mailto:${salesEmail.trim()}?subject=${encodeURIComponent("Studio upgrade — custom domain")}`
    : null

  return (
    <Card
      className={
        variant === "dashboard"
          ? "border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card"
          : "border-border bg-card"
      }
    >
      <CardHeader className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl">Run your own white-label studio</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Custom domain (e.g. www.yourbrand.com) with SSL and full white-label branding: logo, colors, and
                platform name for viewers
              </CardDescription>
            </div>
          </div>
          <Building2 className="hidden h-8 w-8 shrink-0 text-primary/40 sm:block" aria-hidden />
        </div>
        {showPricing && (
          <p className="text-sm font-medium text-foreground pt-1">
            Studio annual subscription from{" "}
            <span className="tabular-nums text-primary">{formatPaisa(subscription!.pricePaisa)}</span>
            <span className="font-normal text-muted-foreground"> / year</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={!upgradeAvailable} onClick={() => onUpgradeClick?.()}>
            Upgrade to Studio
          </Button>
          {salesHref ? (
            <Button variant="outline" className="border-border bg-transparent" asChild>
              <a href={salesHref}>
                <Mail className="mr-2 h-4 w-4" />
                Contact sales
              </a>
            </Button>
          ) : null}
        </div>
        {!showPricing ? (
          <p className="text-xs text-muted-foreground">
            Studio subscription pricing is not available right now. Use Contact sales or check back later.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
