"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ExternalLink,
  Zap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Studio } from "@/lib/types"
import type { CloudflareZone } from "@/lib/cloudflare-dns"
import {
  getRoutingTargetDisplayForDomain,
  getVerificationTxtHostDisplay,
  parseDomainLayout,
} from "@/lib/platform-dns"

const SETUP_STEPS = [
  { id: "company", label: "Company Profile", icon: Building2 },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "domain", label: "Custom Domain", icon: Globe },
  { id: "payment", label: "Payment Gateway", icon: CreditCard },
]

function DnsSetupHint({ domain }: { domain: string }) {
  const { isSubdomain, subdomain } = parseDomainLayout(domain)
  const routing = getRoutingTargetDisplayForDomain(domain)
  const txtHost = getVerificationTxtHostDisplay(domain)
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
          <p>
            <span className="text-muted-foreground">A record (@):</span> {domain} → {routing}
          </p>
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
  const { user } = useAuth()
  const studioUser = user as unknown as Studio

  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [companyData, setCompanyData] = useState({
    companyName: studioUser?.name || "",
    tagline: "",
    email: studioUser?.email || "",
    phone: studioUser?.phone || "",
    address: "",
    website: "",
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
  })

  const progress = ((currentStep + 1) / SETUP_STEPS.length) * 100

  const handleNext = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const [isCloudflareLoading, setIsCloudflareLoading] = useState(false)
  const [cloudflareError, setCloudflareError] = useState<string | null>(null)
  const [cfZones, setCfZones] = useState<CloudflareZone[]>([])
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
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/studio/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyData,
          brandingData,
          domainData,
          paymentData,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to complete setup")
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
      const res = await fetch(`/api/studio/cloudflare/setup?apiToken=${domainData.cfApiToken}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch zones")
      setCfZones(data.zones || [])
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          apiToken: domainData.cfApiToken, 
          zoneId: domainData.cfZoneId, 
          domainId: "platform" // During onboarding, we treat this as the station domain
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
    switch (currentStep) {
      case 0:
        return companyData.companyName && companyData.email
      case 1:
        return brandingData.platformName && brandingData.primaryColor
      case 2:
        return domainData.customDomain || domainData.skipDomain
      case 3:
        return paymentData.gateway || paymentData.skipPayment
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-foreground">Setup Your Platform</h1>
          <p className="text-muted-foreground mt-1">
            Complete these steps to configure your white-label streaming platform
          </p>

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
                    <span className="hidden sm:inline font-medium">{step.label}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyData.companyName}
                    onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                    placeholder="Your Company Name"
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={companyData.tagline}
                    onChange={(e) => setCompanyData({ ...companyData, tagline: e.target.value })}
                    placeholder="Your streaming solution"
                    className="bg-secondary border-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Support Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                    placeholder="support@yourcompany.com"
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Support Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="bg-secondary border-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={companyData.address}
                  onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                  placeholder="Full business address for invoices..."
                  className="bg-secondary border-0 min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Company Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  placeholder="https://yourcompany.com"
                  className="bg-secondary border-0"
                />
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
              <div className="space-y-2">
                <Label htmlFor="customDomain">Your Custom Domain</Label>
                <Input
                  id="customDomain"
                  value={domainData.customDomain}
                  onChange={(e) =>
                    setDomainData({
                      ...domainData,
                      customDomain: e.target.value,
                      skipDomain: false,
                    })
                  }
                  placeholder="live.yourcompany.com"
                  className="bg-secondary border-0"
                  disabled={domainData.skipDomain}
                />
                <p className="text-xs text-muted-foreground">
                  Use a subdomain like live.yourcompany.com or streaming.yourcompany.com
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Cloudflare Auto-Setup</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically configure DNS records if your domain is on Cloudflare
                    </p>
                  </div>
                  <button
                    onClick={() => setDomainData({ ...domainData, useCloudflare: !domainData.useCloudflare })}
                    disabled={domainData.skipDomain || !domainData.customDomain}
                    className={`h-6 w-11 rounded-full transition-colors relative ${
                      domainData.useCloudflare ? "bg-primary" : "bg-secondary"
                    } ${(domainData.skipDomain || !domainData.customDomain) ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`h-4 w-4 rounded-full bg-white absolute top-1 transition-all ${
                      domainData.useCloudflare ? "left-6" : "left-1"
                    }`} />
                  </button>
                </div>

                {domainData.useCloudflare && !domainData.skipDomain && (
                  <div className="space-y-4 p-4 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    {cfStep === 1 ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Cloudflare API Token</Label>
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
                        <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
                          {cfZones.map((zone) => (
                            <button
                              key={zone.id}
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
                          {cfZones.length === 0 && <p className="text-xs text-center text-muted-foreground">No zones found</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" onClick={() => setCfStep(1)}>Back</Button>
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

        {/* Step 4: Payment Gateway */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Payment Gateway
              </CardTitle>
              <CardDescription>
                Connect a payment gateway to collect payments from your users. You'll need API keys from your gateway
                provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: "razorpay",
                    name: "Razorpay",
                    description: "Popular in India",
                    logo: "₹",
                  },
                  {
                    id: "instamojo",
                    name: "Instamojo",
                    description: "Easy setup",
                    logo: "iM",
                  },
                  {
                    id: "cashfree",
                    name: "Cashfree",
                    description: "Low fees",
                    logo: "CF",
                  },
                ].map((gateway) => (
                  <button
                    key={gateway.id}
                    onClick={() =>
                      setPaymentData({
                        ...paymentData,
                        gateway: gateway.id as any,
                        skipPayment: false,
                      })
                    }
                    disabled={paymentData.skipPayment}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      paymentData.gateway === gateway.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    } ${paymentData.skipPayment ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-lg font-bold mb-3">
                      {gateway.logo}
                    </div>
                    <p className="font-medium">{gateway.name}</p>
                    <p className="text-sm text-muted-foreground">{gateway.description}</p>
                  </button>
                ))}
              </div>

              {paymentData.gateway && !paymentData.skipPayment && (
                <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
                  <p className="font-medium text-sm">Configure {paymentData.gateway}</p>
                  <p className="text-sm text-muted-foreground">
                    You'll need to add your API keys after completing the setup wizard.
                  </p>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <ExternalLink className="h-4 w-4" />
                    Get {paymentData.gateway.charAt(0).toUpperCase() + paymentData.gateway.slice(1)} API Keys
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4">
                <input
                  type="checkbox"
                  id="skipPayment"
                  checked={paymentData.skipPayment}
                  onChange={(e) => setPaymentData({ ...paymentData, skipPayment: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="skipPayment" className="text-sm font-normal cursor-pointer">
                  Skip for now - I'll configure payment gateway later
                </Label>
              </div>

              {paymentData.skipPayment && (
                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded">
                  Your users won't be able to make online payments until you configure a gateway. You can add wallet
                  credits manually instead.
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
          ) : (
            <Button onClick={handleComplete} disabled={!canProceed() || isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>Completing Setup...</>
              ) : (
                <>
                  Complete Setup
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
