"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, CheckCircle, Clock, AlertCircle, Trash, Star, RefreshCw, Copy, Cloud, Loader2 } from "lucide-react"
import type { Domain, CloudflareConfig } from "@/lib/types"
import { format } from "date-fns"
import { useState } from "react"

interface DomainCardProps {
  domain: Domain
  onVerify?: (domain: Domain) => void
  onSetPrimary?: (domain: Domain) => void
  onRemove?: (domain: Domain) => void
  showInstructions?: (domain: Domain) => void
  cloudflareConfig?: CloudflareConfig | null
  onDomainUpdate?: (domain: Domain) => void
}

export function DomainCard({ domain, onVerify, onSetPrimary, onRemove, showInstructions, cloudflareConfig, onDomainUpdate }: DomainCardProps) {
  const [configuring, setConfiguring] = useState(false)
  const [cfError, setCfError] = useState("")
  const [cfSuccess, setCfSuccess] = useState(false)

  const isCfConnected = cloudflareConfig?.isConnected === true

  const handleAutoConfigureDns = async () => {
    if (!cloudflareConfig) return
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
          cfApiToken: cloudflareConfig.apiToken,
          cfZoneId: cloudflareConfig.zoneId,
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

  const getStatusBadge = () => {
    switch (domain.verificationStatus) {
      case "verified":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
    }
  }

  const getSslBadge = () => {
    if (domain.sslStatus === "active") {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500/30">
          SSL Active
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        SSL Pending
      </Badge>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{domain.domain}</p>
                {domain.isPrimary && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Added {format(new Date(domain.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {domain.verificationStatus === "verified" && getSslBadge()}
            {domain.dnsConfiguredVia === "cloudflare" && (
              <Badge variant="outline" className="text-[#f48120] border-[#f48120]/30 bg-[#f48120]/5 text-xs">
                <Cloud className="h-3 w-3 mr-1" />
                Cloudflare
              </Badge>
            )}
          </div>
        </div>

        {domain.verificationStatus === "pending" && (
          <div className="space-y-2 mb-3">
            {/* Auto-configure via Cloudflare */}
            {isCfConnected && !cfSuccess && !domain.dnsConfiguredVia && (
              <div className="bg-[#f48120]/5 border border-[#f48120]/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-[#f48120]" />
                    <p className="text-sm font-medium text-foreground">Auto-configure DNS via Cloudflare</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAutoConfigureDns}
                    disabled={configuring}
                    className="bg-[#f48120] hover:bg-[#f48120]/90 text-white"
                  >
                    {configuring ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Configuring</>
                    ) : (
                      <><Cloud className="h-3.5 w-3.5 mr-1" /> Auto-Configure</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  One click to create DNS records on your Cloudflare zone ({cloudflareConfig?.zoneName})
                </p>
              </div>
            )}

            {/* Success message */}
            {cfSuccess && (
              <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-green-600">
                    DNS records configured via Cloudflare. Click "Verify Now" to complete verification.
                  </p>
                </div>
              </div>
            )}

            {/* Error message */}
            {cfError && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{cfError}</p>
                </div>
              </div>
            )}

            {/* Manual fallback message */}
            {!cfSuccess && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-sm text-yellow-600">
                  {isCfConnected && !domain.dnsConfiguredVia
                    ? "Or configure DNS manually using the instructions below."
                    : "DNS verification pending. Please add the required DNS records to verify your domain."}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {domain.verificationStatus === "pending" && (
            <>
              <Button size="sm" variant="outline" onClick={() => showInstructions?.(domain)}>
                <Copy className="h-4 w-4 mr-1" />
                DNS Instructions
              </Button>
              <Button size="sm" onClick={() => onVerify?.(domain)}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Verify Now
              </Button>
            </>
          )}
          {domain.verificationStatus === "verified" && !domain.isPrimary && (
            <Button size="sm" variant="outline" onClick={() => onSetPrimary?.(domain)}>
              <Star className="h-4 w-4 mr-1" />
              Set as Primary
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onRemove?.(domain)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
