"use client"

import Link from "next/link"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { AuthUser } from "@/lib/auth-context"

const DEFAULT_SECTION_TITLE = "My Events Photos"
const DEFAULT_UNSUPPORTED_DESCRIPTION =
  "This gallery section is available to streamer and studio accounts. Sign in with a creator account to list events and gallery photos."

/**
 * Access states for client-gallery routes when the user is not a streamer/studio (or signed out).
 * Does not show the generic "Coming soon" placeholder used on stub gallery routes.
 */
export function ClientGalleryMyEventsAccessFallback({
  user,
  sectionTitle = DEFAULT_SECTION_TITLE,
  unsupportedDescription = DEFAULT_UNSUPPORTED_DESCRIPTION,
}: {
  user: AuthUser | null
  sectionTitle?: string
  unsupportedDescription?: string
}) {
  if (!user) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <Card className="border-border bg-card shadow-md">
          <CardHeader>
            <div className="mb-2 flex justify-center">
              <BrandedLogo size="md" />
            </div>
            <CardTitle className="text-center text-xl">Client photo gallery</CardTitle>
            <CardDescription className="text-center">
              Sign in as a streamer or studio to use this section.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/site/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (user.role === "admin") {
    return (
      <Card className="mx-auto max-w-2xl border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Administrator</CardTitle>
          <CardDescription>
            Configure the client gallery add-on under Admin → Packages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/packages">Open Admin → Packages</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-2xl border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>{sectionTitle}</CardTitle>
        <CardDescription>{unsupportedDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/client-gallery">Back to gallery dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
