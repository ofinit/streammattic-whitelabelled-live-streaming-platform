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
import { ArrowLeft, Download, Loader2, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => {
  if (!r.ok) throw new Error("Failed to load")
  return r.json()
})

type AdminRow = {
  id: string
  createdAt?: string
  created_at?: string
  timeIst?: string
  time_ist?: string
  fullName?: string
  full_name?: string
  email?: string
  phone?: string
  ipAddress?: string
  ip_address?: string
  ipCountry?: string
  ip_country?: string
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

function formatRowTimeIst(r: AdminRow): string {
  const ist = r.timeIst ?? r.time_ist
  if (ist) return String(ist)
  const raw = r.createdAt ?? r.created_at
  if (!raw) return "—"
  const d = new Date(String(raw))
  return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
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
  /** Studio page is scoped by ?eventId= from the control-center link; admin lists all events (no event filter). */
  const studioEventId = mode === "studio" ? (searchParams.get("eventId")?.trim() || "") : ""

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const adminListUrl = useMemo(() => {
    const q = new URLSearchParams()
    if (debouncedSearch) q.set("q", debouncedSearch)
    q.set("limit", "100")
    q.set("offset", "0")
    return `/api/admin/event-visitors?${q.toString()}`
  }, [debouncedSearch])

  const studioListUrl = useMemo(() => {
    if (!studioEventId) return null
    const q = new URLSearchParams()
    if (debouncedSearch) q.set("q", debouncedSearch)
    q.set("limit", "100")
    q.set("offset", "0")
    return `/api/studio/events/${encodeURIComponent(studioEventId)}/visitors?${q.toString()}`
  }, [studioEventId, debouncedSearch])

  const swrKey = mode === "admin" ? adminListUrl : studioListUrl
  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher)

  const rows: AdminRow[] = mode === "admin"
    ? (data?.registrations ?? [])
    : (data?.registrations ?? [])

  const total = typeof data?.total === "number" ? data.total : 0

  const downloadCsv = async () => {
    if (mode === "admin") {
      const q = new URLSearchParams()
      if (debouncedSearch) q.set("q", debouncedSearch)
      q.set("format", "csv")
      window.open(`/api/admin/event-visitors?${q.toString()}`, "_blank")
    } else if (studioEventId) {
      const q = new URLSearchParams()
      if (debouncedSearch) q.set("q", debouncedSearch)
      q.set("format", "csv")
      window.open(`/api/studio/events/${encodeURIComponent(studioEventId)}/visitors?${q.toString()}`, "_blank")
    }
  }

  return (
    <div className="space-y-6 w-full max-w-none px-4 md:px-6 py-4 md:py-6">
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
          disabled={mode === "studio" && !studioEventId}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {mode === "admin" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Search</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="space-y-2 w-full flex-1">
              <Label htmlFor="visitor-search">Search</Label>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="visitor-search"
                  placeholder="Search name, email, phone, event, streamer, IP, country, time (IST), UTM…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </div>
            <Button variant="secondary" size="sm" className="shrink-0" onClick={() => void mutate()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "studio" && studioEventId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="studio-visitor-search"
                placeholder="Search all registration fields…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {mode === "studio" && !studioEventId && (
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

      {mode === "studio" && studioEventId && (
        <p className="text-sm text-muted-foreground">
          Event: <span className="font-mono text-foreground">{studioEventId}</span> · {total} total
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
                  <TableHead>Time (IST)</TableHead>
                  {mode === "admin" && (
                    <>
                      <TableHead>Event</TableHead>
                      <TableHead>Streamer/Studio</TableHead>
                    </>
                  )}
                  <TableHead>Visitor name</TableHead>
                  <TableHead>Visitor email</TableHead>
                  <TableHead>Visitor phone</TableHead>
                  <TableHead>Visitor country</TableHead>
                  <TableHead>Visitor IP</TableHead>
                  <TableHead>Visitor user agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={mode === "admin" ? 9 : 7} className="text-center text-muted-foreground py-8">
                      No registrations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">{formatRowTimeIst(r)}</TableCell>
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
                      <TableCell className="text-xs max-w-[120px]">
                        {r.ipCountry ?? r.ip_country ?? "—"}
                      </TableCell>
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
