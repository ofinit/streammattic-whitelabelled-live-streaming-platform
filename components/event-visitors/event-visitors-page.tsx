"use client"

import { useState, useEffect, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Download, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => {
  if (!r.ok) throw new Error("Failed to load")
  return r.json()
})

type AdminRow = {
  id: string
  createdAt?: string
  created_at?: string
  fullName?: string
  full_name?: string
  email?: string
  phone?: string
  ipAddress?: string
  ip_address?: string
  userAgent?: string
  user_agent?: string
  referer?: string
  utmSource?: string
  utm_source?: string
  utmMedium?: string
  utm_medium?: string
  utmCampaign?: string
  utm_campaign?: string
  eventTitle?: string
  eventSlug?: string
  ownerEmail?: string
  ownerName?: string
}

function formatRowTime(r: AdminRow): string {
  const raw = r.createdAt ?? r.created_at
  if (!raw) return "—"
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString()
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return `${s.slice(0, n)}…`
}

export function EventVisitorsPage({
  mode,
  basePath,
}: {
  mode: "admin" | "studio"
  /** e.g. /streamer or /studio — used for back link */
  basePath: string
}) {
  const searchParams = useSearchParams()
  const eventIdFromQuery = searchParams.get("eventId")?.trim() || ""

  const [eventFilter, setEventFilter] = useState(eventIdFromQuery)
  useEffect(() => {
    setEventFilter(eventIdFromQuery)
  }, [eventIdFromQuery])

  const adminListUrl = useMemo(() => {
    const q = new URLSearchParams()
    if (eventFilter) q.set("eventId", eventFilter)
    q.set("limit", "100")
    q.set("offset", "0")
    return `/api/admin/event-visitors?${q.toString()}`
  }, [eventFilter])

  const studioListUrl = useMemo(() => {
    if (!eventFilter) return null
    const q = new URLSearchParams()
    q.set("limit", "100")
    q.set("offset", "0")
    return `/api/studio/events/${encodeURIComponent(eventFilter)}/visitors?${q.toString()}`
  }, [eventFilter])

  const swrKey = mode === "admin" ? adminListUrl : studioListUrl
  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher)

  const rows: AdminRow[] = mode === "admin"
    ? (data?.registrations ?? [])
    : (data?.registrations ?? [])

  const total = typeof data?.total === "number" ? data.total : 0

  const downloadCsv = async () => {
    if (mode === "admin") {
      const q = new URLSearchParams()
      if (eventFilter) q.set("eventId", eventFilter)
      q.set("format", "csv")
      window.open(`/api/admin/event-visitors?${q.toString()}`, "_blank")
    } else if (eventFilter) {
      const q = new URLSearchParams()
      q.set("format", "csv")
      window.open(`/api/studio/events/${encodeURIComponent(eventFilter)}/visitors?${q.toString()}`, "_blank")
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link href={`${basePath}/control-center`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to control center
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Visitor registrations</h1>
          <p className="text-muted-foreground text-sm">
            {mode === "admin"
              ? "All captured leads from public watch pages."
              : "Leads captured before viewers access your event page."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void downloadCsv()}
          disabled={mode === "studio" && !eventFilter}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {mode === "admin" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Filter by event</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="ev-id">Event ID or slug</Label>
              <Input
                id="ev-id"
                placeholder="Optional — leave empty for all events"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value.trim())}
                className="max-w-md"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={() => void mutate()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "studio" && !eventFilter && (
        <Card>
          <CardContent className="flex flex-col gap-4 py-8 items-center text-center">
            <p className="text-muted-foreground text-sm max-w-md">
              Open this page from an event’s menu (Visitor registrations) or append{" "}
              <code className="text-xs bg-muted px-1 rounded">?eventId=YOUR_EVENT_ID</code> to the URL.
            </p>
            <Button variant="outline" asChild>
              <Link href={`${basePath}/control-center`}>Go to events</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "studio" && eventFilter && (
        <p className="text-sm text-muted-foreground">
          Event: <span className="font-mono text-foreground">{eventFilter}</span> · {total} total
        </p>
      )}

      {mode === "admin" && (
        <p className="text-sm text-muted-foreground">{total} total matching rows</p>
      )}

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          Loading…
        </div>
      )}
      {error && !isLoading && (
        <p className="text-destructive text-sm">Could not load registrations.</p>
      )}

      {!isLoading && !error && swrKey && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  {mode === "admin" && (
                    <>
                      <TableHead>Event</TableHead>
                      <TableHead>Owner</TableHead>
                    </>
                  )}
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>User agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={mode === "admin" ? 8 : 6} className="text-center text-muted-foreground py-8">
                      No registrations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">{formatRowTime(r)}</TableCell>
                      {mode === "admin" && (
                        <>
                          <TableCell className="max-w-[140px] text-xs">
                            {r.eventTitle ?? r.eventSlug ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-[160px] text-xs">
                            {(r.ownerEmail as string) || (r.ownerName as string) || "—"}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-xs">{r.fullName ?? r.full_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.email ?? "—"}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{r.phone ?? "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{r.ipAddress ?? r.ip_address ?? "—"}</TableCell>
                      <TableCell className="text-xs max-w-[240px]" title={String(r.userAgent ?? r.user_agent ?? "")}>
                        {truncate(String(r.userAgent ?? r.user_agent ?? "") || "—", 80)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
