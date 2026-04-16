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
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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
    <Card className={cn("border-zinc-200 bg-white shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600">{title}</CardTitle>
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

  const firstName = user.name?.trim().split(/\s+/)[0] ?? ""
  const productLabel = pg?.catalog?.productName?.trim() || "Client photo gallery"
  const entitled = pg?.entitled === true

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl border border-sky-900/20 bg-gradient-to-br from-sky-800 via-indigo-900 to-slate-900 px-6 py-8 text-white shadow-lg sm:px-8"
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
          <p className="text-lg font-semibold text-zinc-900">
            {entitled ? (
              <span className="text-emerald-700">Active</span>
            ) : (
              <span className="text-amber-700">Not enabled</span>
            )}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{productLabel}</p>
          {!entitled ? (
            <Button asChild size="sm" className="mt-3" variant="outline">
              <Link href={packagesHref}>Enable in Packages</Link>
            </Button>
          ) : null}
        </StatCard>

        <StatCard title="Photos in gallery">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-zinc-900">0</span>
            <span className="text-sm text-zinc-500">photos</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Totals will appear when the BYOS upload pipeline is connected to your storage.
          </p>
        </StatCard>

        <StatCard title="Help &amp; setup" className="sm:col-span-2 lg:col-span-1">
          <p className="text-sm text-zinc-600">Path, pricing, and face-index credits are configured in Admin → Packages.</p>
          <Button asChild size="sm" variant="secondary" className="mt-3 bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
            <Link href={packagesHref}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Open Packages
            </Link>
          </Button>
        </StatCard>
      </div>

      <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 px-4 py-3 text-sm text-indigo-950 sm:px-6">
        <p className="font-medium">Same-origin gallery on every domain</p>
        <p className="mt-1 text-indigo-900/80">
          You are on <span className="font-mono font-semibold">{brandName}</span> — guests can reach this route without a
          separate gallery host once your storage and workers are wired up.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-sky-700" />
              <CardTitle className="text-lg text-zinc-900">Your albums</CardTitle>
            </div>
            <CardDescription className="text-zinc-600">
              When the BYOS pipeline lists buckets and prefixes for your account, client albums will show here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
              No client albums yet — create events and connect storage from your dashboard when ready.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={dashboardHref}>Go to dashboard</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={packagesHref}>Packages</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-lg text-zinc-900">AI-assisted gallery</CardTitle>
            </div>
            <CardDescription className="text-zinc-600">
              Face search, tags, and vision jobs can debit your wallet per your platform pricing once workers are deployed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">
              This is separate from <strong className="text-zinc-900">event image generation</strong> in the editor — that
              uses your wallet per image; gallery AI jobs are configured under Admin → Packages (face index credits).
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-zinc-700" />
            <CardTitle className="text-lg text-zinc-900">Gallery activity (last 7 days)</CardTitle>
          </div>
          <CardDescription className="text-zinc-600">Metrics will populate when tracking is connected.</CardDescription>
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
                className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-4 text-center"
              >
                <Icon className="mx-auto mb-2 h-5 w-5 text-zinc-400" aria-hidden />
                <p className="text-2xl font-bold tabular-nums text-zinc-900">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-900">Help &amp; overview</CardTitle>
          <CardDescription className="text-zinc-600">How this page fits into your platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what" className="border-zinc-200">
              <AccordionTrigger className="text-zinc-900 hover:no-underline">
                What is the client photo gallery?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600">
                It is a same-origin route for <strong className="text-zinc-800">client-delivered albums</strong> using
                storage you provide (e.g. S3). Presigned uploads and processing can live in workers; this app hosts the
                shell URL on your domain.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="diff" className="border-zinc-200">
              <AccordionTrigger className="text-zinc-900 hover:no-underline">
                Different from the event &quot;Photo gallery&quot; field?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600">
                Yes. The event editor &quot;Photo gallery&quot; only shows images on each event&apos;s public watch page.
                This BYOS gallery is for separate client delivery workflows and your own bucket — not the same data path.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="enable" className="border-zinc-200">
              <AccordionTrigger className="text-zinc-900 hover:no-underline">
                How do I get access?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-600">
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
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-zinc-900">
          <BrandedLogo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button variant="outline" size="sm" className="border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50" asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50" asChild>
              <Link href="/site/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
