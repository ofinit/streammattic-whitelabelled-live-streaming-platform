"use client"

import { useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, DollarSign, Radio, Building2, BarChart3 } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminAnalyticsPage() {
  const [visitorDays, setVisitorDays] = useState(30)
  const { data: overviewData, isLoading: isOverviewLoading } = useSWR("/api/admin/analytics/overview", fetcher)
  const { data: revenueData, isLoading: isRevenueLoading } = useSWR("/api/admin/analytics/revenue", fetcher)
  const { data: visitorsData, isLoading: isVisitorsLoading } = useSWR(
    `/api/admin/analytics/visitors?days=${visitorDays}`,
    fetcher,
  )
  const { data: revenueAttrData, isLoading: isRevenueAttrLoading } = useSWR(
    `/api/admin/analytics/revenue-attribution?days=${visitorDays}`,
    fetcher,
  )

  const overview = overviewData?.overview
  const revenueTrend = revenueData?.revenueTrend ?? []
  const topStudios = revenueData?.topStudios ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">Monitor platform performance, revenue, and user activity</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visitors">Visitors &amp; attribution</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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
                <p className="text-xs text-muted-foreground">{overview?.liveEvents || 0} currently live</p>
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
                        <Line
                          type="monotone"
                          dataKey="orders"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth={2}
                          name="Orders"
                        />
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
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : topStudios.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No studio data available</p>
                ) : (
                  topStudios.map((studio: { name: string; users: number; revenue: number }, idx: number) => (
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
        </TabsContent>

        <TabsContent value="visitors" className="space-y-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground max-w-xl">
              Watch page sessions and traffic sources (anonymous analytics). For PII leads from the visitor gate, see{" "}
              <Link href="/admin/visitor-registrations" className="text-primary underline underline-offset-2">
                Visitor registrations
              </Link>
              .
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Window</span>
              {([7, 30, 90] as const).map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={visitorDays === d ? "default" : "outline"}
                  size="sm"
                  onClick={() => setVisitorDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isVisitorsLoading ? (
                  <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{visitorsData?.totalSessions ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">Watch page loads (window)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isVisitorsLoading ? (
                  <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{visitorsData?.uniqueVisitors ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">Distinct visitor_id (cookie)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returning visitors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isVisitorsLoading ? (
                  <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">{visitorsData?.returningVisitors ?? 0}</div>
                )}
                <p className="text-xs text-muted-foreground">Multiple sessions in window</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returning rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isVisitorsLoading ? (
                  <Skeleton className="h-8 w-24 mb-1" />
                ) : (
                  <div className="text-2xl font-bold">
                    {`${Math.round(((visitorsData?.returningRate ?? 0) as number) * 100)}%`}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Of unique visitors</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top traffic sources</CardTitle>
              </CardHeader>
              <CardContent>
                {isVisitorsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (visitorsData?.topSources ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No session data in this window yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {(visitorsData.topSources as { source: string; count: number }[]).map(
                      (row: { source: string; count: number }) => (
                        <li key={row.source} className="flex justify-between text-sm border-b border-border/60 pb-2 last:border-0">
                          <span className="font-medium">{row.source}</span>
                          <span className="text-muted-foreground">{row.count}</span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Funnel (counts)</CardTitle>
              </CardHeader>
              <CardContent>
                {isVisitorsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (visitorsData?.funnel ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No funnel events in this window yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {(visitorsData.funnel as { eventType: string; count: number }[]).map(
                      (row: { eventType: string; count: number }) => (
                        <li
                          key={row.eventType}
                          className="flex justify-between text-sm border-b border-border/60 pb-2 last:border-0"
                        >
                          <span className="font-mono text-xs">{row.eventType}</span>
                          <span className="text-muted-foreground">{row.count}</span>
                        </li>
                      ),
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2">
                <span>Revenue by first-touch source</span>
                {!isRevenueAttrLoading && revenueAttrData?.totalRevenueRupees != null && (
                  <span className="text-sm font-normal text-muted-foreground">
                    Total in window: ₹{Number(revenueAttrData.totalRevenueRupees).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({revenueAttrData.totalOrders ?? 0} orders)
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground font-normal">
                {(revenueAttrData?.description as string) ||
                  "Completed orders attributed to the earliest watch session UTM source per user."}
              </p>
            </CardHeader>
            <CardContent>
              {isRevenueAttrLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : !(revenueAttrData?.bySource as { source: string }[] | undefined)?.length ? (
                <p className="text-sm text-muted-foreground py-4">
                  No completed orders in this window, or no session link for buyers yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {(
                    revenueAttrData.bySource as {
                      source: string
                      orderCount: number
                      revenueRupees: number
                    }[]
                  ).map((row) => (
                    <li
                      key={row.source}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0"
                    >
                      <span className="font-medium">{row.source}</span>
                      <span className="text-muted-foreground">
                        ₹{Number(row.revenueRupees).toLocaleString(undefined, { maximumFractionDigits: 2 })} ·{" "}
                        {row.orderCount} order{row.orderCount === 1 ? "" : "s"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
