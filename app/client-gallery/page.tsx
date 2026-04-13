"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowRight, Images, Loader2 } from "lucide-react"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"

type GalleryEventRow = {
  id: string
  title: string
  slug?: string
  status?: string
  thumbnail?: string
  photoGalleryUrls?: unknown
}

function galleryUrlCount(raw: unknown): number {
  if (!Array.isArray(raw)) return 0
  return raw.filter((u) => typeof u === "string" && u.trim().length > 0).length
}

function eventWatchHref(e: GalleryEventRow): string {
  if (e.slug && String(e.slug).trim().length > 0) return `/${encodeURIComponent(e.slug.trim())}`
  return `/watch/${encodeURIComponent(e.id)}`
}

/**
 * Same-origin client gallery: lists events that already have photo gallery images (from event setup).
 * Full BYOS S3 + uploads + face search are planned; guests see a short explainer.
 */
export default function ClientGalleryPage() {
  const { branding } = useBranding()
  const { user, isLoading: authLoading } = useAuth()
  const [events, setEvents] = useState<GalleryEventRow[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)

  const isHost = user?.role === "streamer" || user?.role === "studio"
  const dashboardHref = user?.role === "studio" ? "/studio" : "/streamer"

  const loadEvents = useCallback(async () => {
    if (!isHost) return
    setEventsLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/client-gallery/events?limit=200", { credentials: "include" })
      const data = (await res.json().catch(() => ({}))) as { events?: GalleryEventRow[]; error?: string }
      if (!res.ok) {
        setLoadError(data.error || "Could not load your events.")
        setEvents([])
        return
      }
      const list = Array.isArray(data.events) ? data.events : []
      const withGallery = list.filter((ev) => galleryUrlCount(ev?.photoGalleryUrls) > 0)
      setEvents(withGallery)
    } catch {
      setLoadError("Could not load your events.")
      setEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [isHost])

  useEffect(() => {
    if (authLoading) return
    if (isHost) void loadEvents()
    else setEvents(null)
  }, [authLoading, isHost, loadEvents])

  const sortedEvents = useMemo(() => {
    if (!events?.length) return []
    return [...events]
  }, [events])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandedLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/site/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 text-center md:text-left">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary md:mb-0 md:mr-4 md:inline-flex md:align-middle">
            <Images className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:inline md:text-3xl">Client photo gallery</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Event photos you add in the event editor appear on each event&apos;s public page. This hub lists those events so
            you can open the live gallery quickly. Dedicated client uploads and face-assisted search from your own S3
            (BYOS) will layer on here in a later release.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You are on <span className="font-mono text-foreground">{branding.brandName}</span> — same path on every domain.
          </p>
        </div>

        {authLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : !user ? (
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">Sign in to see your galleries</CardTitle>
              <CardDescription>
                After you sign in as a streamer or studio, this page lists events that include photo gallery images. Guests
                can still open each event&apos;s public link to view those photos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/site/login">Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        ) : user.role === "admin" ? (
          <p className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Sign in as a streamer or studio account to see event galleries here. Platform admins manage the add-on under{" "}
            <Link href="/admin/packages" className="text-primary underline-offset-4 hover:underline">
              Admin → Packages
            </Link>
            .
          </p>
        ) : eventsLoading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Loading your events…</p>
          </div>
        ) : loadError ? (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-lg text-destructive">Something went wrong</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" onClick={() => void loadEvents()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : sortedEvents.length === 0 ? (
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">No event galleries yet</CardTitle>
              <CardDescription>
                Add images under <strong className="text-foreground">Photo gallery</strong> when editing an event. They will
                show on the event watch page and appear here automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={user.role === "studio" ? "/studio/control-center" : "/streamer/control-center"}>
                  Open control center
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={user.role === "studio" ? "/studio/create-events" : "/streamer/create-events"}>
                  Create event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedEvents.map((ev) => {
              const urls = Array.isArray(ev.photoGalleryUrls) ? ev.photoGalleryUrls.filter((u) => typeof u === "string") : []
              const first = urls[0] as string | undefined
              const n = urls.length
              const href = eventWatchHref(ev)
              return (
                <Card key={ev.id} className="overflow-hidden border-border/80">
                  <div className="aspect-video w-full bg-muted">
                    {first ? (
                      <img src={first} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Images className="h-10 w-10 opacity-40" aria-hidden />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="line-clamp-2 text-base leading-snug">{ev.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      {ev.status ? (
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs capitalize text-secondary-foreground">
                          {ev.status}
                        </span>
                      ) : null}
                      <span>
                        {n} photo{n !== 1 ? "s" : ""} in gallery
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button variant="secondary" size="sm" className="w-full" asChild>
                      <Link href={href}>
                        View gallery on event page
                        <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-70" aria-hidden />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
