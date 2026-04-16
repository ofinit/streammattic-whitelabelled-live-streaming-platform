"use client"

import Link from "next/link"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"

export function ClientGalleryRoutePlaceholder({ title }: { title: string }) {
  const { user } = useAuth()

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

  if (user.role !== "streamer" && user.role !== "studio") {
    return null
  }

  return (
    <div className="space-y-6 py-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Coming soon — gallery features will appear here as they connect to your storage.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/client-gallery">Back to gallery dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
