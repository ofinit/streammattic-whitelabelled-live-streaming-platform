"use client"

import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, Users, Radio, DollarSign, TrendingUp, Eye, Plus, TrendingDown, AlertCircle } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminDashboard() {
  const { data, error, isLoading } = useSWR("/api/admin/dashboard", fetcher, {
    refreshInterval: 30000,
  })

  const stats = data?.stats
  const resellers = data?.resellers ?? []
  const recentOrders = data?.recentOrders ?? []
  const recentEvents = data?.recentEvents ?? []

  const liveEvents = recentEvents.filter((e: Record<string, unknown>) => e.status === "live")
  const completedOrders = recentOrders.filter((o: Record<string, unknown>) => o.status === "completed")

  const resellerColumns = [
    {
      key: "name",
      header: "Reseller",
      render: (item: Record<string, unknown>) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            {(item.name as string).charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">{item.name as string}</p>
            <p className="text-sm text-muted-foreground">{item.email as string}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Record<string, unknown>) => <StatusBadge status={item.status as string} />,
    },
    {
      key: "eventsRemaining",
      header: "Events Left",
      render: (item: Record<string, unknown>) => <span className="text-foreground">{item.eventsRemaining as number ?? 0}</span>,
    },
  ]

  const orderColumns = [
    {
      key: "orderNumber",
      header: "Order",
      render: (item: Record<string, unknown>) => <span className="font-mono text-sm text-foreground">{item.orderNumber as string}</span>,
    },
    {
      key: "userName",
      header: "User",
      render: (item: Record<string, unknown>) => <span className="text-foreground">{item.userName as string}</span>,
    },
    {
      key: "total",
      header: "Amount",
      render: (item: Record<string, unknown>) => (
        <span className="font-mono text-foreground">
          ₹{Number(item.total).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Record<string, unknown>) => <StatusBadge status={item.status as string} />,
    },
  ]

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
        <Header title="Admin Dashboard" subtitle="Platform overview and management" />
        <div className="p-6">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-6">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Failed to load dashboard data</p>
                <p className="text-sm text-muted-foreground">Please check your database connection and try again.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" subtitle="Platform overview and management" />

      <div className="space-y-6 p-6">
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
              <StatsCard
                title="Total Revenue"
                value={`₹${Number(stats?.totalRevenue ?? 0).toLocaleString()}`}
                icon={DollarSign}
              />
              <StatsCard title="Total Resellers" value={stats?.totalResellers ?? 0} icon={Building2} />
              <StatsCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} />
              <StatsCard title="Live Events" value={stats?.liveEvents ?? 0} icon={Radio} />
            </>
          )}
        </div>

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
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
              <StatsCard title="Total Events" value={stats?.totalEvents ?? 0} icon={Radio} />
              <StatsCard
                title="Pending Orders"
                value={stats?.pendingOrders ?? 0}
                icon={TrendingDown}
                iconColor="text-yellow-500"
              />
              <StatsCard
                title="Monthly Revenue"
                value={`₹${Number(stats?.monthlyRevenue ?? 0).toLocaleString()}`}
                icon={TrendingUp}
                iconColor="text-emerald-500"
              />
            </>
          )}
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Resellers</CardTitle>
              <Button size="sm" variant="outline" className="border-border bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Add Reseller
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <DataTable columns={resellerColumns} data={resellers.slice(0, 3)} />
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Button size="sm" variant="ghost" className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <DataTable columns={orderColumns} data={completedOrders.slice(0, 3)} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Events */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Live Events</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary">
              View All Events
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : liveEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No live events right now</p>
            ) : (
              <DataTable columns={eventColumns} data={liveEvents} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
