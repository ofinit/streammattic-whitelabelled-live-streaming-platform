"use client"

import { Header } from "@/components/dashboard/header"
import { StatsCard } from "@/components/dashboard/stats-card"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { mockResellerStats, mockUsers, mockOrders, mockEvents } from "@/lib/mock-data"
import { Users, Radio, Wallet, AlertTriangle, Plus, Eye, UserPlus, TrendingDown } from "lucide-react"
import type { EndUser, Order, LiveEvent } from "@/lib/types"

export default function ResellerDashboard() {
  const { user } = useAuth()
  const stats = mockResellerStats

  const missedSales = [
    {
      id: "ms-1",
      userName: "Alice Johnson",
      packageName: "Starter Package",
      userPrice: 999,
      resellerRequired: 600,
      resellerBalance: 400,
      shortfall: 200,
      lostProfit: 399,
      timestamp: new Date(),
    },
    {
      id: "ms-2",
      userName: "Bob Smith",
      streamType: "RTMP Event",
      userPrice: 1500,
      resellerRequired: 1000,
      resellerBalance: 800,
      shortfall: 200,
      lostProfit: 500,
      timestamp: new Date(),
    },
  ]

  const lowBalanceWarning = stats.walletBalance < 5000

  const userColumns = [
    {
      key: "name",
      header: "User",
      render: (item: EndUser) => (
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
      render: (item: EndUser) => <StatusBadge status={item.status} />,
    },
    {
      key: "totalEvents",
      header: "Events",
      render: (item: EndUser) => <span className="text-foreground">{item.totalEvents}</span>,
    },
    {
      key: "walletBalance",
      header: "Balance",
      render: (item: EndUser) => (
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
      <Header title="Reseller Dashboard" subtitle={`Welcome back, ${user?.name}`} />

      <div className="space-y-6 p-6">
        {lowBalanceWarning && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Low Wallet Balance Warning</AlertTitle>
            <AlertDescription>
              Your wallet balance is ₹{stats.walletBalance.toLocaleString()}. Recommended minimum: ₹5,000 for smooth
              operations. Low balance may block sales from your users.
              <Button variant="outline" size="sm" className="ml-4 bg-transparent">
                Add Funds Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Wallet Balance" value={`₹${stats.walletBalance.toLocaleString()}`} icon={Wallet} />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            change={stats.userGrowth}
            changeLabel="vs last month"
            icon={Users}
          />
          <StatsCard title="Active Events" value={stats.activeEvents} icon={Radio} />
          <StatsCard
            title="Missed Sales (24h)"
            value={missedSales.length}
            icon={TrendingDown}
            iconColor="text-destructive"
          />
        </div>

        {missedSales.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Missed Sales - Insufficient Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {missedSales.map((sale) => (
                <div key={sale.id} className="border-l-4 border-destructive pl-4 space-y-2">
                  <p className="font-medium">
                    User "{sale.userName}" tried to{" "}
                    {sale.packageName ? `buy ${sale.packageName}` : `create ${sale.streamType}`}
                  </p>
                  <div className="text-sm space-y-1">
                    <p>You needed: ₹{sale.resellerRequired}</p>
                    <p>You had: ₹{sale.resellerBalance}</p>
                    <p className="font-bold text-destructive">Your profit lost: ₹{sale.lostProfit}</p>
                  </div>
                  <Button size="sm" variant="destructive">
                    Add ₹{sale.shortfall} to Wallet
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button className="bg-primary hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
          <Button variant="outline" className="border-border bg-transparent">
            <Wallet className="mr-2 h-4 w-4" />
            Top Up Wallet
          </Button>
          <Button variant="outline" className="border-border bg-transparent">
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </div>

        {/* Tables Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* My Users */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Users</CardTitle>
              <Button size="sm" variant="ghost" className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={userColumns}
                data={mockUsers.filter((u) => u.resellerId === "reseller-1").slice(0, 3)}
              />
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <Button size="sm" variant="ghost" className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <DataTable columns={orderColumns} data={mockOrders.slice(0, 3)} />
            </CardContent>
          </Card>
        </div>

        {/* Active Events */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Active Events</CardTitle>
            <Button size="sm" variant="ghost" className="text-primary">
              View All Events
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={eventColumns}
              data={mockEvents.filter((e) => e.status === "live" || e.status === "scheduled").slice(0, 5)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
