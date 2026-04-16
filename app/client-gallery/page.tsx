"use client"

import Link from "next/link"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { DashboardWithSidebar } from "@/components/dashboard/dashboard-with-sidebar"
import { ClientGalleryDashboard, ClientGalleryLightHeader } from "@/components/client-gallery/client-gallery-dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import { SidebarProvider } from "@/lib/sidebar-context"

/**
 * Client photo gallery add-on (BYOS) — light dashboard per docs/photo-gallery-addon.md.
 * Signed-in streamers/studios use the same sidebar as the rest of the app (this route is outside /streamer layout).
 */
export default function ClientGalleryPage() {
  const { branding } = useBranding()
  const { user, isLoading: authLoading } = useAuth()

  const dashboardHref = user?.role === "studio" ? "/studio" : "/streamer"
  const packagesHref = user?.role === "studio" ? "/studio/packages" : "/streamer/packages"

  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500 antialiased">
        Loading…
      </div>
    )
  }

  if (user && (user.role === "streamer" || user.role === "studio")) {
    return (
      <SidebarProvider>
        <DashboardWithSidebar>
          <div className="-mx-4 min-h-[calc(100dvh-5rem)] bg-zinc-50 px-4 py-8 text-zinc-900 antialiased sm:-mx-6 sm:px-6 sm:py-10">
            <div className="mx-auto max-w-6xl">
              <ClientGalleryDashboard
                user={user}
                brandName={branding.brandName}
                dashboardHref={dashboardHref}
                packagesHref={packagesHref}
              />
            </div>
          </div>
        </DashboardWithSidebar>
      </SidebarProvider>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
      <ClientGalleryLightHeader dashboardHref={dashboardHref} signedIn={!!user} />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        {!user ? (
          <div className="mx-auto max-w-lg">
            <Card className="border-zinc-200 bg-white shadow-md">
              <CardHeader>
                <div className="mb-2 flex justify-center">
                  <BrandedLogo size="md" />
                </div>
                <CardTitle className="text-center text-xl text-zinc-900">Client photo gallery</CardTitle>
                <CardDescription className="text-center text-zinc-600">
                  Sign in as a streamer or studio to view your dashboard and add-on status.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
                  <Link href="/site/login">Sign in</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : user.role === "admin" ? (
          <Card className="mx-auto max-w-2xl border-zinc-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-zinc-900">Administrator</CardTitle>
              <CardDescription className="text-zinc-600">
                Configure the client gallery add-on, path, and pricing under Admin → Packages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="border-zinc-300">
                <Link href="/admin/packages">Open Admin → Packages</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
