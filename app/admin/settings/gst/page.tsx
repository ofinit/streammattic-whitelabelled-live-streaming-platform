"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Receipt, Save, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { PlatformGSTSettings } from "@/lib/platform-gst"

const emptySettings = (): PlatformGSTSettings => ({
  gstEnabled: true,
  gstPercentage: 18,
  gstNumber: "",
  panNumber: "",
  businessName: "StreamLivee Platform Pvt Ltd",
  businessAddress: "",
  city: "",
  state: "",
  pincode: "",
  minRechargeRupees: 500,
})

export default function AdminGSTSettingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [gstConfig, setGstConfig] = useState<PlatformGSTSettings>(emptySettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (user?.role !== "admin") return
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/admin/gst", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to load GST settings")
      const data = (await res.json()) as { settings?: PlatformGSTSettings }
      if (data.settings) {
        setGstConfig(data.settings)
      }
    } catch {
      setLoadError("Could not load GST settings.")
    } finally {
      setLoading(false)
    }
  }, [user?.role])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch("/api/admin/gst", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ settings: gstConfig }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(err.error || "Save failed")
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user.role !== "admin") {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen space-y-6">
      <Header title="GST configuration" subtitle="Platform-wide GST for wallet recharges and tax invoices" />

      <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
        {loadError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{loadError}</div>
        )}
        {saveSuccess && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
            <div className="text-emerald-600">✓</div>
            <p className="text-sm text-emerald-700">GST configuration saved.</p>
          </div>
        )}

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>GST settings</CardTitle>
                  <CardDescription>Applied when streamers and studios recharge their wallet</CardDescription>
                </div>
              </div>
              <Button type="submit" disabled={loading || saving} className="gap-2 shrink-0">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Enable GST on wallet recharge</p>
                    <p className="text-sm text-muted-foreground">GST is added on top of the amount to be credited</p>
                  </div>
                  <Switch
                    checked={gstConfig.gstEnabled}
                    onCheckedChange={(checked) => setGstConfig({ ...gstConfig, gstEnabled: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="minRechargeRupees">Minimum wallet recharge (₹)</Label>
                  <Input
                    id="minRechargeRupees"
                    type="number"
                    min={1}
                    step={1}
                    value={gstConfig.minRechargeRupees}
                    onChange={(e) =>
                      setGstConfig({ ...gstConfig, minRechargeRupees: Math.max(1, Number.parseInt(e.target.value, 10) || 1) })
                    }
                    className="bg-secondary border-0 max-w-xs"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstPercentage">GST percentage (%)</Label>
                    <Input
                      id="gstPercentage"
                      type="number"
                      value={gstConfig.gstPercentage}
                      onChange={(e) => setGstConfig({ ...gstConfig, gstPercentage: Number.parseFloat(e.target.value) })}
                      min="0"
                      max="100"
                      step="0.01"
                      className="bg-secondary border-0 max-w-xs"
                      disabled={!gstConfig.gstEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GSTIN</Label>
                    <Input
                      id="gstNumber"
                      value={gstConfig.gstNumber}
                      onChange={(e) => setGstConfig({ ...gstConfig, gstNumber: e.target.value.toUpperCase() })}
                      placeholder="27AABCU9603R1ZX"
                      maxLength={15}
                      className="bg-secondary border-0 font-mono"
                      disabled={!gstConfig.gstEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="panNumber">PAN</Label>
                    <Input
                      id="panNumber"
                      value={gstConfig.panNumber}
                      onChange={(e) => setGstConfig({ ...gstConfig, panNumber: e.target.value.toUpperCase() })}
                      placeholder="AABCU9603R"
                      maxLength={10}
                      className="bg-secondary border-0 font-mono"
                      disabled={!gstConfig.gstEnabled}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Business details (invoice)</CardTitle>
            <CardDescription>Shown on GST invoices for wallet recharges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input
                id="businessName"
                value={gstConfig.businessName}
                onChange={(e) => setGstConfig({ ...gstConfig, businessName: e.target.value })}
                className="bg-secondary border-0"
                disabled={!gstConfig.gstEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Address</Label>
              <Input
                id="businessAddress"
                value={gstConfig.businessAddress}
                onChange={(e) => setGstConfig({ ...gstConfig, businessAddress: e.target.value })}
                className="bg-secondary border-0"
                disabled={!gstConfig.gstEnabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={gstConfig.city}
                  onChange={(e) => setGstConfig({ ...gstConfig, city: e.target.value })}
                  className="bg-secondary border-0"
                  disabled={!gstConfig.gstEnabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={gstConfig.state}
                  onChange={(e) => setGstConfig({ ...gstConfig, state: e.target.value })}
                  className="bg-secondary border-0"
                  disabled={!gstConfig.gstEnabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={gstConfig.pincode}
                onChange={(e) => setGstConfig({ ...gstConfig, pincode: e.target.value })}
                maxLength={6}
                className="bg-secondary border-0 max-w-xs"
                disabled={!gstConfig.gstEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle className="text-amber-800 dark:text-amber-200">How wallet GST works</CardTitle>
                <CardDescription>Users pay taxable value plus GST; only the entered amount is credited to the wallet</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </form>
    </div>
  )
}
