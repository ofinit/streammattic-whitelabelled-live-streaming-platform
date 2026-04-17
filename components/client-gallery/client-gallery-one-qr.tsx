"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import QRCode from "react-qr-code"
import { Copy, Download, ExternalLink, Globe, Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { OneQrLandingThemes } from "@/components/client-gallery/one-qr-landing-themes"
import { useAuth } from "@/lib/auth-context"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"
import type { LandingTheme } from "@/lib/types"
import type { ThemeConfig } from "@/lib/landing-themes"

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json())

type DomainRow = {
  domain: string
  verificationStatus?: string
  isPrimary?: boolean
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "studio"
  )
}

function getConfiguredOrigin(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  if (env) return env
  if (typeof window !== "undefined") return window.location.origin.replace(/\/$/, "")
  return ""
}

function getApexHostname(): string {
  const o = getConfiguredOrigin()
  try {
    return new URL(o).hostname
  } catch {
    return "streamlivee.com"
  }
}

function isLocalHostname(host: string): boolean {
  return host === "localhost" || host.startsWith("127.") || host.endsWith(".local")
}

type ResolvedTarget = {
  url: string
  /** Short explanation for the UI */
  mode: "custom-domain" | "subdomain-site" | "platform-site" | "public-events"
}

function resolveOneQrTarget(args: {
  role: "studio" | "streamer"
  displayNameForSlug: string
  brandingName: string | null
  /** Streamers only get a /site subdomain link after they have a branding row (same table as studios). */
  hasBrandingRecord: boolean
  domains: DomainRow[]
}): ResolvedTarget {
  const origin = getConfiguredOrigin()
  const apex = getApexHostname()
  const local = isLocalHostname(apex)

  const verified = args.domains.filter((d) => d.verificationStatus === "verified")
  const primary = verified.find((d) => d.isPrimary) || verified[0]
  if (primary?.domain) {
    return { url: `https://${primary.domain}/site`, mode: "custom-domain" }
  }

  if (args.role === "streamer" && !args.hasBrandingRecord) {
    return { url: `${origin}/events`, mode: "public-events" }
  }

  const rawName = (
    args.brandingName ||
    (args.role === "studio" ? args.displayNameForSlug : "") ||
    ""
  ).trim()
  const slug = slugify(rawName || args.displayNameForSlug || "studio")

  if (args.role === "streamer" && !rawName) {
    return { url: `${origin}/events`, mode: "public-events" }
  }

  if (local) {
    return { url: `${origin}/site`, mode: "platform-site" }
  }

  const subHost = `${slug}.${apex}`
  return { url: `https://${subHost}/site`, mode: "subdomain-site" }
}

export function ClientGalleryOneQr() {
  const { user } = useAuth()
  const role = user?.role === "studio" ? "studio" : "streamer"
  const qrWrapRef = useRef<HTMLDivElement>(null)

  const { data: brandingRes, isLoading: brandingLoading, mutate: mutateBranding } = useSWR(
    "/api/branding",
    fetcher,
  )
  const { data: domainsRes, isLoading: domainsLoading } = useSWR(
    role === "studio" ? "/api/studio/domains" : null,
    fetcher,
  )

  const branding = brandingRes?.branding as Record<string, unknown> | null | undefined
  const brandingName =
    (typeof branding?.platformName === "string" && branding.platformName) ||
    (typeof branding?.brandName === "string" && branding.brandName) ||
    null

  const domains = useMemo(
    () => (Array.isArray(domainsRes?.domains) ? (domainsRes.domains as DomainRow[]) : []),
    [domainsRes],
  )

  const hasBrandingRecord = Boolean(brandingRes?.branding)

  const target = useMemo(() => {
    if (!user) return null
    return resolveOneQrTarget({
      role,
      displayNameForSlug: user.name || user.email?.split("@")[0] || "studio",
      brandingName,
      hasBrandingRecord,
      domains: role === "studio" ? domains : [],
    })
  }, [user, role, brandingName, hasBrandingRecord, domains])

  const [applyingThemeId, setApplyingThemeId] = useState<string | null>(null)

  const selectedTheme = branding?.selectedTheme as LandingTheme | undefined

  const applyLandingTheme = useCallback(
    async (theme: ThemeConfig) => {
      if (!user) return
      const platformName =
        (typeof branding?.platformName === "string" && branding.platformName.trim()) ||
        user.name?.trim() ||
        user.email?.split("@")[0] ||
        "My Studio"
      setApplyingThemeId(theme.id)
      try {
        const res = await fetch("/api/branding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            selectedTheme: theme.id,
            primaryColor: theme.primaryColor,
            secondaryColor: theme.accentColor,
            accentColor: theme.accentColor,
            platformName,
          }),
        })
        if (!res.ok) {
          const errText = await res.text().catch(() => "")
          throw new Error(errText || res.statusText)
        }
        await mutateBranding()
        toast.success(`${theme.name} is now your landing theme`)
      } catch {
        toast.error("Could not apply theme. Try again or use Branding → Themes.")
      } finally {
        setApplyingThemeId(null)
      }
    },
    [user, branding, mutateBranding],
  )

  const [copied, setCopied] = useState(false)
  const copyLink = useCallback(async () => {
    if (!target?.url) return
    try {
      await navigator.clipboard.writeText(target.url)
      setCopied(true)
      toast.success("Link copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }, [target?.url])

  const downloadSvg = useCallback(() => {
    const svg = qrWrapRef.current?.querySelector("svg")
    if (!svg) {
      toast.error("QR not ready")
      return
    }
    const serialized = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "streamlivee-one-qr.svg"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("QR downloaded")
  }, [])

  const modeHint = useMemo(() => {
    if (!target) return ""
    switch (target.mode) {
      case "custom-domain":
        return "Using your verified custom domain. Guests see your white-label landing at /site."
      case "subdomain-site":
        return "Uses your studio name as a subdomain on the platform host. DNS for wildcard subdomains must point to StreamLivee."
      case "platform-site":
        return "Development / local: opening /site on this origin. In production, prefer a verified domain or subdomain."
      case "public-events":
        return "Your public discovery page listing live and upcoming events on StreamLivee."
      default:
        return ""
    }
  }, [target])

  const loading = brandingLoading || (role === "studio" && domainsLoading)

  if (loading || !target || !user) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading One QR…
      </div>
    )
  }

  const brandingHref = role === "studio" ? "/studio/branding" : "/streamer/settings"
  const domainsHref = "/studio/domains"

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">One QR</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A single QR code can send people to your public studio landing ({"/site"}) or, for streamers without a
          branded site yet, the public events directory. Customize your landing under Branding; studios can add a
          custom domain for the cleanest link.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Your public link</CardTitle>
          <CardDescription>{modeHint}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div
            ref={qrWrapRef}
            className="flex shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <QRCode value={target.url} size={200} level="M" />
            <span className="text-center text-xs text-neutral-600">Scan to open</span>
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" className="gap-2" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy link"}
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={downloadSvg}>
                  <Download className="h-4 w-4" />
                  Download QR (SVG)
                </Button>
                <Button type="button" variant="outline" className="gap-2" asChild>
                  <a href={target.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open
                  </a>
                </Button>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={target.url} className="font-mono text-xs md:text-sm" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <Link href={brandingHref}>
                  <Pencil className="h-4 w-4" />
                  {role === "studio" ? "Edit branding" : "Profile & settings"}
                </Link>
              </Button>
              {role === "studio" && (
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <Link href={domainsHref}>
                    <Globe className="h-4 w-4" />
                    Custom domain
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <OneQrLandingThemes
        currentThemeId={selectedTheme}
        brandingHref={brandingHref}
        siteNote={
          target.mode === "public-events"
            ? "After you save a theme, finish your studio name in Branding so your /site link matches your brand."
            : undefined
        }
        applyingThemeId={applyingThemeId}
        onApply={applyLandingTheme}
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="ghost" asChild>
          <Link href={CLIENT_GALLERY_BASE}>Back to gallery dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
