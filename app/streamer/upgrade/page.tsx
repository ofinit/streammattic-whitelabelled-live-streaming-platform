"use client"

import useSWR from "swr"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { StudioUpgradeCallout } from "@/components/streamer/studio-upgrade-callout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { parseStudioAnnualSubscription } from "@/lib/studio-subscription-public"
import { STUDIO_UPGRADE_DOMAIN_HINT } from "@/lib/studio-upgrade-copy"
import { ArrowLeft, Server } from "lucide-react"
import { getPlatformARecordDisplay, getPlatformCnameDisplay } from "@/lib/platform-dns"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StreamerUpgradePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { data } = useSWR(user?.role === "streamer" ? "/api/settings" : null, fetcher)
  const settings = (data?.settings ?? []) as { key: string; value: unknown }[]
  const subRaw = settings.find((s) => s.key === "studio_annual_subscription")?.value
  const subscription = parseStudioAnnualSubscription(subRaw)
  const salesEmail = process.env.NEXT_PUBLIC_STUDIO_SALES_EMAIL

  const studioUpgradeAvailable = Boolean(subscription?.enabled && subscription.pricePaisa > 0)

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Upgrade to Studio" subtitle="Loading…" />
      </div>
    )
  }

  if (user?.role !== "streamer") {
    return (
      <div className="min-h-screen space-y-4">
        <Header title="Upgrade to Studio" subtitle={user?.name} />
        <p className="text-sm text-muted-foreground">This page is available for streamer accounts.</p>
        <Button variant="outline" asChild>
          <Link href="/streamer">Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6">
      <Header
        title="Upgrade to Studio"
        subtitle="White-label your streaming business on a custom domain"
      />

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
          <Link href="/streamer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>

      <p className="max-w-3xl text-muted-foreground">
        Streamer accounts are perfect for solo creators. When you are ready to serve clients under your own brand,
        a Studio account unlocks a dedicated portal on your domain—so every event page and dashboard feels like{" "}
        <em>your</em> product, not a generic host.
      </p>

      <StudioUpgradeCallout
        subscription={subscription}
        salesEmail={salesEmail}
        variant="page"
        upgradeAvailable={studioUpgradeAvailable}
        onUpgradeClick={() => router.push("/studio/setup")}
      />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            How custom domain setup works
          </CardTitle>
          <CardDescription>After you upgrade, you will connect your domain in the Studio area.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{STUDIO_UPGRADE_DOMAIN_HINT}</p>
          <p>
            Exact A records and verification tokens are generated specifically for your account and shown in the Studio dashboard after upgrade. 
            Our automated DNS system can handle the configuration for you if you use Cloudflare.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
