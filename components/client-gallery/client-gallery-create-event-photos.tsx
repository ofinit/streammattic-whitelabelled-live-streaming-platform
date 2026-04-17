"use client"

import Link from "next/link"
import { ArrowRight, CalendarPlus, ImagePlus, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

/** Opens Control Center with create dialog; `tab=details` is where Event media & Photo gallery live. */
function createEventFromGalleryHref(role: "streamer" | "studio") {
  const base = role === "studio" ? "/studio/control-center" : "/streamer/control-center"
  return `${base}?openModal=1&tab=details`
}

export function ClientGalleryCreateEventPhotos() {
  const { user } = useAuth()
  const role = user?.role === "studio" ? "studio" : "streamer"
  const createWithDetailsTab = createEventFromGalleryHref(role)

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create event photos</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Gallery photos are tied to each live event. Create or open an event, then add images under{" "}
          <strong>Event media &amp; info</strong> — the <strong>Photo gallery</strong> section appears on the
          event&apos;s public watch page.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="text-sm font-bold">1</span>
            </div>
            <CardTitle className="text-lg">Create event</CardTitle>
            <CardDescription>
              Start a new event from Control Center. The editor opens on the <strong>Details</strong> tab where
              hero, header, and gallery images live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full gap-2 sm:w-auto">
              <Link href={createWithDetailsTab}>
                <CalendarPlus className="h-4 w-4" />
                Create new event
                <ArrowRight className="h-4 w-4 opacity-80" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="text-sm font-bold">2</span>
            </div>
            <CardTitle className="text-lg">Add photo gallery</CardTitle>
            <CardDescription>
              In <strong>Event media &amp; info</strong>, use <strong>Photo gallery</strong> to upload images
              (free uploads). They show on the watch page for guests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <ImagePlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Multiple images supported; drag-and-drop or browse.
              </li>
              <li className="flex gap-2">
                <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Manage existing events and photo counts under My Events Photos.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href={`${CLIENT_GALLERY_BASE}/my-events-photos`}>My Events Photos</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href={CLIENT_GALLERY_BASE}>Back to gallery dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
