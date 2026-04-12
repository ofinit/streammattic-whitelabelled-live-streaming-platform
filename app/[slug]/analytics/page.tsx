"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BarChart3, Copy, Check, Loader2 } from "lucide-react"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json()
  })

function formatPaise(p: number) {
  return `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function EventAnalyticsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { user, isLoading: authLoading } = useAuth()
  const [days, setDays] = useState<7 | 30 | 90>(30)
  const [copied, setCopied] = useState(false)

  const apiUrl = user
    ? `/api/events/${encodeURIComponent(slug)}/analytics?days=${days}`
    : null

  const { data, error, isLoading } = useSWR(apiUrl, fetcher)

  const analyticsUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/${encodeURIComponent(slug)}/analytics`
  }, [slug])

  const copyLink = () => {
    if (!analyticsUrl) return
    void navigator.clipboard.writeText(analyticsUrl)
    setCopied(true)
    toast.success("Analytics link copied")
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-muted-foreground">Sign in to view event analytics.</p>
        <Button asChild>
          <Link href={`/login?redirect=/${encodeURIComponent(slug)}/analytics`}>Sign in</Link>
        </Button>
      </div>
    )
  }

  if (!["streamer", "studio", "admin"].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <p className="text-destructive">You do not have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <BrandedLogo size="sm" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm font-medium">Event analytics</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {data?.event?.title ?? (isLoading ? "Loading…" : "Event")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Traffic, leads, funnel, and orders for this event (rolling window).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(days)}
              onValueChange={(v) => setDays(Number(v) as 7 | 30 | 90)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              Copy page link
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading analytics…
          </div>
        )}

        {error && !isLoading && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Could not load analytics</CardTitle>
              <CardDescription>
                {String(error).includes("403")
                  ? "You do not have permission to view this event."
                  : String(error).includes("404")
                    ? "Event not found."
                    : "Try again later."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href={`${basePath}/control-center`}>Back to events</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {data?.success && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Status</CardDescription>
                  <CardTitle className="text-lg capitalize">{data.event.status}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Stream: {String(data.event.streamType).replace(/_/g, " ")}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Unique visitors</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">
                    {data.sessions.uniqueVisitors}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {data.sessions.totalSessions} sessions · {data.sessions.returningVisitors}{" "}
                  returning
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Views (event)</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{data.event.totalViews}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Live now: {data.event.currentViewers} · Peak cap: {data.event.maxViewers}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Leads (gate)</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{data.leads.allTime}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {data.leads.inWindow} in selected window
                </CardContent>
              </Card>
            </div>

            {data.sessions.avgDurationSeconds != null && (
              <p className="text-sm text-muted-foreground">
                Avg. session time on watch page:{" "}
                <span className="text-foreground font-medium">
                  {Math.floor(data.sessions.avgDurationSeconds / 60)}m{" "}
                  {data.sessions.avgDurationSeconds % 60}s
                </span>
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Traffic sources (UTM)</CardTitle>
                  <CardDescription>utm_source</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.acquisition.topSources.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground text-center">
                            No data in this window
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.acquisition.topSources.map(
                          (r: { source: string; count: number }) => (
                            <TableRow key={r.source}>
                              <TableCell className="font-mono text-xs">{r.source}</TableCell>
                              <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                            </TableRow>
                          ),
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Countries</CardTitle>
                  <CardDescription>From visitor sessions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.acquisition.topCountries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground text-center">
                            No data
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.acquisition.topCountries.map(
                          (r: { country: string; count: number }) => (
                            <TableRow key={r.country}>
                              <TableCell>{r.country}</TableCell>
                              <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                            </TableRow>
                          ),
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Referrers</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referrer</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.acquisition.topReferrers.map((r: { referer: string; count: number }) => (
                      <TableRow key={r.referer.slice(0, 120)}>
                        <TableCell className="max-w-md truncate text-xs font-mono" title={r.referer}>
                          {r.referer}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Funnel events</CardTitle>
                  <CardDescription>Rows with related_event_id set</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.funnel.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-muted-foreground text-center">
                            None in window
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.funnel.map((r: { eventType: string; count: number }) => (
                          <TableRow key={r.eventType}>
                            <TableCell className="font-mono text-xs">{r.eventType}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Orders (window)</CardTitle>
                  <CardDescription>Linked to this event</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.orders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-muted-foreground text-center">
                            No orders in window
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.orders.map(
                          (r: { status: string; count: number; totalPaise: number }) => (
                            <TableRow key={r.status}>
                              <TableCell className="capitalize">{r.status}</TableCell>
                              <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatPaise(r.totalPaise)}
                              </TableCell>
                            </TableRow>
                          ),
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
