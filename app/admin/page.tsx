"use client"

import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { mockAdminStats, mockResellers, mockOrders, mockEvents } from "@/lib/mock-data"
import { Building2, Users, Radio, DollarSign, AlertTriangle, TrendingUp, Eye, Plus, TrendingDown } from "lucide-react"
import type { Reseller, Order, LiveEvent } from "@/lib/types"

export default function AdminDashboard() {
  const stats = mockAdminStats

  const completedOrders = mockOrders.filter((o) => o.status === "completed")
  const failedOrders = mockOrders.filter((o) => o.status === "failed")

  const blockedSales = [
    {
      id: "bs-1",
      userName: "Rajesh Kumar",
      packageName: "Starter Package",
      insufficientEntityName: "Reseller ABC Corp",
      requiredAmount: 400,
      currentBalance: 150,
      shortfall: 250,
      potentialRevenue: 400,
    },
    {
      id: "bs-2",
      userName: "Priya Singh",
      packageName: "Professional Package",
      insufficientEntityName: "Reseller XYZ Ltd",
      requiredAmount: 800,
      currentBalance: 500,
      shortfall: 300,
      potentialRevenue: 800,
    },
  ]

  const resellerColumns = [
    {
      key: "name",
      header: "Reseller",
      render: (item: Reseller) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: Reseller) => <StatusBadge status={item.status} />,
    },
    {
      key: "totalUsers",
      header: "Users",
      render: (item: Reseller) => <span className="text-foreground">{item.totalUsers}</span>,
    },
    {
      key: "walletBalance",
      header: "Balance",
      render: (item: Reseller) => (
        <span className="font-mono text-foreground">₹{item.walletBalance.toLocaleString()}</span>
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
      key: "userId",
      header: "User",
      render: (item: Order) => <span className="text-foreground">{item.userId}</span>,
    },
    {
      key: "totalPrice",
      header: "Amount",
      render: (item: Order) => <span className="font-mono text-foreground">₹{item.totalPrice}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Order) => <StatusBadge status={item.status} />,
    },
  ]

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
  ]

  return (
    <div className="min-h-screen">
      <Header title="Admin Dashboard" subtitle="Platform overview and management" />

      <div className="space-y-6 p-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Revenue"
            value={`₹${stats.totalRevenue.toLocaleString()}`}
            change={stats.revenueGrowth}
            changeLabel="vs last month"
            icon={DollarSign}
          />
          <StatsCard title="Total Resellers" value={stats.totalResellers} icon={Building2} />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            change={stats.userGrowth}
            changeLabel="vs last month"
            icon={Users}
          />
          <StatsCard title="Active Events" value={stats.activeEvents} icon={Radio} />
        </div>

        {blockedSales.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Blocked Sales - Downstream Insufficient Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {blockedSales.map((sale) => (
                <Alert key={sale.id} variant="destructive">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">
                        User "{sale.userName}" unable to purchase {sale.packageName}
                      </p>
                      <div className="text-sm space-y-1">
                        <p>Blocked by: {sale.insufficientEntityName}</p>
                        <p>
                          Required: ₹{sale.requiredAmount} | Available: ₹{sale.currentBalance} | Short: ₹
                          {sale.shortfall}
                        </p>
                        <p className="font-bold text-destructive">Potential revenue lost: ₹{sale.potentialRevenue}</p>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
              <Button variant="outline" className="w-full bg-transparent">
                View All Blocked Sales
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Secondary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard title="Total Events" value={stats.totalEvents} icon={Radio} />
          <StatsCard
            title="Failed Orders (24h)"
            value={failedOrders.length}
            icon={TrendingDown}
            iconColor="text-destructive"
          />
          <StatsCard
            title="Growth Rate"
            value={`${stats.revenueGrowth}%`}
            icon={TrendingUp}
            iconColor="text-emerald-500"
          />
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Resellers */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Resellers</CardTitle>
              <Button size="sm" variant="outline" className="border-border bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Add Reseller
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={resellerColumns} data={mockResellers.slice(0, 3)} />
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
              <DataTable columns={orderColumns} data={completedOrders.slice(0, 3)} />
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
            <DataTable columns={eventColumns} data={mockEvents.filter((e) => e.status === "live")} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
