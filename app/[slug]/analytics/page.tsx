"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  ArrowLeft,
  Activity,
  BarChart3,
  Calendar,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Globe,
  Loader2,
  Monitor,
  Users,
} from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => {
    if (!r.ok) throw new Error(String(r.status))
    return r.json()
  })

function formatPaise(p: number) {
  return `₹${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Traffic metrics: higher delta % is better. Bounce: lower is better. */
function DeltaBadge({
  pct,
  lowerIsBetter,
}: {
  pct: number | null | undefined
  lowerIsBetter?: boolean
}) {
  if (pct === null || pct === undefined) {
    return <span className="text-xs font-medium text-muted-foreground">New</span>
  }
  const effective = lowerIsBetter ? -pct : pct
  const good = effective > 0
  const bad = effective < 0
  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        good && "text-emerald-600 dark:text-emerald-400",
        bad && "text-red-600 dark:text-red-400",
        !good && !bad && "text-muted-foreground",
      )}
    >
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  )
}

function PctBar({ pct }: { pct: number }) {
  const w = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-2 w-full max-w-[120px] overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${w}%` }} />
    </div>
  )
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

  const watchUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/${encodeURIComponent(slug)}`
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-muted-foreground">Sign in to view event analytics.</p>
        <Button asChild>
          <Link href={`/login?redirect=/${encodeURIComponent(slug)}/analytics`}>Sign in</Link>
        </Button>
      </div>
    )
  }

  if (!["streamer", "studio", "admin"].includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <p className="text-destructive">You do not have access to this page.</p>
      </div>
    )
  }

  const cmp = data?.comparison
  const chartData =
    data?.series?.map((r: { day: string; sessions: number; uniqueVisitors: number }) => ({
      label: r.day.slice(5),
      sessions: r.sessions,
      visitors: r.uniqueVisitors,
    })) ?? []

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
            <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
              <Link href={`/${encodeURIComponent(slug)}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to event
              </Link>
            </Button>
            {watchUrl ? (
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden min-w-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                <span className="truncate font-mono text-xs">{watchUrl.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : null}
            {data?.event ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {data.event.currentViewers} online
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={String(days)}
              onValueChange={(v) => setDays(Number(v) as 7 | 30 | 90)}
            >
              <SelectTrigger className="w-[150px] bg-background">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" onClick={copyLink} className="bg-background">
              {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              Copy page link
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <div className="mb-1 flex items-center gap-2 text-primary">
            <BarChart3 className="h-5 w-5" />
            <span className="text-sm font-medium">Event analytics</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {data?.event?.title ?? (isLoading ? "Loading…" : "Event")}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Watch traffic and sessions for this event (rolling window). Not full-site product analytics — labels
            refer to the public watch experience.
          </p>
          {data?.bounceDefinition ? (
            <p className="mt-2 text-xs text-muted-foreground">{data.bounceDefinition}</p>
          ) : null}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            Loading analytics…
          </div>
        )}

        {error && !isLoading && (
          <Card className="border-destructive/50 bg-background">
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
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/${encodeURIComponent(slug)}`}>Back to event</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {data?.success && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unique visitors</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums">{data.sessions.uniqueVisitors}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <DeltaBadge pct={cmp?.uniqueVisitors?.deltaPct} />
                    <span className="text-xs text-muted-foreground">vs prior {days}d</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums">{data.sessions.totalSessions}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Watch sessions in window</p>
                  <div className="mt-1 flex items-center gap-2">
                    <DeltaBadge pct={cmp?.sessions?.deltaPct} />
                    <span className="text-xs text-muted-foreground">vs prior {days}d</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bounce rate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums">
                    {(data.sessions.bounceRate * 100).toFixed(0)}%
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <DeltaBadge pct={cmp?.bounceRate?.deltaPct} lowerIsBetter />
                    <span className="text-xs text-muted-foreground">vs prior {days}d</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platform views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tabular-nums">{data.event.totalViews}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Live {data.event.currentViewers} · Peak {data.event.maxViewers}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 bg-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Visitors</CardTitle>
                <CardDescription>Daily unique visitors and sessions (UTC days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  {chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No session data in this window
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                          }}
                          labelFormatter={(l) => `Day ${l}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="visitors"
                          name="Unique visitors"
                          stroke="hsl(var(--primary))"
                          fill="url(#fillVisitors)"
                          strokeWidth={2}
                        />
                        <Area
                          type="monotone"
                          dataKey="sessions"
                          name="Sessions"
                          stroke="hsl(var(--muted-foreground))"
                          fillOpacity={0}
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 bg-background shadow-sm">
                <Tabs defaultValue="referrers" className="w-full">
                  <CardHeader className="space-y-3 pb-0">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-base">Acquisition</CardTitle>
                      <TabsList className="h-9 w-full sm:w-auto">
                        <TabsTrigger value="referrers" className="text-xs">
                          Referrers
                        </TabsTrigger>
                        <TabsTrigger value="utm" className="text-xs">
                          UTM
                        </TabsTrigger>
                        <TabsTrigger value="landing" className="text-xs">
                          Landing URLs
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <TabsContent value="referrers" className="m-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Referrer</TableHead>
                            <TableHead className="text-right">Sessions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.acquisition.topReferrers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                No data
                              </TableCell>
                            </TableRow>
                          ) : (
                            data.acquisition.topReferrers.map((r: { referer: string; count: number }) => (
                              <TableRow key={r.referer.slice(0, 80)}>
                                <TableCell className="max-w-[240px] truncate font-mono text-xs" title={r.referer}>
                                  {r.referer}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                    <TabsContent value="utm" className="m-0 space-y-4">
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">utm_source</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Source</TableHead>
                              <TableHead className="text-right">Sessions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.acquisition.topSources.map((r: { source: string; count: number }) => (
                              <TableRow key={r.source}>
                                <TableCell className="font-mono text-xs">{r.source}</TableCell>
                                <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">utm_medium</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Medium</TableHead>
                              <TableHead className="text-right">Sessions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.acquisition.topMediums.map((r: { medium: string; count: number }) => (
                              <TableRow key={r.medium}>
                                <TableCell className="font-mono text-xs">{r.medium}</TableCell>
                                <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TabsContent>
                    <TabsContent value="landing" className="m-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Landing URL</TableHead>
                            <TableHead className="text-right">Sessions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(data.acquisition.landingPages ?? []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center text-muted-foreground">
                                No data
                              </TableCell>
                            </TableRow>
                          ) : (
                            (data.acquisition.landingPages as { url: string; urlFull: string; count: number }[]).map(
                              (r) => (
                                <TableRow key={r.urlFull.slice(0, 120)}>
                                  <TableCell className="max-w-md truncate font-mono text-xs" title={r.urlFull}>
                                    {r.url}
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                                </TableRow>
                              ),
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>

              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Countries
                  </CardTitle>
                  <CardDescription>Share of sessions by country</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead className="text-right">%</TableHead>
                        <TableHead className="w-[140px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.acquisition.topCountries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No data
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.acquisition.topCountries.map(
                          (r: {
                            country: string
                            flagEmoji: string
                            count: number
                            pct: number
                          }) => (
                            <TableRow key={r.country}>
                              <TableCell>
                                <span className="mr-2 tabular-nums">{r.flagEmoji}</span>
                                <span className="uppercase">{r.country}</span>
                                <span className="ml-2 text-muted-foreground text-xs">({r.count})</span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{r.pct}%</TableCell>
                              <TableCell>
                                <PctBar pct={r.pct} />
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

            <div className="grid gap-6 md:grid-cols-3">
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.acquisition.tech?.devices ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data</p>
                  ) : (
                    data.acquisition.tech.devices.map((r: { name: string; count: number; pct: number }) => (
                      <div key={r.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{r.name}</span>
                          <span className="tabular-nums text-muted-foreground">{r.pct}%</span>
                        </div>
                        <PctBar pct={r.pct} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Browsers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.acquisition.tech?.browsers ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data</p>
                  ) : (
                    data.acquisition.tech.browsers.map((r: { name: string; count: number; pct: number }) => (
                      <div key={r.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{r.name}</span>
                          <span className="tabular-nums text-muted-foreground">{r.pct}%</span>
                        </div>
                        <PctBar pct={r.pct} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Operating systems</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.acquisition.tech?.oses ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No data</p>
                  ) : (
                    data.acquisition.tech.oses.map((r: { name: string; count: number; pct: number }) => (
                      <div key={r.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="truncate">{r.name}</span>
                          <span className="tabular-nums text-muted-foreground">{r.pct}%</span>
                        </div>
                        <PctBar pct={r.pct} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {data.sessions.avgDurationSeconds != null && (
              <p className="text-sm text-muted-foreground">
                Avg. time on watch page:{" "}
                <span className="font-medium text-foreground">
                  {Math.floor(data.sessions.avgDurationSeconds / 60)}m {data.sessions.avgDurationSeconds % 60}s
                </span>
              </p>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-border/60 bg-background shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Funnel events</CardTitle>
                  <CardDescription>Steps with related_event_id in window</CardDescription>
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
                          <TableCell colSpan={2} className="text-center text-muted-foreground">
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

              <Card className="border-border/60 bg-background shadow-sm">
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
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            No orders in window
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.orders.map((r: { status: string; count: number; totalPaise: number }) => (
                          <TableRow key={r.status}>
                            <TableCell className="capitalize">{r.status}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.count}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatPaise(r.totalPaise)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 bg-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Leads</CardTitle>
                <CardDescription>Visitor registrations (gate)</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-8 text-sm">
                <div>
                  <span className="text-muted-foreground">In window: </span>
                  <span className="text-2xl font-bold tabular-nums">{data.leads.inWindow}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">All time: </span>
                  <span className="text-2xl font-bold tabular-nums">{data.leads.allTime}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
