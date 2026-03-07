"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TopUpDialog } from "@/components/wallet/top-up-dialog"
import { useAuth } from "@/lib/auth-context"
import { mockStreamerStats, mockEvents, mockOrders } from "@/lib/mock-data"
import { Radio, Wallet, Eye, Calendar, Package, Plus, Play } from "lucide-react"
import type { LiveEvent, Order } from "@/lib/types"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StreamerDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const stats = mockStreamerStats

  const [topUpOpen, setTopUpOpen] = useState(false)

  const handleTopUp = async (amount: number, gateway: string) => {
    // In production, this would call the payment gateway API
    setTopUpOpen(false)
  }

  const handleGoLive = (eventId: string) => {
    router.push(`/streamer/events/${eventId}/stream`)
  }

  const eventColumns = [
    {
      key: "title",
      header: "Event",
      render: (item: LiveEvent) => (
        <div>
          <p className="font-medium text-foreground">{item.title}</p>
          <p className="text-sm text-muted-foreground capitalize">{item.streamType}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: LiveEvent) => <StatusBadge status={item.status} />,
    },
    {
      key: "currentViewers",
      header: "Viewers",
      render: (item: LiveEvent) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{item.currentViewers}</span>
        </div>
      ),
    },
    {
      key: "scheduledAt",
      header: "Scheduled",
      render: (item: LiveEvent) => (
        <span className="text-muted-foreground">
          {item.scheduledAt ? new Date(item.scheduledAt).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item: LiveEvent) =>
        item.status === "scheduled" && (
          <Button size="sm" variant="outline" className="h-7 bg-transparent" onClick={() => handleGoLive(item.id)}>
            <Play className="mr-1 h-3 w-3" />
            Go Live
          </Button>
        ),
    },
  ]

  const orderColumns = [
    {
      key: "id",
      header: "Order ID",
      render: (item: Order) => <span className="font-mono text-sm text-foreground">{item.id}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (item: Order) => <span className="font-mono text-foreground">₹{(item.totalPrice / 100).toLocaleString("en-IN")}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Order) => <StatusBadge status={item.status} />,
    },
    {
      key: "createdAt",
      header: "Date",
      render: (item: Order) => (
        <span className="text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
      ),
    },
  ]

  const totalCredits = Object.values(stats.streamTypeCredits).reduce((sum, c) => sum + c, 0)
  const hasCredits = totalCredits > 0

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Wallet Balance" value={`₹${stats.walletBalance.toLocaleString()}`} icon={Wallet} />
          <StatsCard title="Total Events" value={stats.totalEvents} icon={Radio} />
          <StatsCard title="Active Events" value={stats.activeEvents} icon={Calendar} />
          <StatsCard title="Total Views" value={stats.totalViews.toLocaleString()} icon={Eye} />
        </div>

        {/* Package Status & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Stream Credits */}
          <Card className="border-border bg-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Stream Credits
              </CardTitle>
              <CardDescription>
                {hasCredits
                  ? `You have ${totalCredits} credits remaining across stream types`
                  : "No credits purchased yet"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasCredits ? (
                <div className="space-y-3">
                  {Object.entries(stats.streamTypeCredits).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground capitalize">{key.replace("_", " ")}</span>
                      <span className="text-sm font-medium text-foreground">{count} credits</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-end pt-2">
                    <Button size="sm" variant="outline" className="border-border bg-transparent" asChild>
                      <Link href="/streamer/packages">Buy More Credits</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="mb-4 text-muted-foreground">No credits purchased yet</p>
                  <Button asChild>
                    <Link href="/streamer/packages">
                      <Plus className="mr-2 h-4 w-4" />
                      Buy Credits
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/streamer/events/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Event
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-border bg-transparent"
                onClick={() => setTopUpOpen(true)}
              >
                <Wallet className="mr-2 h-4 w-4" />
                Top Up Wallet
              </Button>
              <Button variant="outline" className="w-full justify-start border-border bg-transparent" asChild>
                <Link href="/streamer/packages">
                  <Package className="mr-2 h-4 w-4" />
                  View Packages
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* My Events */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Events</CardTitle>
            <Button size="sm" asChild>
              <Link href="/streamer/events/new">
                <Plus className="mr-2 h-4 w-4" />
                New Event
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable columns={eventColumns} data={mockEvents.filter((e) => e.userId === "streamer-1").slice(0, 5)} />
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary" asChild>
              <Link href="/streamer/orders">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable columns={orderColumns} data={mockOrders.filter((o) => o.userId === "streamer-1").slice(0, 3)} />
          </CardContent>
        </Card>
      </div>

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} onConfirm={handleTopUp} />
    </div>
  )
}
