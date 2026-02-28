"use client"

import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { Radio, Wallet, AlertTriangle, Plus, Eye, AlertCircle, Calendar } from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ResellerDashboard() {
  const { user } = useAuth()

  // Use a demo reseller ID for now (will use real auth later)
  const resellerId = user?.id || "b0000000-0000-0000-0000-000000000001"

  const { data, error, isLoading } = useSWR(
    `/api/reseller/dashboard?resellerId=${resellerId}`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const stats = data?.stats
  const events = data?.events ?? []

  const walletBalance = Number(stats?.walletBalance ?? 0)
  const lowBalanceWarning = walletBalance < 5000

  const liveOrScheduledEvents = events.filter(
    (e: Record<string, unknown>) => e.status === "live" || e.status === "scheduled"
  )

  const eventColumns = [
    {
      key: "title",
      header: "Event",
      render: (item: Record<string, unknown>) => (
        <div>
          <p className="font-medium text-foreground">{item.title as string}</p>
          <p className="text-sm text-muted-foreground capitalize">{(item.streamType as string)?.replace("_", " ")}</p>
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
          <span className="text-foreground">{item.currentViewers as number ?? 0}</span>
        </div>
      ),
    },
  ]

  if (error) {
    return (
      <div className="min-h-screen">
        <Header title="Reseller Dashboard" subtitle={`Welcome back, ${user?.name}`} />
        <div className="p-6">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Failed to load dashboard data</p>
                <p className="text-sm text-muted-foreground">Please check your connection and try again.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Reseller Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <div className="space-y-6 p-6">
        {!isLoading && lowBalanceWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low Wallet Balance Warning</AlertTitle>
            <AlertDescription>
              Your wallet balance is ₹{walletBalance.toLocaleString()}. Low balance may block event creation.
              <Button variant="outline" size="sm" className="ml-4 bg-transparent" asChild>
                <Link href="/reseller/wallet">Add Funds Now</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border bg-card">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatsCard title="Wallet Balance" value={`₹${walletBalance.toLocaleString()}`} icon={Wallet} />
              <StatsCard title="Total Events" value={stats?.totalEvents ?? 0} icon={Radio} />
              <StatsCard title="Live Events" value={stats?.liveEvents ?? 0} icon={Radio} iconColor="text-red-500" />
              <StatsCard title="Scheduled Events" value={liveOrScheduledEvents.filter((e: Record<string, unknown>) => e.status === "scheduled").length} icon={Calendar} iconColor="text-blue-500" />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link href="/reseller/wallet">
              <Wallet className="mr-2 h-4 w-4" />
              Top Up Wallet
            </Link>
          </Button>
          <Button variant="outline" className="border-border bg-transparent" asChild>
            <Link href="/reseller/events">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>

        {/* Active Events */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Events</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link href="/reseller/events">View All Events</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : liveOrScheduledEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No active events</p>
            ) : (
              <DataTable columns={eventColumns} data={liveOrScheduledEvents.slice(0, 5)} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
