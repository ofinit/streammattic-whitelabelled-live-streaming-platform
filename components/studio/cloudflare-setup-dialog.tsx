"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Zap, CheckCircle2, AlertCircle } from "lucide-react"
import type { CloudflareZone } from "@/lib/cloudflare-dns"

interface CloudflareSetupDialogProps {
  domainId: string
  domainName: string
  onSuccess: () => void
}

export function CloudflareSetupDialog({ domainId, domainName, onSuccess }: CloudflareSetupDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Token, 2: Zone Select, 3: Success
  
  const [apiToken, setApiToken] = useState("")
  const [zones, setZones] = useState<CloudflareZone[]>([])
  const [selectedZoneId, setSelectedZoneId] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFetchZones = async () => {
    if (!apiToken) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/studio/cloudflare/setup?apiToken=${apiToken}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch zones")
      
      setZones(data.zones || [])
      if (data.zones?.length > 0) {
        // Try to find matching zone automatically
        const match = data.zones.find((z: CloudflareZone) => domainName.endsWith(z.name))
        if (match) setSelectedZoneId(match.id)
      }
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid API Token")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunSetup = async () => {
    if (!selectedZoneId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/studio/cloudflare/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken, zoneId: selectedZoneId, domainId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Setup failed")
      
      setStep(3)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create DNS records")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
          <Zap className="h-4 w-4 text-primary" />
          Auto-Configure DNS (Cloudflare)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cloudflare Auto-Setup</DialogTitle>
          <DialogDescription>
            We will automatically add the required A and TXT records to your Cloudflare account.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Cloudflare API Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Paste your API token here..."
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="bg-secondary/50 border-0"
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Requires <code className="text-primary">Zone.DNS:Edit</code> permission. 
                  <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noreferrer" className="underline ml-1">Create one here</a>.
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-xs text-destructive p-2 bg-destructive/10 rounded border border-destructive/20">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              )}
              <Button className="w-full" onClick={handleFetchZones} disabled={!apiToken || isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Fetch Zones"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Cloudflare Zone</Label>
                <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                  {zones.map((zone) => (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedZoneId === zone.id 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "hover:bg-secondary/50 border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{zone.name}</span>
                        {selectedZoneId === zone.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                    </div>
                  ))}
                  {zones.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No active zones found in this account.</p>
                  )}
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded border border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep(1)} disabled={isLoading}>
                  Back
                </Button>
                <Button className="flex-[2]" onClick={handleRunSetup} disabled={!selectedZoneId || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Start Setup Now"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold">Successfully Configured!</h3>
                <p className="text-sm text-muted-foreground">
                  We&apos;ve added the root (@) and www A-records, as well as the verification TXT.
                  Propogation usually takes 5-15 minutes.
                </p>
              </div>
              <Button className="w-full" onClick={() => setOpen(false)}>Done</Button>
            </div>
          )}
        </div>

        {step !== 3 && (
          <DialogFooter className="text-[10px] text-muted-foreground text-center sm:text-left pt-2 border-t">
            * Warning: This will replace any existing A records for this domain on Cloudflare.
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
