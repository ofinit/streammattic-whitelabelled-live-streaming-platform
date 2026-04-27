"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Globe, CheckCircle, Clock, AlertCircle, ExternalLink, Info, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CloudflareSetupDialog } from "@/components/studio/cloudflare-setup-dialog"
import {
  CAMERA_INGEST_DNS_CONFIGURE_ENV_HINT,
  getCameraIngestDnsRecordForDomain,
  getVerificationTxtHostDisplay,
  parseDomainLayout,
} from "@/lib/platform-dns"

export default function StudioDomainsPage() {
  const [domain, setDomain] = useState("")
  const [savedDomain, setSavedDomain] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const [platformSettings, setPlatformSettings] = useState({
    platformName: "StreamLivee",
    platformIp: "— (set in admin settings)",
    platformCnameTarget: "",
  })

  useEffect(() => {
    // 1. Fetch domain if exists
    // 2. Fetch platform settings
    const fetchData = async () => {
      try {
        const [domainRes, settingsRes] = await Promise.all([
          fetch("/api/studio/domains"),
          fetch("/api/settings")
        ])
        
        if (domainRes.ok) {
          const domainData = await domainRes.json()
          if (domainData.domains?.length > 0) {
            const primary = domainData.domains.find((d: any) => d.isPrimary) || domainData.domains[0]
            setSavedDomain(primary)
            setDomain(primary.domain)
          } else {
            setIsEditing(true)
          }
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          const name = settingsData.settings?.find((s: any) => s.key === "platform_name")?.value
          const ip = settingsData.settings?.find((s: any) => s.key === "platform_a_record_ip")?.value
          const target = settingsData.settings?.find((s: any) => s.key === "platform_cname_target")?.value
          setPlatformSettings({
            platformName: name || "StreamLivee",
            platformIp: ip || "— (set in admin settings)",
            platformCnameTarget: target || "",
          })
        }
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async () => {
    if (!domain.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/studio/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setSavedDomain(data.domain)
        setIsEditing(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const getStatusBadge = () => {
    if (!savedDomain) return null
    if (savedDomain.dnsStatus === "verified" && savedDomain.sslEnabled) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="border-yellow-500/30 text-yellow-600 italic">
        <Clock className="h-3 w-3 mr-1" />
        Checking Propagation
      </Badge>
    )
  }

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Clock className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">White-Label Domain</h1>
          <p className="text-muted-foreground">Host {platformSettings.platformName} on your own brand domain</p>
        </div>
        {savedDomain && (
          <CloudflareSetupDialog 
            domainId={savedDomain.id} 
            domainName={savedDomain.domain} 
            onSuccess={() => {/* Refresh logic */}} 
          />
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Custom Domain Configuration
          </CardTitle>
          <CardDescription>
            Enter your domain and point it to our server using the records below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {savedDomain && !isEditing ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl border-dashed border-2 bg-secondary/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{savedDomain.domain}</p>
                    <div className="flex gap-2 mt-1">
                      {getStatusBadge()}
                      {savedDomain.sslEnabled && <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-0">SSL: Valid</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(true)}>Change</Button>
                </div>
              </div>

              {/* DNS Instructions */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  <h3 className="font-bold">Required DNS Records</h3>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                    {(() => {
                      const { isSubdomain, subdomain } = parseDomainLayout(savedDomain.domain)
                      const cameraIngestRecord = getCameraIngestDnsRecordForDomain(savedDomain.domain)
                      
                      if (isSubdomain) {
                        return (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              <div>
                                <p className="text-muted-foreground uppercase mb-1">Type</p>
                                <p className="font-mono bg-secondary px-2 py-0.5 rounded w-fit">A</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground uppercase mb-1">Host/Name</p>
                                <p className="font-mono">{subdomain}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground uppercase mb-1">Value/Points To</p>
                                <p className="font-mono text-primary font-bold">{platformSettings.platformIp}</p>
                              </div>
                            </div>
                            {cameraIngestRecord ? (
                              <>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                  <div>
                                    <p className="text-muted-foreground uppercase mb-1">Type</p>
                                    <p className="font-mono bg-secondary px-2 py-0.5 rounded w-fit">{cameraIngestRecord.type}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground uppercase mb-1">Camera Upload Host</p>
                                    <p className="font-mono">{cameraIngestRecord.host}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground uppercase mb-1">Value/Points To</p>
                                    <p className="font-mono text-primary font-bold">{cameraIngestRecord.value}</p>
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </>
                        )
                      }
                      
                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-muted-foreground uppercase mb-1">Type</p>
                              <p className="font-mono bg-secondary px-2 py-0.5 rounded w-fit">A</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase mb-1">Host/Name</p>
                              <p className="font-mono">@ (or leave empty)</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase mb-1">Value/Points To</p>
                              <p className="font-mono text-primary font-bold">{platformSettings.platformIp}</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <p className="text-muted-foreground uppercase mb-1">Type</p>
                              <p className="font-mono bg-secondary px-2 py-0.5 rounded w-fit">A</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase mb-1">Host/Name</p>
                              <p className="font-mono">www</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground uppercase mb-1">Value/Points To</p>
                              <p className="font-mono text-primary font-bold">{platformSettings.platformIp}</p>
                            </div>
                          </div>
                          {cameraIngestRecord ? (
                            <>
                              <Separator />
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                <div>
                                  <p className="text-muted-foreground uppercase mb-1">Type</p>
                                  <p className="font-mono bg-secondary px-2 py-0.5 rounded w-fit">{cameraIngestRecord.type}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground uppercase mb-1">Camera Upload Host</p>
                                  <p className="font-mono">{cameraIngestRecord.host}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground uppercase mb-1">Value/Points To</p>
                                  <p className="font-mono text-primary font-bold">{cameraIngestRecord.value}</p>
                                </div>
                              </div>
                            </>
                          ) : null}
                        </>
                      )
                    })()}
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground uppercase mb-1">Type</p>
                        <p className="font-mono bg-secondary px-2 py-0.5 rounded w-fit">TXT</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase mb-1">Host/Name</p>
                        <p className="font-mono">{getVerificationTxtHostDisplay(savedDomain.domain)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground uppercase mb-1">Value/Points To</p>
                        <p className="font-mono text-emerald-500 break-all">{savedDomain.verificationToken}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    * Ensure proxy (Cloudflare orange cloud) is **disabled** while points are being verified.
                    Camera FTP/SFTP DNS is optional and appears when `CLIENT_GALLERY_CAMERA_INGEST_HOST` is configured.
                    {` ${CAMERA_INGEST_DNS_CONFIGURE_ENV_HINT}`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Your Platform Domain</Label>
                <div className="flex gap-3">
                  <Input
                    id="domain"
                    placeholder="e.g. live.yourbrand.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="max-w-md bg-secondary/50 border-0"
                  />
                  <Button onClick={handleSave} disabled={!domain.trim() || isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedDomain ? "Update" : "Link Domain"}
                  </Button>
                  {savedDomain && (
                    <Button variant="ghost" onClick={() => { setIsEditing(false); setDomain(savedDomain.domain) }}>
                      Cancel
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Do not include http:// or https://. Example: <span className="text-foreground">live.mybrand.com</span>
                </p>
              </div>

              <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                <p className="text-sm">
                  <strong>Note:</strong> Once linked, you will need to update your DNS records at your domain registrar (GoDaddy, Namecheap, etc.) to point to our infrastructure.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Propagation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-sm text-muted-foreground font-mono">Status: Monitoring DNS for {savedDomain?.domain || "unconfigured"}</p>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-lg">
              <p>DNS changes can take up to 24 hours to propagate globally, but usually happen within 15 minutes. Our system checks every hour and will automatically enable SSL once the records match.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
