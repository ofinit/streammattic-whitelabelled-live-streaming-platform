"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import useSWR from "swr"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Building2,
  Palette,
  Globe,
  CreditCard,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Search,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Studio } from "@/lib/types"
import type { CloudflareZone } from "@/lib/cloudflare-dns"
import {
  getRoutingTargetDisplayForDomain,
  getVerificationTxtHostDisplay,
  parseDomainLayout,
  getPlatformARecordDisplay,
} from "@/lib/platform-dns"
import {
  validateBrandingStep,
  validateCompanyStep,
  companyWebsiteHost,
  isValidHostname,
  validateDomainStep,
  validatePaymentStep,
} from "@/lib/studio-setup-validation"
import { Switch } from "@/components/ui/switch"
import { StudioUpgradePaymentPanel } from "@/components/streamer/studio-upgrade-payment-panel"
import { parseStudioAnnualSubscription } from "@/lib/studio-subscription-public"
import {
  PHONE_DIAL_OPTIONS,
  composeInternationalPhone,
  parseStoredPhone,
} from "@/lib/phone-country-codes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const dynamic = "force-dynamic"

const settingsFetcher = (url: string) => fetch(url).then((res) => res.json())

const SETUP_STEPS = [
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "domain", label: "Custom Domain", icon: Globe },
  { id: "payment", label: "Payment Gateway", icon: CreditCard },
]

function apexHostForWww(domain: string): string {
  const parts = domain.trim().toLowerCase().split(".").filter(Boolean)
  if (parts.length > 2 && parts[0] === "www") {
    return parts.slice(1).join(".")
  }
  return domain.trim().toLowerCase()
}

function DnsSetupHint({ domain }: { domain: string }) {
  const { isSubdomain, subdomain } = parseDomainLayout(domain)
  const routing = getRoutingTargetDisplayForDomain(domain)
  const txtHost = getVerificationTxtHostDisplay(domain)
  const aRecordIp = getPlatformARecordDisplay()
  const apex = apexHostForWww(domain)
  return (
    <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
      <p className="font-medium text-sm">DNS Configuration Required</p>
      <p className="text-sm text-muted-foreground">
        After completing setup, you&apos;ll add DNS records like these (exact values appear under Studio → Domains):
      </p>
      <div className="space-y-2 text-xs font-mono bg-background rounded p-3">
        {isSubdomain ? (
          <p>
            <span className="text-muted-foreground">CNAME:</span> {subdomain} → {routing}
          </p>
        ) : (
          <>
            <p>
              <span className="text-muted-foreground">A record (@):</span> {apex} → {routing}
            </p>
            <p>
              <span className="text-muted-foreground">A record (www):</span> www.{apex} → {aRecordIp}
            </p>
          </>
        )}
        <p>
          <span className="text-muted-foreground">TXT:</span> {txtHost} → (verification token from dashboard)
        </p>
      </div>
    </div>
  )
}

export default function StudioSetupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const upgraded = searchParams.get("upgraded") === "1"
  const { user } = useAuth()
  const studioUser = user as unknown as Studio
  const isStreamerSetup = user?.role === "streamer"

  const settingsSwrKey = isStreamerSetup ? "/api/settings" : null
  const { data: settingsData } = useSWR(settingsSwrKey, settingsFetcher, { refreshInterval: 60_000 })
  const settingsRows = (settingsData?.settings ?? []) as { key: string; value: unknown }[]
  const studioSubRaw = settingsRows.find((s) => s.key === "studio_annual_subscription")?.value
  const studioSubscription = parseStudioAnnualSubscription(studioSubRaw)
  const studioUpgradeAvailable = Boolean(
    studioSubscription?.enabled && studioSubscription.pricePaisa > 0,
  )

  const dashSwrKey = isStreamerSetup ? "/api/streamer/dashboard" : null
  const { data: dashData } = useSWR(dashSwrKey, settingsFetcher, { refreshInterval: 30_000 })
  const walletBalancePaise = Number((dashData?.stats as { walletBalance?: number } | undefined)?.walletBalance ?? 0)

  const [currentStep, setCurrentStep] = useState(0)
  const [draftHydrated, setDraftHydrated] = useState(false)
  const saveDraftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state (no account-based prefill—users enter legal / public details here)
  const [companyData, setCompanyData] = useState({
    companyName: "",
    tagline: "",
    email: "",
    phoneDialCode: "+91",
    phoneLocal: "",
  })

  const [brandingData, setBrandingData] = useState({
    platformName: studioUser?.branding?.platformName || "",
    logo: studioUser?.branding?.logo || "",
    favicon: studioUser?.branding?.favicon || "",
    primaryColor: studioUser?.branding?.primaryColor || "#10b981",
    secondaryColor: studioUser?.branding?.secondaryColor || "#059669",
  })

  const [isUploading, setIsUploading] = useState({ logo: false, favicon: false })

  const [domainData, setDomainData] = useState({
    customDomain: "",
    skipDomain: false,
    useCloudflare: false,
    cfApiToken: "",
    cfZoneId: "",
  })

  const [paymentData, setPaymentData] = useState({
    gateway: "" as "razorpay" | "instamojo" | "cashfree" | "",
    skipPayment: false,
    studioUpgradePayMethod: "wallet" as "" | "wallet" | "razorpay" | "instamojo",
  })

  const progress = ((currentStep + 1) / SETUP_STEPS.length) * 100

  const stepValidationError = (() => {
    switch (currentStep) {
      case 0:
        return validateCompanyStep({
          ...companyData,
          customDomain: domainData.customDomain,
        })
      case 1:
        return validateBrandingStep(brandingData)
      case 2:
        return validateDomainStep(domainData)
      case 3:
        return validatePaymentStep(paymentData, { streamerUpgrade: isStreamerSetup })
      default:
        return null
    }
  })()

  const saveDraft = useCallback(() => {
    void fetch("/api/studio/setup", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentStep,
        companyData: {
          ...companyData,
          phone: composeInternationalPhone(companyData.phoneDialCode, companyData.phoneLocal),
        },
        brandingData,
        domainData,
        paymentData,
      }),
    }).catch(() => {})
  }, [currentStep, companyData, brandingData, domainData, paymentData])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/studio/setup", { credentials: "include" })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { draft?: Record<string, unknown> | null }
        const d = data.draft
        if (!d || cancelled) return
        if (typeof d.currentStep === "number" && d.currentStep >= 0 && d.currentStep < SETUP_STEPS.length) {
          setCurrentStep(d.currentStep)
        }
        if (d.domainData && typeof d.domainData === "object") {
          setDomainData((prev) => ({ ...prev, ...(d.domainData as typeof prev) }))
        }
        if (d.companyData && typeof d.companyData === "object") {
          const raw = d.companyData as Record<string, unknown>
          setCompanyData((prev) => {
            const next = {
              ...prev,
              companyName: typeof raw.companyName === "string" ? raw.companyName : prev.companyName,
              tagline: typeof raw.tagline === "string" ? raw.tagline : prev.tagline,
              email: typeof raw.email === "string" ? raw.email : prev.email,
              phoneDialCode:
                typeof raw.phoneDialCode === "string" ? raw.phoneDialCode : prev.phoneDialCode,
              phoneLocal: typeof raw.phoneLocal === "string" ? raw.phoneLocal : prev.phoneLocal,
            }
            const legacy = typeof raw.phone === "string" ? raw.phone.trim() : ""
            if (legacy && typeof raw.phoneLocal !== "string" && !next.phoneLocal) {
              const parsed = parseStoredPhone(legacy)
              return { ...next, phoneDialCode: parsed.dial, phoneLocal: parsed.local }
            }
            return next
          })
          const legacyWebsite = typeof raw.website === "string" ? raw.website : ""
          if (legacyWebsite) {
            const host = companyWebsiteHost(legacyWebsite)
            setDomainData((prev) => {
              if (prev.customDomain?.trim() || !host || !isValidHostname(host)) return prev
              return { ...prev, customDomain: host, skipDomain: false }
            })
          }
        }
        if (d.brandingData && typeof d.brandingData === "object") {
          setBrandingData((prev) => ({ ...prev, ...(d.brandingData as typeof prev) }))
        }
        if (d.paymentData && typeof d.paymentData === "object") {
          setPaymentData((prev) => ({ ...prev, ...(d.paymentData as typeof prev) }))
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setDraftHydrated(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!draftHydrated) return
    if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current)
    saveDraftTimer.current = setTimeout(() => {
      saveDraft()
    }, 500)
    return () => {
      if (saveDraftTimer.current) clearTimeout(saveDraftTimer.current)
    }
  }, [draftHydrated, saveDraft])

  const handleNext = () => {
    if (stepValidationError) return
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const [isCloudflareLoading, setIsCloudflareLoading] = useState(false)
  const [cloudflareError, setCloudflareError] = useState<string | null>(null)
  const [cfZones, setCfZones] = useState<CloudflareZone[]>([])
  const [cfZoneSearch, setCfZoneSearch] = useState("")

  const filteredCfZones = useMemo(() => {
    const q = cfZoneSearch.trim().toLowerCase()
    if (!q) return cfZones
    return cfZones.filter((z) => z.name.toLowerCase().includes(q))
  }, [cfZones, cfZoneSearch])
  const [cfStep, setCfStep] = useState<1 | 2>(1)
  const [copiedNS, setCopiedNS] = useState<string | null>(null)

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "favicon") => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading((prev) => ({ ...prev, [type]: true }))
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("subdir", "branding")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (data.url) {
        setBrandingData((prev) => ({ ...prev, [type]: data.url }))
      }
    } catch (err) {
      console.error("Upload failed:", err)
    } finally {
      setIsUploading((prev) => ({ ...prev, [type]: false }))
    }
  }

  const handleComplete = async () => {
    if (user?.role === "streamer") {
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/studio/setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyData: {
            ...companyData,
            phone: composeInternationalPhone(companyData.phoneDialCode, companyData.phoneLocal),
          },
          brandingData,
          domainData,
          paymentData,
        }),
      })

      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
        const msg =
          (typeof error.error === "string" && error.error) ||
          (typeof error.message === "string" && error.message) ||
          "Failed to complete setup"
        throw new Error(msg)
      }

      router.push("/studio")
    } catch (err) {
      console.error("Setup error:", err)
      alert(err instanceof Error ? err.message : "An unexpected error occurred during setup.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFetchZones = async () => {
    if (!domainData.cfApiToken) return
    setIsCloudflareLoading(true)
    setCloudflareError(null)
    try {
      const res = await fetch(`/api/studio/cloudflare/setup?apiToken=${encodeURIComponent(domainData.cfApiToken)}`, {
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch zones")
      setCfZones(data.zones || [])
      setCfZoneSearch("")
      setCfStep(2)
      
      // Auto-select if match found
      if (data.zones?.length > 0) {
        const match = data.zones.find((z: CloudflareZone) => domainData.customDomain.endsWith(z.name))
        if (match) setDomainData(prev => ({ ...prev, cfZoneId: match.id }))
      }
    } catch (err) {
      setCloudflareError(err instanceof Error ? err.message : "Invalid API Token")
    } finally {
      setIsCloudflareLoading(false)
    }
  }

  const handleSetupCloudflare = async () => {
    if (!domainData.cfZoneId) return
    setIsCloudflareLoading(true)
    setCloudflareError(null)
    try {
      const res = await fetch("/api/studio/cloudflare/setup", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: domainData.cfApiToken,
          zoneId: domainData.cfZoneId,
          domainId: "wizard",
          customDomain: domainData.customDomain.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Setup failed")
      
      // Proceed to next step automatically or show success in UI
      setDomainData(prev => ({ ...prev, useCloudflare: false })) // Reset to show summary
      handleNext()
    } catch (err) {
      setCloudflareError(err instanceof Error ? err.message : "Failed to create DNS records")
    } finally {
      setIsCloudflareLoading(false)
    }
  }

  const canProceed = () => {
    if (stepValidationError) return false
    switch (currentStep) {
      case 0:
        return (
          validateCompanyStep({
            companyName: companyData.companyName,
            email: companyData.email,
            phoneDialCode: companyData.phoneDialCode,
            phoneLocal: companyData.phoneLocal,
            customDomain: domainData.customDomain,
          }) === null
        )
      case 1:
        return Boolean(brandingData.platformName?.trim() && brandingData.primaryColor)
      case 2:
        return Boolean(domainData.skipDomain || domainData.customDomain?.trim())
      case 3:
        if (isStreamerSetup) {
          return Boolean(
            paymentData.studioUpgradePayMethod && studioUpgradeAvailable && studioSubscription,
          )
        }
        return true
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Setup Your Platform</h1>
              <p className="text-muted-foreground mt-1">
                Complete these steps to configure your white-label streaming platform
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 bg-transparent"
              onClick={() => router.push(isStreamerSetup ? "/streamer" : "/studio")}
            >
              Exit setup
            </Button>
          </div>

          {upgraded && (
            <Alert className="mt-4 border-primary/30 bg-primary/5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertDescription>
                Your Studio subscription is active. Finish setup to configure branding and domain—your progress is saved
                automatically.
              </AlertDescription>
            </Alert>
          )}

          {/* Progress */}
          <div className="mt-6">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-4">
              {SETUP_STEPS.map((step, index) => {
                const Icon = step.icon
                const isCompleted = index < currentStep
                const isCurrent = index === currentStep

                return (
                  <button
                    key={step.id}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      isCompleted
                        ? "text-primary cursor-pointer"
                        : isCurrent
                          ? "text-foreground cursor-default"
                          : "text-muted-foreground cursor-not-allowed"
                    }`}
                    disabled={index > currentStep}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-primary/20 text-primary border-2 border-primary"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="hidden sm:inline font-medium">
                      {step.id === "payment" ? (isStreamerSetup ? "Studio payment" : "Finish") : step.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Company Profile */}
        {currentStep === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Company Profile
              </CardTitle>
              <CardDescription>
                Tell us about your company. This information will be used for invoices and communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stepValidationError && currentStep === 0 && (
                <p className="text-sm text-destructive">{stepValidationError}</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Company Name <span className="text-destructive font-semibold">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">Registered or trading name shown on invoices.</p>
                  <Input
                    id="companyName"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                    autoComplete="organization"
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <p className="text-xs text-muted-foreground">Short line under your platform name (optional).</p>
                  <Input
                    id="tagline"
                    value={companyData.tagline}
                    onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                    autoComplete="off"
                    className="bg-secondary border-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Support Email <span className="text-destructive font-semibold">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">Address customers and billing notices are sent to.</p>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    autoComplete="email"
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="phone-local">Support Phone</Label>
                  <p className="text-xs text-muted-foreground">
                    Optional. Choose country, then enter your number without the leading zero.
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <Select
                      value={companyData.phoneDialCode}
                      onValueChange={(v) => setCompanyData({ ...companyData, phoneDialCode: v })}
                    >
                      <SelectTrigger className="w-full sm:w-[200px] bg-secondary border-border shrink-0">
                        <SelectValue placeholder="Country" />
                      </SelectTrigger>
                      <SelectContent>
                        {PHONE_DIAL_OPTIONS.map((o) => (
                          <SelectItem key={`${o.iso}-${o.dial}`} value={o.dial}>
                            {o.name} ({o.dial})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone-local"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      placeholder="8322772776"
                      value={companyData.phoneLocal}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          phoneLocal: e.target.value.replace(/[^\d\s-]/g, ""),
                        })
                      }
                      className="bg-secondary border-0 min-w-0 flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-custom-domain">
                  Custom domain <span className="text-destructive font-semibold">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  The hostname where your white-label studio will live—same value you&apos;ll confirm on the Custom
                  Domain step (DNS is configured later). Type the domain only (e.g. live.yourcompany.com)—we add{" "}
                  <span className="font-mono">https://</span>.
                </p>
                <div className="flex rounded-md border border-input overflow-hidden bg-secondary">
                  <span className="px-3 flex items-center text-muted-foreground text-sm shrink-0 border-r border-border">
                    https://
                  </span>
                  <Input
                    id="company-custom-domain"
                    type="text"
                    value={domainData.customDomain}
                    onChange={(e) =>
                      setDomainData({
                        ...domainData,
                        customDomain: e.target.value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, ""),
                        skipDomain: false,
                      })
                    }
                    placeholder="yourcompany.com"
                    autoComplete="off"
                    className="border-0 rounded-none bg-transparent focus-visible:ring-0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Branding */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Platform Branding
              </CardTitle>
              <CardDescription>
                Customize how your platform looks to your users. You can update these later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stepValidationError && currentStep === 1 && (
                <p className="text-sm text-destructive">{stepValidationError}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="platformName">Platform Name *</Label>
                <Input
                  id="platformName"
                  value={brandingData.platformName}
                  onChange={(e) => setBrandingData({ ...brandingData, platformName: e.target.value })}
                  placeholder="e.g., StreamPro, LiveCast, EventHub"
                  className="bg-secondary border-0"
                />
                <p className="text-xs text-muted-foreground">
                  This appears in headers, emails, and throughout your platform
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <label className={`border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block relative ${isUploading.logo ? "opacity-50" : ""}`}>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "logo")}
                      disabled={isUploading.logo}
                    />
                    {brandingData.logo ? (
                      <div className="relative h-12 w-32 mx-auto">
                        <img src={brandingData.logo} alt="Logo Preview" className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload logo</p>
                      </>
                    )}
                    {isUploading.logo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG recommended: 200x50px</p>
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <label className={`border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer block relative ${isUploading.favicon ? "opacity-50" : ""}`}>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "favicon")}
                      disabled={isUploading.favicon}
                    />
                    {brandingData.favicon ? (
                      <div className="relative h-8 w-8 mx-auto">
                        <img src={brandingData.favicon} alt="Favicon Preview" className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload favicon</p>
                      </>
                    )}
                    {isUploading.favicon && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">PNG, ICO recommended: 32x32px</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandingData.primaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 bg-secondary border-0 cursor-pointer"
                    />
                    <Input
                      value={brandingData.primaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                      className="bg-secondary border-0 font-mono uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={brandingData.secondaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                      className="w-12 h-10 p-1 bg-secondary border-0 cursor-pointer"
                    />
                    <Input
                      value={brandingData.secondaryColor}
                      onChange={(e) => setBrandingData({ ...brandingData, secondaryColor: e.target.value })}
                      className="bg-secondary border-0 font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="pt-4">
                <Label className="mb-3 block">Live Preview</Label>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="p-4 flex items-center gap-3" style={{ backgroundColor: brandingData.primaryColor }}>
                    <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                      {brandingData.platformName.charAt(0) || "P"}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{brandingData.platformName || "Your Platform Name"}</p>
                      <p className="text-white/70 text-sm">{companyData.tagline || "Your streaming platform"}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-card">
                    <div className="flex gap-2">
                      <Button size="sm" style={{ backgroundColor: brandingData.primaryColor }} className="text-white">
                        Primary Button
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        style={{
                          borderColor: brandingData.primaryColor,
                          color: brandingData.primaryColor,
                        }}
                      >
                        Secondary Button
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Custom Domain */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Custom Domain
              </CardTitle>
              <CardDescription>
                Set up a custom domain for your white-label platform. Your users will access your platform through this
                domain.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stepValidationError && currentStep === 2 && (
                <p className="text-sm text-destructive">{stepValidationError}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="customDomain">Your site on the web</Label>
                <div className="flex rounded-md border border-input overflow-hidden bg-secondary">
                  <span className="px-3 flex items-center text-muted-foreground text-sm shrink-0 border-r border-border">
                    https://
                  </span>
                  <Input
                    id="customDomain"
                    value={domainData.customDomain}
                    onChange={(e) =>
                      setDomainData({
                        ...domainData,
                        customDomain: e.target.value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, ""),
                        skipDomain: false,
                      })
                    }
                    placeholder="yourcompany.com"
                    className="border-0 rounded-none bg-transparent focus-visible:ring-0"
                    disabled={domainData.skipDomain}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use your main domain (e.g. yourcompany.com). DNS steps for @ and www are shown below.
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <Label className="text-base">Cloudflare Auto-Setup</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically configure DNS records if your domain is on Cloudflare
                    </p>
                  </div>
                  <Switch
                    checked={domainData.useCloudflare}
                    onCheckedChange={(checked) => setDomainData({ ...domainData, useCloudflare: checked })}
                    disabled={domainData.skipDomain || !domainData.customDomain?.trim()}
                    className="shrink-0 ring-2 ring-white/80 border border-white/50 data-[state=unchecked]:bg-input/90"
                  />
                </div>

                {domainData.useCloudflare && !domainData.skipDomain && (
                  <div className="space-y-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    {cfStep === 1 ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label>Cloudflare API Token</Label>
                            <Link
                              href="https://dash.cloudflare.com/profile/api-tokens"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary underline underline-offset-4"
                            >
                              Create / manage API tokens
                            </Link>
                          </div>
                          <Input
                            type="password"
                            value={domainData.cfApiToken}
                            onChange={(e) => setDomainData({ ...domainData, cfApiToken: e.target.value })}
                            placeholder="Paste your token here..."
                            className="bg-background border-border"
                          />
                          <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Requires <code className="text-primary font-mono font-bold">Zone.DNS:Edit</code> permission.
                          </p>
                        </div>
                        {cloudflareError && (
                          <div className="flex items-center gap-2 text-xs text-destructive p-2 bg-destructive/10 rounded">
                            <AlertCircle className="h-3 w-3" />
                            {cloudflareError}
                          </div>
                        )}
                        <Button 
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                          onClick={handleFetchZones}
                          disabled={!domainData.cfApiToken || isCloudflareLoading}
                        >
                          {isCloudflareLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                          Verify & Fetch Zones
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Label>Select Your Cloudflare Zone</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          <Input
                            type="search"
                            value={cfZoneSearch}
                            onChange={(e) => setCfZoneSearch(e.target.value)}
                            placeholder="Search domains…"
                            className="bg-background border-border pl-9"
                            aria-label="Search Cloudflare zones"
                          />
                        </div>
                        <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
                          {filteredCfZones.map((zone) => (
                            <button
                              key={zone.id}
                              type="button"
                              onClick={() => setDomainData({ ...domainData, cfZoneId: zone.id })}
                              className={`text-left rounded-lg border p-3 transition-all ${
                                domainData.cfZoneId === zone.id 
                                  ? "bg-orange-500/10 border-orange-500 ring-1 ring-orange-500" 
                                  : "hover:bg-secondary/50 border-border bg-background"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{zone.name}</span>
                                {domainData.cfZoneId === zone.id && <CheckCircle2 className="h-4 w-4 text-orange-500" />}
                              </div>
                            </button>
                          ))}
                          {cfZones.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground">No zones found</p>
                          )}
                          {cfZones.length > 0 && filteredCfZones.length === 0 && (
                            <p className="text-xs text-center text-muted-foreground">No zones match your search</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setCfStep(1)
                              setCfZoneSearch("")
                            }}
                          >
                            Back
                          </Button>
                          <Button 
                            className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white" 
                            onClick={handleSetupCloudflare}
                            disabled={!domainData.cfZoneId || isCloudflareLoading}
                          >
                            {isCloudflareLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Run Auto-Setup"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!domainData.useCloudflare && domainData.customDomain && !domainData.skipDomain && (
                <DnsSetupHint domain={domainData.customDomain.trim()} />
              )}

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="skipDomain"
                  checked={domainData.skipDomain}
                  onChange={(e) => setDomainData({ ...domainData, skipDomain: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="skipDomain" className="text-sm font-normal cursor-pointer">
                  Skip for now - I'll set up a custom domain later
                </Label>
              </div>

              {domainData.skipDomain && (
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded">
                  You can configure your custom domain anytime from Settings → Domains
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Pay for Studio (streamers) or finish (studio) */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                {isStreamerSetup ? "Pay for Studio" : "Finish setup"}
              </CardTitle>
              {!isStreamerSetup ? (
                <CardDescription>
                  Viewer billing and payouts use the platform administrator’s configuration. Save your company,
                  branding, and domain details to complete this wizard.
                </CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-6">
              {stepValidationError && currentStep === 3 && (
                <p className="text-sm text-destructive">{stepValidationError}</p>
              )}

              {isStreamerSetup && studioUpgradeAvailable && studioSubscription ? (
                <StudioUpgradePaymentPanel
                  pricePaisa={studioSubscription.pricePaisa}
                  walletBalancePaise={walletBalancePaise}
                  selectedGateway={paymentData.studioUpgradePayMethod || "wallet"}
                  onSelectedGatewayChange={(g) =>
                    setPaymentData((p) => ({ ...p, studioUpgradePayMethod: g }))
                  }
                  showActions
                  onPaidSuccess={() => {
                    window.location.assign("/studio/setup?upgraded=1")
                  }}
                />
              ) : !isStreamerSetup ? (
                <p className="text-sm text-muted-foreground rounded-md border border-border bg-muted/30 p-3">
                  When you are ready, click <strong>Complete setup</strong> below to save your profile and branding. You
                  can change these later in Studio settings.
                </p>
              ) : (
                <p className="text-sm text-destructive">
                  Studio subscription is not available from the platform right now. Contact your administrator.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-2 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < SETUP_STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : isStreamerSetup ? (
            <span className="text-xs text-muted-foreground sm:text-sm max-w-md text-right">
              Use the payment actions above to upgrade. After payment, click Complete setup (appears when you are
              Studio).
            </span>
          ) : (
            <Button onClick={handleComplete} disabled={!canProceed() || isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>Completing setup…</>
              ) : (
                <>
                  Complete setup
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
