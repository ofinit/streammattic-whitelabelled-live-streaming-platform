"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { CloudflareConfig } from "@/lib/types"
import { Cloud, CheckCircle, AlertCircle, Loader2, ExternalLink, Shield, Trash2 } from "lucide-react"

interface CloudflareZone {
  id: string
  name: string
  status: string
}

interface CloudflareConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentConfig: CloudflareConfig | null
  onSave: (config: CloudflareConfig) => void
  onDisconnect: () => void
}

export function CloudflareConnectDialog({
  open,
  onOpenChange,
  currentConfig,
  onSave,
  onDisconnect,
}: CloudflareConnectDialogProps) {
  const [apiToken, setApiToken] = useState(currentConfig?.apiToken || "")
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [zones, setZones] = useState<CloudflareZone[]>([])
  const [selectedZone, setSelectedZone] = useState<CloudflareZone | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleVerifyToken = async () => {
    if (!apiToken.trim()) {
      setError("Please enter your Cloudflare API token")
      return
    }

    setVerifying(true)
    setError("")
    setVerified(false)
    setZones([])
    setSelectedZone(null)

    try {
      const res = await fetch("/api/domains/cloudflare/verify-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cfApiToken: apiToken.trim() }),
      })

      const data = await res.json()

      if (data.valid) {
        setVerified(true)
        setZones(data.zones || [])
        if (data.zones?.length === 1) {
          setSelectedZone(data.zones[0])
        }
      } else {
        setError(data.error || "Invalid token. Make sure it has Zone:DNS:Edit permissions.")
      }
    } catch {
      setError("Failed to verify token. Please try again.")
    } finally {
      setVerifying(false)
    }
  }

  const handleSave = async () => {
    if (!selectedZone) {
      setError("Please select a zone (domain)")
      return
    }

    setSaving(true)
    const config: CloudflareConfig = {
      apiToken: apiToken.trim(),
      zoneId: selectedZone.id,
      zoneName: selectedZone.name,
      isConnected: true,
      connectedAt: new Date(),
    }
    onSave(config)
    setSaving(false)
    onOpenChange(false)
  }

  const handleDisconnect = () => {
    onDisconnect()
    setApiToken("")
    setVerified(false)
    setZones([])
    setSelectedZone(null)
    setError("")
    onOpenChange(false)
  }

  const resetForm = () => {
    setApiToken("")
    setVerified(false)
    setZones([])
    setSelectedZone(null)
    setError("")
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-[#f48120]" />
            Connect Cloudflare
          </DialogTitle>
          <DialogDescription>
            Connect your Cloudflare account to auto-configure DNS records when adding domains.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current connection status */}
          {currentConfig?.isConnected && (
            <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Connected to Cloudflare</p>
                  <p className="text-xs text-muted-foreground">Zone: {currentConfig.zoneName}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Disconnect
              </Button>
            </div>
          )}

          {/* API Token input */}
          <div className="space-y-2">
            <Label htmlFor="cf-token" className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
              API Token
            </Label>
            <div className="flex gap-2">
              <Input
                id="cf-token"
                type="password"
                placeholder="Enter your Cloudflare API token"
                value={apiToken}
                onChange={(e) => { setApiToken(e.target.value); setVerified(false); setError("") }}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleVerifyToken}
                disabled={verifying || !apiToken.trim()}
                variant="outline"
                className="shrink-0"
              >
                {verifying ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Verifying</>
                ) : verified ? (
                  <><CheckCircle className="h-4 w-4 mr-1 text-green-500" /> Verified</>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Create a token at{" "}
              <a
                href="https://dash.cloudflare.com/profile/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                Cloudflare Dashboard <ExternalLink className="h-3 w-3" />
              </a>
              {" "}with <span className="font-medium text-foreground">Zone:DNS:Edit</span> and{" "}
              <span className="font-medium text-foreground">Zone:Zone:Read</span> permissions.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Zone selector */}
          {verified && zones.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Select Zone (Domain)</Label>
                <p className="text-xs text-muted-foreground">
                  Choose the Cloudflare zone that contains the domains you want to manage.
                </p>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {zones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setSelectedZone(zone)}
                      className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        selectedZone?.id === zone.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-[#f48120]" />
                        <span className="text-sm font-medium">{zone.name}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          zone.status === "active"
                            ? "bg-green-500/10 text-green-500 border-green-500/30 text-xs"
                            : "text-xs"
                        }
                      >
                        {zone.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {verified && zones.length === 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
              <p className="text-sm text-yellow-600">
                No active zones found. Make sure your API token has access to at least one domain in Cloudflare.
              </p>
            </div>
          )}

          {/* How it works */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <h4 className="text-xs font-medium text-foreground mb-1.5">How it works</h4>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>When you add a domain, click "Auto-Configure DNS" to create records instantly</li>
              <li>Records are set to DNS-only (grey cloud) for Vercel compatibility</li>
              <li>Your API token is stored locally and only sent when configuring DNS</li>
              <li>You can disconnect anytime -- existing DNS records stay in place</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false) }}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!verified || !selectedZone || saving}
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving</>
              ) : (
                "Save Connection"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
