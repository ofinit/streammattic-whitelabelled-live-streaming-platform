"use client"

import Link from "next/link"
import { Images } from "lucide-react"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { Button } from "@/components/ui/button"
import { useBranding } from "@/lib/branding-context"

/**
 * Public client photo gallery shell (same origin on platform + studio custom domains).
 * BYOS S3 + metadata APIs will plug in here later; optional ?token= for private albums later.
 */
export default function ClientGalleryPage() {
  const { branding } = useBranding()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <BrandedLogo size="md" />
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/site/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Images className="h-8 w-8" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Client photo gallery</h1>
        <p className="mt-3 text-muted-foreground">
          This area will list event galleries using your own storage (BYOS). Uploads and face-assisted search will connect
          here in a later release.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          You are on <span className="font-mono text-foreground">{branding.brandName}</span> — same app path on every domain.
        </p>
      </main>
    </div>
  )
}
