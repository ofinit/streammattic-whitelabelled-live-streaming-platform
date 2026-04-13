"use client"

import Link from "next/link"
import { Images } from "lucide-react"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"

/**
 * Client photo gallery add-on (BYOS) — same-origin shell per docs/photo-gallery-addon.md.
 * Albums backed by the account’s own S3 + presigned uploads will list here when that pipeline is shipped;
 * not the template “Photo gallery” field on events (those stay on each event’s watch page only).
 */
export default function ClientGalleryPage() {
  const { branding } = useBranding()
  const { user, isLoading: authLoading } = useAuth()

  const dashboardHref = user?.role === "studio" ? "/studio" : "/streamer"
  const packagesHref = user?.role === "studio" ? "/studio/packages" : "/streamer/packages"

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

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center md:text-left">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary md:mb-0 md:mr-4 md:inline-flex md:align-middle">
            <Images className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight md:inline md:text-3xl">Client photo gallery</h1>
          <p className="mt-3 text-muted-foreground">
            This add-on is for <strong className="font-medium text-foreground">client-delivered photos</strong> using{" "}
            <strong className="font-medium text-foreground">storage you provide</strong> (BYOS — e.g. your S3 bucket).
            Presigned uploads, thumbnails, and optional face-assisted search are intended to run against that storage;
            heavy work can live in workers while this app keeps a single same-origin URL for guests and clients.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            That is separate from the <strong className="text-foreground">Photo gallery</strong> section in the event
            editor, which only feeds images on each event&apos;s public watch page — it is not the BYOS client gallery
            pipeline.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You are on <span className="font-mono text-foreground">{branding.brandName}</span> — same gallery path on every
            domain (see Admin → Packages for path and pricing).
          </p>
        </div>

        {authLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !user ? (
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">Sign in</CardTitle>
              <CardDescription>
                Streamers and studios can review add-on details and pricing under Packages after signing in.
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
            Configure the add-on under{" "}
            <Link href="/admin/packages" className="text-primary underline-offset-4 hover:underline">
              Admin → Packages
            </Link>
            .
          </p>
        ) : (
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">No client albums yet</CardTitle>
              <CardDescription className="text-left">
                When the BYOS pipeline is connected for your account, client albums and uploads from your bucket will
                appear here. Until then, this page stays ready as the same-origin gallery shell described in your
                platform docs.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href={packagesHref}>Open Packages</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
