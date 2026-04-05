"use client"

import { useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { DashboardFetchError } from "@/components/dashboard/dashboard-fetch-error"
import { DashboardStatsSkeleton } from "@/components/dashboard/dashboard-stats-skeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { formatPaisa } from "@/lib/cascade-wallet-service"
import { formatWalletTransactionCategory } from "@/lib/wallet-category-labels"
import type { StreamTypeCredits } from "@/lib/types"
import { Radio, Wallet, Eye, Calendar, Package, Plus, Play, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { StudioUpgradeCallout } from "@/components/streamer/studio-upgrade-callout"
import { StudioUpgradeCheckoutDialog } from "@/components/streamer/studio-upgrade-checkout-dialog"
import { StreamCreditPricingSummary } from "@/components/dashboard/stream-credit-pricing-summary"
import type { StreamCreditPricingSnapshot } from "@/components/dashboard/stream-credit-pricing-summary"
import { parseStudioAnnualSubscription } from "@/lib/studio-subscription-public"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const LOW_WALLET_THRESHOLD_PAISE = 5000

type DashboardStats = {
  totalEvents?: number
  liveEvents?: number
  scheduledEvents?: number
  completedEvents?: number
  totalViews?: number
  walletBalance?: number
  credits?: StreamTypeCredits
  totalCreditsRemaining?: number
}

export default function StreamerDashboard() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [studioUpgradeOpen, setStudioUpgradeOpen] = useState(false)

  const swrKey =
    user && (user.role === "streamer" || user.role === "admin") ? "/api/streamer/dashboard" : null

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, { refreshInterval: 30_000 })

  const settingsSwrKey = user?.role === "streamer" ? "/api/settings" : null
  const { data: settingsData } = useSWR(settingsSwrKey, fetcher, { refreshInterval: 60_000 })
  const settingsRows = (settingsData?.settings ?? []) as { key: string; value: unknown }[]
  const studioSubRaw = settingsRows.find((s) => s.key === "studio_annual_subscription")?.value
  const studioSubscription = parseStudioAnnualSubscription(studioSubRaw)
  const studioSalesEmail = process.env.NEXT_PUBLIC_STUDIO_SALES_EMAIL
  const studioUpgradeAvailable = Boolean(
    studioSubscription?.enabled && studioSubscription.pricePaisa > 0,
  )

  const stats = data?.stats as DashboardStats | undefined
  const events = (data?.events ?? []) as Record<string, unknown>[]
  const transactions = (data?.transactions ?? []) as Record<string, unknown>[]
  const creditPricing = data?.creditPricing as StreamCreditPricingSnapshot | undefined

  const walletBalancePaise = Number(stats?.walletBalance ?? 0)
  const lowBalanceWarning = walletBalancePaise < LOW_WALLET_THRESHOLD_PAISE

  const streamCredits = stats?.credits ?? {
    rtmp: 0,
    youtube_api: 0,
    youtube_embed: 0,
    third_party: 0,
  }
  const totalCredits =
    typeof stats?.totalCreditsRemaining === "number"
      ? stats.totalCreditsRemaining
      : Object.values(streamCredits).reduce((s, c) => s + (typeof c === "number" ? c : 0), 0)
  const hasCredits = totalCredits > 0

  const handleGoLive = (eventId: string) => {
    router.push(`/streamer/control-center/${eventId}/stream`)
  }

  const eventColumns = [
    {
      key: "title",
      header: "Event",
      render: (item: Record<string, unknown>) => (
        <div>
          <p className="font-medium text-foreground">{item.title as string}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {String(item.streamType ?? "").replace(/_/g, " ")}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Record<string, unknown>) => <StatusBadge status={item.status as string} />,
    },
    {
      key: "currentViewers",
      header: "Viewers",
      render: (item: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{(item.currentViewers as number) ?? 0}</span>
        </div>
      ),
    },
    {
      key: "scheduledAt",
      header: "Scheduled",
      render: (item: Record<string, unknown>) => (
        <span className="text-muted-foreground">
          {item.scheduledAt ? new Date(item.scheduledAt as string).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item: Record<string, unknown>) =>
        item.status === "scheduled" && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-transparent"
            type="button"
            onClick={() => handleGoLive(String(item.id))}
          >
            <Play className="mr-1 h-3 w-3" />
            Go Live
          </Button>
        ),
    },
  ]

  const transactionColumns = [
    {
      key: "createdAt",
      header: "Date",
      render: (item: Record<string, unknown>) => (
        <span className="text-muted-foreground">
          {item.createdAt ? new Date(item.createdAt as string).toLocaleString() : "-"}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (item: Record<string, unknown>) => {
        const isCredit = item.type === "credit"
        return (
          <StatusBadge status={isCredit ? "Credit" : "Debit"} variant={isCredit ? "success" : "error"} />
        )
      },
    },
    {
      key: "category",
      header: "Category",
      render: (item: Record<string, unknown>) => (
        <span className="text-sm text-foreground">{formatWalletTransactionCategory(String(item.category ?? ""))}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (item: Record<string, unknown>) => {
        const isCredit = item.type === "credit"
        const amt = Number(item.amount ?? 0)
        return (
          <span className={`font-mono tabular-nums ${isCredit ? "text-emerald-600" : "text-red-600"}`}>
            {isCredit ? "+" : "-"}
            {formatPaisa(amt)}
          </span>
        )
      },
    },
    {
      key: "balanceAfter",
      header: "Balance after",
      render: (item: Record<string, unknown>) => (
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {formatPaisa(Number(item.balanceAfter ?? 0))}
        </span>
      ),
    },
    {
      key: "description",
      header: "Details",
      render: (item: Record<string, unknown>) => (
        <span className="max-w-[200px] truncate text-sm text-muted-foreground" title={String(item.description ?? "")}>
          {String(item.description ?? "—")}
        </span>
      ),
    },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="Loading…" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DashboardStatsSkeleton count={5} />
        </div>
      </div>
    )
  }

  if (user && user.role !== "streamer" && user.role !== "admin") {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle={user.name} />
        <p className="text-sm text-muted-foreground">This area is for streamer accounts.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle={`Welcome back, ${user?.name}`} />
        <DashboardFetchError onRetry={() => void mutate()} />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <div className="space-y-6">
        {!isLoading && lowBalanceWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low wallet balance</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2">
              Your balance is {formatPaisa(walletBalancePaise)}. Add funds to buy credits or cover charges.
              <Button variant="outline" size="sm" className="bg-transparent" asChild>
                <Link href="/streamer/wallet">Add funds</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {user?.role === "streamer" && (
          <>
            <StudioUpgradeCallout
              subscription={studioSubscription}
              salesEmail={studioSalesEmail}
              variant="dashboard"
              upgradeAvailable={studioUpgradeAvailable}
              onUpgradeClick={() => setStudioUpgradeOpen(true)}
            />
            {studioUpgradeAvailable && studioSubscription ? (
              <StudioUpgradeCheckoutDialog
                open={studioUpgradeOpen}
                onOpenChange={setStudioUpgradeOpen}
                pricePaisa={studioSubscription.pricePaisa}
                walletBalancePaise={walletBalancePaise}
                onPaidSuccess={() => router.push("/upgrade/studio/success?upgraded=1")}
              />
            ) : null}
          </>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {isLoading ? (
            <DashboardStatsSkeleton count={5} />
          ) : (
            <>
              <StatsCard title="Wallet Balance" value={formatPaisa(walletBalancePaise)} icon={Wallet} />
              <StatsCard title="Total Events" value={stats?.totalEvents ?? 0} icon={Radio} />
              <StatsCard title="Live Events" value={stats?.liveEvents ?? 0} icon={Radio} iconColor="text-red-500" />
              <StatsCard
                title="Scheduled"
                value={stats?.scheduledEvents ?? 0}
                icon={Calendar}
                iconColor="text-blue-500"
              />
              <StatsCard title="Total Views" value={(stats?.totalViews ?? 0).toLocaleString()} icon={Eye} />
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/streamer/wallet">
              <Wallet className="mr-2 h-4 w-4" />
              Recharge wallet
            </Link>
          </Button>
          <Button variant="outline" className="border-border bg-transparent" asChild>
            <Link href="/streamer/control-center/new">
              <Plus className="mr-2 h-4 w-4" />
              Create event
            </Link>
          </Button>
          <Button variant="outline" className="border-border bg-transparent" asChild>
            <Link href="/streamer/packages">
              <Package className="mr-2 h-4 w-4" />
              Buy credits
            </Link>
          </Button>
        </div>

        <StreamCreditPricingSummary
          packagesHref="/streamer/packages"
          creditPricing={creditPricing}
          loading={isLoading}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Stream credits
              </CardTitle>
              <CardDescription>
                {hasCredits
                  ? `${totalCredits} credits remaining across stream types`
                  : "No credits yet — purchase packs to create events."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : hasCredits ? (
                <div className="space-y-3">
                  {Object.entries(streamCredits).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize text-muted-foreground">{key.replace(/_/g, " ")}</span>
                      <span className="text-sm font-medium text-foreground">{count} credits</span>
                    </div>
                  ))}
                  <div className="flex justify-end pt-2">
                    <Button size="sm" variant="outline" className="border-border bg-transparent" asChild>
                      <Link href="/streamer/packages">Buy more credits</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">No credits yet</p>
                  <Button asChild>
                    <Link href="/streamer/packages">
                      <Plus className="mr-2 h-4 w-4" />
                      Buy credits
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/streamer/control-center/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New event
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-border bg-transparent" asChild>
                <Link href="/streamer/wallet">
                  <Wallet className="mr-2 h-4 w-4" />
                  Wallet
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-border bg-transparent" asChild>
                <Link href="/streamer/packages">
                  <Package className="mr-2 h-4 w-4" />
                  Packages
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My events</CardTitle>
            <Button size="sm" asChild>
              <Link href="/streamer/control-center/new">
                <Plus className="mr-2 h-4 w-4" />
                New event
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No events yet</p>
            ) : (
              <DataTable
                columns={eventColumns}
                data={events.slice(0, 5) as (Record<string, unknown> & { id: string })[]}
              />
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent transactions</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Credits and debits across wallet, credits, and services
              </CardDescription>
            </div>
            <Button size="sm" variant="ghost" className="text-primary shrink-0" asChild>
              <Link href="/streamer/wallet">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No transactions yet</p>
            ) : (
              <DataTable
                columns={transactionColumns}
                data={transactions.slice(0, 5) as (Record<string, unknown> & { id: string })[]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
