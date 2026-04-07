"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Globe, CheckCircle, Clock, AlertCircle, Copy, ExternalLink, ShieldCheck, Loader2 } from "lucide-react"
import type { Studio, Domain } from "@/lib/types"
import {
  getPlatformARecordDisplay,
  getPlatformCnameDisplay,
  getVerificationTxtHostDisplay,
} from "@/lib/platform-dns"
import { CloudflareSetupDialog } from "@/components/studio/cloudflare-setup-dialog"

interface StudioDomainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studio: Studio
}

export function StudioDomainDialog({ open, onOpenChange, studio }: StudioDomainDialogProps) {
  const [domainRecord, setDomainRecord] = useState<Domain | null>(null)
  const [domain, setDomain] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isFetchingDomain, setIsFetchingDomain] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const verificationToken = domainRecord?.verificationToken || `streamlivee-verify-${studio.id}`

  const [platformA, setPlatformA] = useState(getPlatformARecordDisplay())
  const [platformCname, setPlatformCname] = useState(getPlatformCnameDisplay())

  useEffect(() => {
    if (!open) return
    setIsFetchingDomain(true)
    fetch(`/api/admin/users/${studio.id}/domains`)
      .then(res => res.json())
      .then(data => {
        if (data.domains && data.domains.length > 0) {
          const primary = data.domains.find((d: Domain) => d.isPrimary) || data.domains[0]
          setDomainRecord(primary)
          setDomain(primary.domain)
        }
      })
      .catch(console.error)
      .finally(() => setIsFetchingDomain(false))
    if (!open) return
    fetch("/api/settings")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.settings) return
        const ipRow = data.settings.find((s: any) => s.key === "platform_a_record_ip")
        const cnameRow = data.settings.find((s: any) => s.key === "platform_cname_target")
        const domainRow = data.settings.find((s: any) => s.key === "platform_domain")

        if (ipRow?.value) setPlatformA(String(ipRow.value))
        
        // If there's a custom CNAME target (like a load balancer), use it.
        // Otherwise, if there's a platform domain, CNAMEs usually point to that domain.
        if (cnameRow?.value) {
          setPlatformCname(String(cnameRow.value))
        } else if (domainRow?.value) {
          setPlatformCname(String(domainRow.value))
        }
      })
      .catch(console.error)
  }, [open])

  // Root/apex domains can't use CNAME, so we need an A record + CNAME for www
  const displayDomain = domain || "yourbrand.com"
  const txtHost = getVerificationTxtHostDisplay(displayDomain)
  const dnsRecords = [
    { type: "A", name: displayDomain, value: platformA, purpose: "Points root domain to platform" },
    { type: "CNAME", name: `www.${displayDomain}`, value: platformCname, purpose: "Points www to platform" },
    { type: "TXT", name: txtHost, value: verificationToken, purpose: "Verifies domain ownership" },
  ]

  const handleSave = async () => {
    if (!domain.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${studio.id}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setDomainRecord(data.domain)
      } else {
        alert(data.error || "Failed to save domain")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      // In production, trigger server-side DNS verification
      const res = await fetch(`/api/studio/domains/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId: domainRecord?.id }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh domain state
        fetch(`/api/admin/users/${studio.id}/domains`)
          .then(res => res.json())
          .then(d => {
            if (d.domains) {
              const primary = d.domains.find((x: Domain) => x.id === domainRecord?.id)
              setDomainRecord(primary || d.domains[0])
            }
          })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusBadge = () => {
    if (!domainRecord) return null
    if (domainRecord.verificationStatus === "verified" && domainRecord.sslStatus === "active") {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }
    if (domainRecord.verificationStatus === "pending") {
      return (
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Domain Configuration
          </DialogTitle>
          <DialogDescription>
            Configure custom domain for {studio.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Current Status */}
          {isFetchingDomain ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : domainRecord && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Globe className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{domainRecord.domain}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(domainRecord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              {getStatusBadge()}
            </div>
          )}

          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="domain-input">Custom Domain</Label>
            <div className="flex gap-2">
              <Input
                id="domain-input"
                placeholder="e.g. clientbrand.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
              <Button onClick={handleSave} disabled={!domain.trim() || isSaving}>
                {isSaving ? "Saving..." : domainRecord ? "Update" : "Set Domain"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the root domain (e.g. clientbrand.com). Both the root domain and www will be configured.
            </p>
          </div>

          {/* DNS Records */}
          {domain && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>DNS Records (Studio must add these)</Label>
                {domainRecord && (
                  <CloudflareSetupDialog 
                    domainId={domainRecord.id} 
                    domainName={domainRecord.domain} 
                    onSuccess={() => {}} 
                  />
                )}
              </div>
              <div className="space-y-2">
                {dnsRecords.map((record, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">{record.type}</Badge>
                      <span className="text-xs text-muted-foreground">{record.purpose}</span>
                    </div>
                    <div className="grid grid-cols-[60px_1fr_32px] gap-2 items-center">
                      <span className="text-xs font-medium text-muted-foreground">Name</span>
                      <code className="text-xs bg-background rounded px-2 py-1 truncate">{record.name}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(record.name, `name-${i}`)}
                      >
                        <Copy className={`h-3 w-3 ${copied === `name-${i}` ? "text-green-500" : ""}`} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-[60px_1fr_32px] gap-2 items-center">
                      <span className="text-xs font-medium text-muted-foreground">Value</span>
                      <code className="text-xs bg-background rounded px-2 py-1 truncate">{record.value}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(record.value, `value-${i}`)}
                      >
                        <Copy className={`h-3 w-3 ${copied === `value-${i}` ? "text-green-500" : ""}`} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SSL & Verification */}
          {domainRecord && (
            <div className="space-y-3">
              <Label>Verification & SSL</Label>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">SSL Certificate</p>
                    <p className="text-xs text-muted-foreground">
                      {domainRecord.sslStatus === "active" ? "Auto-provisioned via Let's Encrypt" : "Will be provisioned after DNS verification"}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={domainRecord.sslStatus === "active" ? "border-green-500/30 text-green-500" : "border-yellow-500/30 text-yellow-600"}>
                  {domainRecord.sslStatus === "active" ? "Active" : "Pending"}
                </Badge>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={handleVerify}
                disabled={isVerifying}
              >
                {isVerifying ? "Verifying DNS..." : "Verify DNS Records"}
              </Button>
            </div>
          )}

          {/* Quick link */}
          {domainRecord?.verificationStatus === "verified" && (
            <a
              href={`https://${domainRecord.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Visit {domainRecord.domain}
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
