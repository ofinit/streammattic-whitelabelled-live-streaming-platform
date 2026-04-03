"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { StudioLandingPage } from "@/components/landing/studio-landing"
import { BRANDING_PREVIEW_SESSION_KEY } from "@/lib/branding-preview-session"
import type { Branding } from "@/lib/types"

function SitePageInner() {
  const searchParams = useSearchParams()
  const isDraftPreview = searchParams.get("preview") === "draft"
  const [draftBranding, setDraftBranding] = useState<Branding | null | undefined>(() =>
    isDraftPreview ? undefined : null,
  )

  useEffect(() => {
    if (!isDraftPreview) {
      setDraftBranding(null)
      return
    }
    try {
      const raw = sessionStorage.getItem(BRANDING_PREVIEW_SESSION_KEY)
      if (!raw) {
        setDraftBranding(null)
        return
      }
      setDraftBranding(JSON.parse(raw) as Branding)
    } catch {
      setDraftBranding(null)
    }
  }, [isDraftPreview])

  if (isDraftPreview && draftBranding === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading preview…
      </div>
    )
  }

  const previewBanner =
    isDraftPreview && draftBranding != null ? (
      <div
        className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-950 dark:text-amber-100"
        role="status"
      >
        Preview: showing your current branding editor draft (unsaved changes). Save in the dashboard to persist.
      </div>
    ) : isDraftPreview && draftBranding === null ? (
      <div
        className="border-b border-border bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground"
        role="status"
      >
        No preview data found. Return to Branding, click &quot;Open full page&quot; again, or allow storage for this site.
      </div>
    ) : null

  return (
    <StudioLandingPage
      draftBranding={isDraftPreview ? draftBranding : null}
      previewBanner={previewBanner}
    />
  )
}

export default function SitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SitePageInner />
    </Suspense>
  )
}
