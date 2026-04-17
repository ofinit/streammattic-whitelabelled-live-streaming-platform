"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  Calendar,
  ExternalLink,
  ImageIcon,
  Loader2,
  Search,
  Settings2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import type { EventStatus } from "@/lib/types"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

type TabKey = "all" | EventStatus

const STATUS_TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "scheduled", label: "Scheduled" },
  { key: "live", label: "Live" },
  { key: "ended", label: "Ended" },
  { key: "cancelled", label: "Cancelled" },
]

function buildEventsUrl(userId: string, search: string, tab: TabKey) {
  const params = new URLSearchParams({
    studioId: userId,
    limit: "50",
    offset: "0",
  })
  const q = search.trim()
  if (q) params.set("search", q)
  if (tab !== "all") params.set("status", tab)
  return `/api/studio/events?${params.toString()}`
}

function photoCount(ev: Record<string, unknown>): number {
  const urls = ev.photoGalleryUrls
  if (Array.isArray(urls)) return urls.length
  return 0
}

export function ClientGalleryMyEventsPhotos() {
  const { user } = useAuth()
  const ownerId = user?.id ?? ""
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<TabKey>("all")

  const swrKey = ownerId ? buildEventsUrl(ownerId, search, tab) : null
  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, { revalidateOnFocus: true })

  const events = useMemo(() => (Array.isArray(data?.events) ? data.events : []) as Record<string, unknown>[], [data])

  const controlBase = user?.role === "studio" ? "/studio/control-center" : "/streamer/control-center"
  const createEventsHref = user?.role === "studio" ? "/studio/create-events" : "/streamer/create-events"

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    void mutate()
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">My Events Photos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Events you own with gallery images from the event editor. Manage uploads in each event&apos;s media section.
        </p>
      </div>

      <form onSubmit={onSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by event name"
            className="bg-secondary/50 pl-9"
            aria-label="Search events"
          />
        </div>
        <Button type="submit" variant="secondary" className="shrink-0">
          Search
        </Button>
        <Button type="button" variant="outline" className="shrink-0" asChild>
          <Link href={createEventsHref}>
            <Calendar className="mr-2 h-4 w-4" />
            Create event
          </Link>
        </Button>
      </form>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="w-full">
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-muted/40 p-1">
          {STATUS_TABS.map(({ key, label }) => (
            <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading events…
        </div>
      )}

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6 text-sm text-destructive">Could not load events. Try again.</CardContent>
        </Card>
      )}

      {!isLoading && !error && events.length === 0 && (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground" aria-hidden />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">No events yet</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create an event, then add photos under <strong>Event media &amp; info</strong> in the event editor. They will
                appear on the public watch page and here.
              </p>
            </div>
            <Button asChild>
              <Link href={createEventsHref}>Create new event</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && events.length > 0 && (
        <ul className="space-y-3">
          {events.map((ev) => {
            const id = String(ev.id ?? "")
            const title = String(ev.title ?? "Untitled event")
            const status = String(ev.status ?? "draft")
            const thumb =
              (ev.thumbnailUrl as string | undefined) ||
              (ev.thumbnail as string | undefined) ||
              (ev.heroImageUrl as string | undefined) ||
              ""
            const count = photoCount(ev)
            const watchHref = `/watch/${id}`
            const manageHref = `${controlBase}?event=${encodeURIComponent(id)}`

            return (
              <li key={id}>
                <Card className="overflow-hidden border-border transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:h-16 sm:w-24">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-medium text-foreground">{title}</h2>
                        <Badge variant="secondary" className="capitalize">
                          {status.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {count === 0 ? "No gallery photos yet" : `${count} gallery photo${count === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={watchHref} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-4 w-4" />
                          Watch page
                        </Link>
                      </Button>
                      <Button variant="default" size="sm" asChild>
                        <Link href={manageHref}>
                          <Settings2 className="mr-1 h-4 w-4" />
                          Manage event
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
