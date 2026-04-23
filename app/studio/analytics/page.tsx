"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Radio, Clock, Eye, Wallet } from "lucide-react"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Bar, BarChart, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StudioAnalyticsPage() {
  const { data: analyticsData, isLoading } = useSWR("/api/studio/analytics", fetcher)

  const stats = analyticsData?.stats
  const trend = analyticsData?.trend ?? []
  const types = analyticsData?.types ?? []
  const topEvents = analyticsData?.topEvents ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-balance">Analytics</h1>
        <p className="text-muted-foreground">Monitor your streaming performance and event activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">{stats?.completedEvents || 0} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <Radio className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{stats?.liveNow || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Currently streaming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">{(stats?.totalViewers || 0).toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">Across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mb-1" />
            ) : (
              <div className="text-2xl font-bold">₹{((stats?.walletBalance || 0) / 100).toLocaleString("en-IN")}</div>
            )}
            <p className="text-xs text-muted-foreground">Remaining credits</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Events Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : trend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="events"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.2}
                      name="Events"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stream Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : trend.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="streamHours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {types.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events by Stream Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={types} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Top Events by Peak Viewers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)
            ) : topEvents.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No events data available yet.</p>
            ) : (
              topEvents.map((event: any, idx: number) => (
                <div key={event.title} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">{event.streamType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-lg">{event.peakViewers.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Peak viewers</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <p className="font-medium text-sm">{event.duration}m</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
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
