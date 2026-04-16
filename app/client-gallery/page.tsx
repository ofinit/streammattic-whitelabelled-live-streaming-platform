"use client"

import Link from "next/link"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { ClientGalleryDashboard, ClientGalleryLightHeader } from "@/components/client-gallery/client-gallery-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"

/**
 * Client photo gallery add-on (BYOS) — streamer/studio shell is provided by `layout.tsx`.
 */
export default function ClientGalleryPage() {
  const { branding } = useBranding()
  const { user } = useAuth()

  const dashboardHref = user?.role === "studio" ? "/studio" : "/streamer"
  const packagesHref = user?.role === "studio" ? "/studio/packages" : "/streamer/packages"

  if (user && (user.role === "streamer" || user.role === "studio")) {
    return (
      <ClientGalleryDashboard
        user={user}
        brandName={branding.brandName}
        dashboardHref={dashboardHref}
        packagesHref={packagesHref}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ClientGalleryLightHeader dashboardHref={dashboardHref} signedIn={!!user} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {!user ? (
          <div className="mx-auto max-w-lg">
            <Card className="border-border bg-card shadow-md">
              <CardHeader>
                <div className="mb-2 flex justify-center">
                  <BrandedLogo size="md" />
                </div>
                <CardTitle className="text-center text-xl">Client photo gallery</CardTitle>
                <CardDescription className="text-center">
                  Sign in as a streamer or studio to view your dashboard and add-on status.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild>
                  <Link href="/site/login">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : user.role === "admin" ? (
          <Card className="mx-auto max-w-2xl border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Administrator</CardTitle>
              <CardDescription>
                Configure the client gallery add-on, path, and pricing under Admin → Packages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin/packages">Open Admin → Packages</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
