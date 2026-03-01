"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Radio, AlertCircle } from "lucide-react"
import { mockOrders, mockEvents, mockStreamers } from "@/lib/mock-data"
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { useMemo } from "react"

export default function AdminAnalyticsPage() {
  const revenueStats = useMemo(() => {
    const completedOrders = mockOrders.filter((o) => o.status === "completed")
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    const failedOrders = mockOrders.filter((o) => o.status === "failed")
    const lostRevenue = failedOrders.reduce((sum, order) => sum + order.totalPrice, 0)

    return {
      totalRevenue,
      completedOrders: completedOrders.length,
      failedOrders: failedOrders.length,
      lostRevenue,
    }
  }, [])

  const revenueTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month, idx) => ({
      month,
      revenue: Math.floor(Math.random() * 50000) + 30000,
      orders: Math.floor(Math.random() * 50) + 20,
    }))
  }, [])

  const topStudios = useMemo(() => {
    return [
      { name: "LiveStream Pro", revenue: 45000, users: 89 },
      { name: "EventCast TV", revenue: 32000, users: 56 },
      { name: "StreamHub LLC", revenue: 28000, users: 42 },
    ]
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">Monitor platform performance, revenue, and user activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{revenueStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{revenueStats.completedOrders} completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStreamers.filter((u) => u.role === "user").length}</div>
            <p className="text-xs text-muted-foreground">
              Across {mockStreamers.filter((u) => u.role === "studio").length} studios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEvents.length}</div>
            <p className="text-xs text-muted-foreground">
              {mockEvents.filter((e) => e.status === "live").length} currently live
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Sales</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenueStats.failedOrders}</div>
            <p className="text-xs text-muted-foreground">
              ₹{revenueStats.lostRevenue.toLocaleString()} potential revenue lost
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.2}
                    name="Revenue (₹)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="orders" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Studios by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topStudios.map((studio, idx) => (
              <div key={studio.name} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{studio.name}</p>
                    <p className="text-sm text-muted-foreground">{studio.users} users</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₹{studio.revenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total revenue</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
