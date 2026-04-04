"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { CheckCircle2, Globe, LayoutDashboard, Loader2 } from "lucide-react"
import { getPlatformARecordDisplay, getPlatformCnameDisplay } from "@/lib/platform-dns"

const STUDIO_MENU_OVERVIEW = [
  { title: "Dashboard", desc: "Overview of your studio, wallet, and activity" },
  { title: "Events", desc: "Create and manage live events" },
  { title: "Event Calendar", desc: "Schedule and view events on a calendar" },
  { title: "Wallet", desc: "Balance, top-ups, and transactions" },
  { title: "Pricing", desc: "Credit packs and purchase options" },
  { title: "Analytics", desc: "Performance and audience insights" },
  { title: "Branding", desc: "Logo, colors, and white-label appearance" },
  { title: "Notifications", desc: "Alerts and messages" },
  { title: "Integrations", desc: "YouTube and other connections (when enabled)" },
  { title: "Settings", desc: "Account and studio preferences" },
]

export default function StudioUpgradeSuccessPage() {
  const { user, isLoading: authLoading, refreshUser, isAuthenticated } = useAuth()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(true)
  const cname = getPlatformCnameDisplay()
  const a = getPlatformARecordDisplay()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await refreshUser()
      } finally {
        if (!cancelled) setRefreshing(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  useEffect(() => {
    if (authLoading || refreshing) return
    if (!isAuthenticated) {
      router.replace("/site/login?redirect=/upgrade/studio/success")
    }
  }, [authLoading, refreshing, isAuthenticated, router])

  if (authLoading || refreshing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Updating your account…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const role = user?.role as string | undefined
  const isStudio = role === "studio" || role === "admin"

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isStudio ? "Welcome to Studio" : "Payment received"}
          </h1>
          <p className="text-muted-foreground max-w-lg">
            {isStudio
              ? "Your account is now a Studio. Use the Studio dashboard to run events under your brand and connect a custom domain."
              : "If you just completed a Studio upgrade, your role may take a moment to update. Refresh this page or sign in again, then open the Studio dashboard."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Set up your custom domain
            </CardTitle>
            <CardDescription>
              Point your domain at the platform targets your administrator provides. You will add and verify the domain
              under Studio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Open <strong className="text-foreground">Studio →</strong> custom domain or setup (e.g. Domains).</li>
              <li>Add your hostname (e.g. <code className="text-foreground">www.yourbrand.com</code>).</li>
              <li>
                Create the DNS records your dashboard shows—typically an <strong className="text-foreground">A</strong>{" "}
                record for the root domain or a <strong className="text-foreground">CNAME</strong> for a subdomain.
              </li>
              <li>Wait for DNS and SSL to verify, then share your branded URL with clients.</li>
            </ol>
            <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs text-foreground">
              <p className="mb-2 font-sans text-sm font-medium text-foreground">Common platform targets</p>
              <p>
                <span className="text-muted-foreground">CNAME:</span> {cname}
              </p>
              <p>
                <span className="text-muted-foreground">A (root):</span> {a}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Studio dashboard and menus
            </CardTitle>
            <CardDescription>After you open Studio, you will see these main areas in the sidebar.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {STUDIO_MENU_OVERVIEW.map((item) => (
                <li key={item.title} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <span className="text-muted-foreground"> — {item.desc}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/studio">Go to Studio dashboard</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full border-border bg-transparent sm:w-auto">
            <Link href="/studio/domains">Set up custom domain</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
