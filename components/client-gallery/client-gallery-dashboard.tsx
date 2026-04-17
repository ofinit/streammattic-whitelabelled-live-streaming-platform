"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import useSWR from "swr"
import {
  BarChart3,
  Download,
  Eye,
  HelpCircle,
  Images,
  LayoutGrid,
  Sparkles,
  UserPlus,
} from "lucide-react"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { AuthUser } from "@/lib/auth-context"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

type PgStatus = {
  catalog?: { productName?: string; listingEnabled?: boolean }
  entitled?: boolean
  eligible?: boolean
}

function StatCard({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn("border-border bg-card shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )
}

export function ClientGalleryDashboard({
  user,
  brandName,
  dashboardHref,
  packagesHref,
}: {
  user: AuthUser
  brandName: string
  dashboardHref: string
  packagesHref: string
}) {
  const { data: pg } = useSWR<PgStatus>(
    user.role === "streamer" || user.role === "studio" ? "/api/photo-gallery-addon/status" : null,
    fetcher,
    { revalidateOnFocus: true },
  )

  const entitled = pg?.entitled === true
  const { data: albumsRes } = useSWR<{ albums?: { assetCount?: number }[] }>(
    entitled && (user.role === "streamer" || user.role === "studio") ? "/api/client-gallery/albums" : null,
    fetcher,
    { revalidateOnFocus: true },
  )

  const firstName = user.name?.trim().split(/\s+/)[0] ?? ""
  const productLabel = pg?.catalog?.productName?.trim() || "Client photo gallery"
  type AlbumLite = { id: string; title?: string; assetCount?: number }
  const albums: AlbumLite[] = Array.isArray(albumsRes?.albums) ? (albumsRes.albums as AlbumLite[]) : []
  const totalPhotos = albums.reduce((sum, a) => sum + (typeof a.assetCount === "number" ? a.assetCount : 0), 0)

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-900/90 via-indigo-950 to-background px-6 py-8 text-white shadow-lg sm:px-8"
        aria-labelledby="client-gallery-welcome"
      >
        <div className="relative z-10 max-w-3xl">
          <p className="text-sm font-medium text-white/80">Home</p>
          <h1 id="client-gallery-welcome" className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome{firstName ? `, ${firstName}` : ""}{" "}
            <span className="inline-block" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-3 text-base text-white/90">
            Build beautiful client-facing galleries and share your brand — storage you control (BYOS). This dashboard will
            fill in as albums, uploads, and analytics connect to your bucket.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Add-on status">
          <p className="text-lg font-semibold text-foreground">
            {entitled ? (
              <span className="text-emerald-500">Active</span>
            ) : (
              <span className="text-amber-500">Not enabled</span>
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{productLabel}</p>
          {!entitled ? (
            <Button asChild size="sm" className="mt-3" variant="outline">
              <Link href={packagesHref}>Enable in Packages</Link>
            </Button>
          ) : null}
        </StatCard>

        <StatCard title="Photos in gallery">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-foreground">{entitled ? totalPhotos : "—"}</span>
            <span className="text-sm text-muted-foreground">photos</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {entitled
              ? "Uploaded to your S3-compatible bucket via client gallery albums."
              : "Enable the add-on to upload photos to your bucket."}
          </p>
        </StatCard>

        <StatCard title="Help &amp; setup" className="sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-muted-foreground">
            Path, pricing, and face-index credits are configured in Admin → Packages.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-3">
            <Link href={packagesHref}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Open Packages
            </Link>
          </Button>
        </StatCard>
      </div>

      <div className="rounded-xl border border-primary/25 bg-muted/40 px-4 py-3 text-sm text-foreground sm:px-6">
        <p className="font-medium">Same-origin gallery on every domain</p>
        <p className="mt-1 text-muted-foreground">
          You are on <span className="font-mono font-semibold text-foreground">{brandName}</span> — guests can reach this
          route without a separate gallery host once your storage and workers are wired up.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg text-card-foreground">Your albums</CardTitle>
            </div>
            <CardDescription>
              Standalone photographer albums (not tied to live events). Configure <code className="text-xs">CLIENT_GALLERY_S3_*</code>{" "}
              on the server for uploads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {entitled && albums.length > 0 ? (
              <ul className="space-y-2 text-sm text-foreground">
                {albums.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex justify-between gap-2">
                    <span className="truncate font-medium">{a.title || "Untitled album"}</span>
                    <span className="shrink-0 text-muted-foreground">{a.assetCount ?? 0} photos</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                {entitled
                  ? "No albums yet — create one and upload to your bucket."
                  : "Enable the add-on, then create albums from the sidebar."}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={`${CLIENT_GALLERY_BASE}/my-albums`}>My albums</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={`${CLIENT_GALLERY_BASE}/new-album`}>New album</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg text-card-foreground">AI-assisted gallery</CardTitle>
            </div>
            <CardDescription>
              Face search, tags, and vision jobs can debit your wallet per your platform pricing once workers are deployed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This is separate from <strong className="text-foreground">event image generation</strong> in the editor — that
              uses your wallet per image; gallery AI jobs are configured under Admin → Packages (face index credits).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg text-card-foreground">Gallery activity (last 7 days)</CardTitle>
          </div>
          <CardDescription>Metrics will populate when tracking is connected.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Registrations", value: "0", icon: UserPlus },
              { label: "Gallery visits", value: "0", icon: Images },
              { label: "Image views", value: "0", icon: Eye },
              { label: "Downloads", value: "0", icon: Download },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-muted/30 px-3 py-4 text-center"
              >
                <Icon className="mx-auto mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
                <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Help &amp; overview</CardTitle>
          <CardDescription>How this page fits into your platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what" className="border-border">
              <AccordionTrigger className="text-foreground hover:no-underline">
                What is the client photo gallery?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                It is a same-origin route for <strong className="text-foreground">client-delivered albums</strong> using
                storage you provide (e.g. S3). Presigned uploads and processing can live in workers; this app hosts the
                shell URL on your domain.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="diff" className="border-border">
              <AccordionTrigger className="text-foreground hover:no-underline">
                Different from the event &quot;Photo gallery&quot; field?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes. The event editor &quot;Photo gallery&quot; only shows images on each event&apos;s public watch page.
                This BYOS gallery is for separate client delivery workflows and your own bucket — not the same data path.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="enable" className="border-border">
              <AccordionTrigger className="text-foreground hover:no-underline">
                How do I get access?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your administrator lists the add-on under Packages and can enable your account under Admin → Streamers or
                Studios. Then use the sidebar link (opens in a new tab) or this page anytime.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

export function ClientGalleryLightHeader({
  dashboardHref,
  signedIn,
}: {
  dashboardHref: string
  signedIn: boolean
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <BrandedLogo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/site/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
