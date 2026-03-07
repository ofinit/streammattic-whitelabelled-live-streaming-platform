"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Copy, Check, Cloud, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import type { Domain, DNSRecord } from "@/lib/types"

interface DNSInstructionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  domain: Domain | null
  cfAvailable?: boolean
  onDomainUpdate?: (domain: Domain) => void
}

export function DNSInstructionsDialog({ open, onOpenChange, domain, cfAvailable, onDomainUpdate }: DNSInstructionsDialogProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [configuring, setConfiguring] = useState(false)
  const [cfSuccess, setCfSuccess] = useState(false)
  const [cfError, setCfError] = useState("")

  const handleAutoConfigureDns = async () => {
    if (!domain) return
    setConfiguring(true)
    setCfError("")
    setCfSuccess(false)

    try {
      const res = await fetch("/api/domains/cloudflare/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.domain,
          verificationToken: domain.verificationToken,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCfSuccess(true)
        onDomainUpdate?.({
          ...domain,
          dnsConfiguredVia: "cloudflare",
          cfRecordIds: data.records?.map((r: { id: string }) => r.id) || [],
        })
      } else {
        setCfError(data.error || "Failed to configure DNS records")
      }
    } catch {
      setCfError("Network error. Please try again.")
    } finally {
      setConfiguring(false)
    }
  }

  if (!domain) return null

  // Detect if the domain is a subdomain (e.g., live.example.com) or root domain (example.com)
  const domainParts = domain.domain.split(".")
  const isSubdomain = domainParts.length > 2
  const subdomain = isSubdomain ? domainParts.slice(0, -2).join(".") : ""

  // Vercel's actual DNS configuration values
  const vercelCname = "cname.vercel-dns.com"
  const vercelIp = "76.76.21.21"

  // Build records based on domain type
  const records: DNSRecord[] = isSubdomain
    ? [
        // Subdomain setup (e.g., live.example.com)
        { type: "CNAME", host: subdomain, value: vercelCname, ttl: 3600 },
        { type: "TXT", host: `_vercel.${subdomain}`, value: domain.verificationToken, ttl: 3600 },
      ]
    : [
        // Root domain setup (e.g., example.com)
        { type: "A", host: "@", value: vercelIp, ttl: 3600 },
        { type: "TXT", host: "_vercel", value: domain.verificationToken, ttl: 3600 },
      ]

  const copyValue = (value: string, id: string) => {
    navigator.clipboard.writeText(value)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>DNS Configuration for {domain.domain}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cloudflare Auto-Configure */}
          {cfAvailable && domain.verificationStatus === "pending" && !domain.dnsConfiguredVia && (
            <div className="rounded-lg border border-[#f48120]/30 bg-[#f48120]/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-[#f48120]" />
                  <h4 className="font-medium text-foreground">Auto-Configure via Cloudflare</h4>
                </div>
                <Badge variant="outline" className="text-[#f48120] border-[#f48120]/30 text-xs">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Click below to automatically create the required DNS records via Cloudflare. No setup needed.
              </p>
              {cfSuccess ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  DNS records configured. Close this dialog and click "Verify Now" to complete.
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleAutoConfigureDns}
                    disabled={configuring}
                    className="bg-[#f48120] hover:bg-[#f48120]/90 text-white"
                  >
                    {configuring ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Configuring DNS</>
                    ) : (
                      <><Cloud className="h-4 w-4 mr-1" /> Auto-Configure DNS Records</>
                    )}
                  </Button>
                  {cfError && (
                    <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {cfError}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Already configured via CF */}
          {domain.dnsConfiguredVia === "cloudflare" && (
            <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600">DNS records were auto-configured via Cloudflare.</p>
            </div>
          )}

          {/* Separator if both sections shown */}
          {cfAvailable && domain.verificationStatus === "pending" && !domain.dnsConfiguredVia && (
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or configure manually</span>
              <Separator className="flex-1" />
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            Add the following DNS records at your domain registrar ({isSubdomain ? "subdomain" : "root domain"} setup). 
            These records connect your domain to Vercel and verify ownership.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Host/Name</th>
                  <th className="px-4 py-2 text-left font-medium">Value/Target</th>
                  <th className="px-4 py-2 text-left font-medium">TTL</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3">
                      <Badge variant="outline">{record.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{record.host}</td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate" title={record.value}>
                      {record.value}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.ttl}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyValue(record.value, `${record.type}-${idx}`)}
                      >
                        {copied === `${record.type}-${idx}` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Step-by-step guide */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Step-by-Step Guide</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              {isSubdomain ? (
                <>
                  <li>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</li>
                  <li>Navigate to DNS management for <span className="font-mono text-foreground">{domainParts.slice(-2).join(".")}</span></li>
                  <li>Add a <span className="font-semibold text-foreground">CNAME</span> record with host <span className="font-mono text-foreground">{subdomain}</span> pointing to <span className="font-mono text-foreground">{vercelCname}</span></li>
                  <li>Add a <span className="font-semibold text-foreground">TXT</span> record with host <span className="font-mono text-foreground">_vercel.{subdomain}</span> and the verification value above</li>
                  <li>Wait for DNS propagation (usually 5-30 minutes, up to 48 hours)</li>
                  <li>Come back here and click <span className="font-semibold text-foreground">Verify Now</span></li>
                </>
              ) : (
                <>
                  <li>Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)</li>
                  <li>Navigate to DNS management for <span className="font-mono text-foreground">{domain.domain}</span></li>
                  <li>Add an <span className="font-semibold text-foreground">A</span> record with host <span className="font-mono text-foreground">@</span> pointing to <span className="font-mono text-foreground">{vercelIp}</span></li>
                  <li>Add a <span className="font-semibold text-foreground">TXT</span> record with host <span className="font-mono text-foreground">_vercel</span> and the verification value above</li>
                  <li>Wait for DNS propagation (usually 5-30 minutes, up to 48 hours)</li>
                  <li>Come back here and click <span className="font-semibold text-foreground">Verify Now</span></li>
                </>
              )}
            </ol>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Important Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>DNS propagation typically takes 5-30 minutes but can take up to 48 hours</li>
              <li>The TXT record is required for domain ownership verification</li>
              <li>SSL certificate will be automatically provisioned by Vercel after verification</li>
              <li>If using Cloudflare, set the CNAME proxy status to <span className="font-semibold text-foreground">DNS only</span> (grey cloud) during setup</li>
              <li>Do not remove these records after verification -- they are needed for ongoing routing</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
