"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Receipt, Save, AlertCircle } from "lucide-react"
import { getGSTConfig } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"

export default function AdminGSTSettingsPage() {
  const { user } = useAuth()
  const existingConfig = user ? getGSTConfig(user.id, "admin") : null

  const [gstConfig, setGstConfig] = useState({
    gstEnabled: existingConfig?.gstEnabled || true,
    gstPercentage: existingConfig?.gstPercentage || 18,
    gstNumber: existingConfig?.gstNumber || "",
    panNumber: existingConfig?.panNumber || "",
    businessName: existingConfig?.businessName || "StreamMattic Platform Pvt Ltd",
    businessAddress: existingConfig?.businessAddress || "",
    city: existingConfig?.city || "",
    state: existingConfig?.state || "",
    pincode: existingConfig?.pincode || "",
  })

  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Saving GST configuration:", gstConfig)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen">
      <Header
        title="GST Configuration"
        subtitle="Manage GST settings for wallet top-ups and transactions"
        action={
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        }
      />

      <div className="p-6 space-y-6 max-w-3xl">
        {saveSuccess && (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
            <div className="text-emerald-600">✓</div>
            <p className="text-sm text-emerald-700">GST configuration saved successfully!</p>
          </div>
        )}

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>GST Settings</CardTitle>
                <CardDescription>Configure GST collection for all wallet transactions on the platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Enable GST Collection</p>
                <p className="text-sm text-muted-foreground">Collect GST on all wallet top-ups and transactions</p>
              </div>
              <Switch
                checked={gstConfig.gstEnabled}
                onCheckedChange={(checked) => setGstConfig({ ...gstConfig, gstEnabled: checked })}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gstPercentage">GST Percentage (%)</Label>
                <Input
                  id="gstPercentage"
                  type="number"
                  value={gstConfig.gstPercentage}
                  onChange={(e) => setGstConfig({ ...gstConfig, gstPercentage: Number.parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.01"
                  className="bg-secondary border-0"
                  disabled={!gstConfig.gstEnabled}
                />
                <p className="text-xs text-muted-foreground">Standard rate is 18% in India</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GSTIN (GST Number)</Label>
                <Input
                  id="gstNumber"
                  value={gstConfig.gstNumber}
                  onChange={(e) => setGstConfig({ ...gstConfig, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="27AABCU9603R1ZX"
                  maxLength={15}
                  className="bg-secondary border-0 font-mono"
                  disabled={!gstConfig.gstEnabled}
                />
                <p className="text-xs text-muted-foreground">15-character GST identification number</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number</Label>
                <Input
                  id="panNumber"
                  value={gstConfig.panNumber}
                  onChange={(e) => setGstConfig({ ...gstConfig, panNumber: e.target.value.toUpperCase() })}
                  placeholder="AABCU9603R"
                  maxLength={10}
                  className="bg-secondary border-0 font-mono"
                  disabled={!gstConfig.gstEnabled}
                />
                <p className="text-xs text-muted-foreground">10-character PAN card number</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Business Details</CardTitle>
            <CardDescription>Information that will appear on GST invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={gstConfig.businessName}
                onChange={(e) => setGstConfig({ ...gstConfig, businessName: e.target.value })}
                className="bg-secondary border-0"
                disabled={!gstConfig.gstEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Input
                id="businessAddress"
                value={gstConfig.businessAddress}
                onChange={(e) => setGstConfig({ ...gstConfig, businessAddress: e.target.value })}
                placeholder="123 Business Park, Andheri East"
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
                  placeholder="Maharashtra"
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
                placeholder="400001"
                maxLength={6}
                className="bg-secondary border-0"
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
                <CardTitle className="text-amber-700">How GST Works</CardTitle>
                <CardDescription>Important information about GST calculation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">User enters:</strong> Amount they want in their wallet (e.g., ₹500)
            </p>
            <p>
              <strong className="text-foreground">System calculates:</strong> GST is added on top (₹500 × 18% = ₹90)
            </p>
            <p>
              <strong className="text-foreground">User pays:</strong> Total amount (₹500 + ₹90 = ₹590)
            </p>
            <p>
              <strong className="text-foreground">Wallet credited:</strong> Exactly what user wanted (₹500)
            </p>
            <Separator className="my-3 bg-amber-500/20" />
            <p className="text-xs">
              GST invoices are automatically generated for all transactions when GST is enabled. Invoices include GSTIN,
              CGST/SGST breakdown, and comply with Indian GST regulations.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
