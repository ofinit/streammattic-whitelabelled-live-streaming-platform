"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Radio, AlertCircle, Building2 } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminAnalyticsPage() {
  const { data: overviewData, isLoading: isOverviewLoading } = useSWR("/api/admin/analytics/overview", fetcher)
  const { data: revenueData, isLoading: isRevenueLoading } = useSWR("/api/admin/analytics/revenue", fetcher)

  const overview = overviewData?.overview
  const revenueTrend = revenueData?.revenueTrend ?? []
  const topStudios = revenueData?.topStudios ?? []

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
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold">₹{(overview?.platformRevenue || 0).toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">Across all completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streamers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{overview?.totalStreamers || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Total registered streamers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{overview?.totalEvents || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {overview?.liveEvents || 0} currently live
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Studios</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isOverviewLoading ? (
              <Skeleton className="h-8 w-24 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{overview?.totalStudios || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Managed studio platforms</p>
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
              {isRevenueLoading ? (
                <Skeleton className="h-full w-full" />
              ) : revenueTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend}>
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
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isRevenueLoading ? (
                <Skeleton className="h-full w-full" />
              ) : revenueTrend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrend}>
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
              )}
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
            {isRevenueLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)
            ) : topStudios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No studio data available</p>
            ) : (
              topStudios.map((studio: any, idx: number) => (
                <div key={studio.name} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{studio.name}</p>
                      <p className="text-xs text-muted-foreground">{studio.users} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{(studio.revenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
