"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Users, DollarSign, Radio, AlertCircle } from "lucide-react"
import { mockOrders, mockResellerStats, mockEvents, mockUsers } from "@/lib/mock-data"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"
import { useMemo } from "react"

export default function ResellerAnalyticsPage() {
  const profitStats = useMemo(() => {
    const myOrders = mockOrders.filter((o) => o.status === "completed")
    // Assuming 20% profit margin for reseller
    const totalProfit = myOrders.reduce((sum, order) => sum + order.totalPrice * 0.2, 0)
    const missedSales = mockOrders.filter((o) => o.status === "failed" && o.failureReason?.includes("Reseller"))
    const lostProfit = missedSales.reduce((sum, order) => sum + order.totalPrice * 0.2, 0)

    return {
      totalProfit,
      completedOrders: myOrders.length,
      missedSales: missedSales.length,
      lostProfit,
    }
  }, [])

  const profitTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
    return months.map((month) => ({
      month,
      profit: Math.floor(Math.random() * 15000) + 8000,
      customers: Math.floor(Math.random() * 20) + 30,
    }))
  }, [])

  const topCustomers = useMemo(() => {
    const customers = mockUsers.filter((u) => u.role === "user").slice(0, 5)
    return customers.map((customer) => ({
      name: customer.name,
      events: Math.floor(Math.random() * 15) + 5,
      revenue: Math.floor(Math.random() * 10000) + 5000,
    }))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Monitor your business performance and customer activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Math.round(profitStats.totalProfit).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From {profitStats.completedOrders} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.filter((u) => u.role === "user").length}</div>
            <p className="text-xs text-muted-foreground">{mockResellerStats.activeUsers} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockEvents.length}</div>
            <p className="text-xs text-muted-foreground">{mockResellerStats.activeEvents} currently live</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed Sales</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profitStats.missedSales}</div>
            <p className="text-xs text-muted-foreground">
              ₹{Math.round(profitStats.lostProfit).toLocaleString()} profit lost
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                profit: { label: "Profit", color: "hsl(var(--chart-1))" },
              }}
              className="h-[300px]"
            >
              <AreaChart data={profitTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--color-profit)"
                  fill="var(--color-profit)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                customers: { label: "Customers", color: "hsl(var(--chart-2))" },
              }}
              className="h-[300px]"
            >
              <LineChart data={profitTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="customers" stroke="var(--color-customers)" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Customers by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer, idx) => (
              <div key={customer.name} className="flex items-center justify-between border-b pb-4 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.events} events</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">₹{customer.revenue.toLocaleString()}</p>
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
