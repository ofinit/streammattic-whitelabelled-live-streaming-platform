"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BarChart3, CalendarClock, Mail, MessageSquare, Phone, Radio, RefreshCw, ShoppingCart, Users, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type EngagementReport = {
  days: number
  overview: {
    totalActions: number
    sent: number
    failed: number
    logged: number
    contactedUsers: number
    reloginsAfterContact: number
    usersWithEventsAfterContact: number
    usersWithWalletActivityAfterContact: number
    usersWithOrdersAfterContact: number
  }
  channels: {
    email: number
    whatsapp: number
    call: number
    note: number
  }
  segments: Array<{ segment: string; label: string; count: number }>
  recentActivity: EngagementLogRow[]
  upcomingFollowUps: EngagementLogRow[]
}

type EngagementLogRow = {
  id: string
  user_id: string
  campaign_type: string
  channel: string
  status?: string
  note?: string | null
  follow_up_at?: string | null
  created_at: string
  name: string
  email: string
  role: "studio" | "streamer"
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function humanize(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function rate(numerator: number, denominator: number): string {
  if (!denominator) return "0%"
  return `${Math.round((numerator / denominator) * 100)}%`
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  loading,
}: {
  title: string
  value: string | number
  helper: string
  icon: typeof Users
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="mb-1 h-8 w-24" /> : <div className="text-2xl font-bold">{value}</div>}
        <p className="text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const variantClass =
    status === "failed"
      ? "border-red-500/30 bg-red-500/10 text-red-400"
      : status === "sent"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
        : "border-sky-500/30 bg-sky-500/10 text-sky-400"
  return (
    <Badge variant="outline" className={variantClass}>
      {status ? humanize(status) : "Logged"}
    </Badge>
  )
}

function EngagementLogTable({ rows, emptyLabel, showFollowUp }: { rows: EngagementLogRow[]; emptyLabel: string; showFollowUp?: boolean }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Campaign</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>{showFollowUp ? "Follow-up" : "Activity"}</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const href = row.role === "studio" ? "/admin/studios" : "/admin/streamers"
          return (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={href} className="font-medium text-foreground hover:underline">
                  {row.name}
                </Link>
                <p className="text-xs text-muted-foreground">{row.email}</p>
              </TableCell>
              <TableCell>{humanize(row.campaign_type)}</TableCell>
              <TableCell>{humanize(row.channel)}</TableCell>
              <TableCell>{formatDateTime(showFollowUp ? row.follow_up_at : row.created_at)}</TableCell>
              <TableCell>
                <StatusBadge status={row.status} />
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-muted-foreground" title={row.note || ""}>
                {row.note || "—"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default function AdminEngagementPage() {
  const [days, setDays] = useState("30")
  const { data, isLoading, mutate } = useSWR<{ success: boolean } & EngagementReport>(
    `/api/admin/engagement/reports?days=${days}`,
    fetcher,
  )

  const report = data?.success ? data : null
  const overview = report?.overview
  const conversions = useMemo(
    () => [
      {
        label: "Re-login after outreach",
        value: overview?.reloginsAfterContact ?? 0,
        helper: rate(overview?.reloginsAfterContact ?? 0, overview?.contactedUsers ?? 0),
        icon: Users,
      },
      {
        label: "Created event after outreach",
        value: overview?.usersWithEventsAfterContact ?? 0,
        helper: rate(overview?.usersWithEventsAfterContact ?? 0, overview?.contactedUsers ?? 0),
        icon: Radio,
      },
      {
        label: "Wallet activity after outreach",
        value: overview?.usersWithWalletActivityAfterContact ?? 0,
        helper: rate(overview?.usersWithWalletActivityAfterContact ?? 0, overview?.contactedUsers ?? 0),
        icon: Wallet,
      },
      {
        label: "Order after outreach",
        value: overview?.usersWithOrdersAfterContact ?? 0,
        helper: rate(overview?.usersWithOrdersAfterContact ?? 0, overview?.contactedUsers ?? 0),
        icon: ShoppingCart,
      },
    ],
    [overview],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Engagement Reports</h1>
          <p className="text-muted-foreground">Monitor inactive-user outreach, follow-ups, and conversions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={() => void mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Outreach Actions"
          value={overview?.totalActions ?? 0}
          helper={`${overview?.sent ?? 0} sent · ${overview?.logged ?? 0} logged · ${overview?.failed ?? 0} failed`}
          icon={Mail}
          loading={isLoading}
        />
        <MetricCard
          title="Contacted Users"
          value={overview?.contactedUsers ?? 0}
          helper={`Unique users contacted in ${days} days`}
          icon={Users}
          loading={isLoading}
        />
        <MetricCard
          title="Due Follow-ups"
          value={report?.upcomingFollowUps?.length ?? 0}
          helper="Due now or within 7 days"
          icon={CalendarClock}
          loading={isLoading}
        />
        <MetricCard
          title="Email Send Rate"
          value={rate(overview?.sent ?? 0, (overview?.sent ?? 0) + (overview?.failed ?? 0))}
          helper="Successful email sends"
          icon={BarChart3}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {conversions.map((item) => (
          <MetricCard
            key={item.label}
            title={item.label}
            value={item.value}
            helper={`${item.helper} of contacted users`}
            icon={item.icon}
            loading={isLoading}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Segments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : (
              (report?.segments ?? []).map((segment) => (
                <div key={segment.segment} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm text-foreground">{segment.label}</span>
                  <Badge variant="secondary">{segment.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)
            ) : (
              [
                { label: "Email", value: report?.channels.email ?? 0, icon: Mail },
                { label: "WhatsApp", value: report?.channels.whatsapp ?? 0, icon: MessageSquare },
                { label: "Call", value: report?.channels.call ?? 0, icon: Phone },
                { label: "Note", value: report?.channels.note ?? 0, icon: CalendarClock },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="inline-flex items-center gap-2 text-sm text-foreground">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </span>
                    <Badge variant="secondary">{item.value}</Badge>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/studios">Open studio engagement filters</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/streamers">Open streamer engagement filters</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/settings/email-templates">Review email templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Follow-ups Due</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <EngagementLogTable
              rows={report?.upcomingFollowUps ?? []}
              emptyLabel="No follow-ups due in the next 7 days."
              showFollowUp
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Engagement Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <EngagementLogTable rows={report?.recentActivity ?? []} emptyLabel="No engagement activity in this period." />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

