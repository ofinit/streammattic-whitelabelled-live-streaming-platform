"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Loader2, Building2, Wallet, Settings, Palette } from "lucide-react"
import type { Reseller } from "@/lib/types"

interface ResellerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialData?: Partial<Reseller>
  onSubmit: (data: ResellerFormData) => Promise<void>
}

export interface ResellerFormData {
  // Company Info
  companyName: string
  email: string
  password?: string
  phone: string
  address?: string

  // Platform Branding
  platformName: string
  primaryColor: string
  secondaryColor: string

  // Wallet & Commission
  initialBalance: number
  commissionRate: number

  // Settings
  maxUsers: number
  maxEvents: number
  canSetCustomPricing: boolean
  canManagePaymentGateway: boolean
  autoApproveOrders: boolean

  // Status
  status: string
}

export function ResellerFormDialog({ open, onOpenChange, mode, initialData, onSubmit }: ResellerFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("company")

  const [formData, setFormData] = useState<ResellerFormData>({
    companyName: initialData?.name || "",
    email: initialData?.email || "",
    password: "",
    phone: initialData?.phone || "",
    address: "",
    platformName: initialData?.branding?.platformName || "",
    primaryColor: initialData?.branding?.primaryColor || "#10b981",
    secondaryColor: initialData?.branding?.secondaryColor || "#059669",
    initialBalance: initialData?.walletBalance || 0,
    commissionRate: 20,
    maxUsers: 100,
    maxEvents: 1000,
    canSetCustomPricing: true,
    canManagePaymentGateway: true,
    autoApproveOrders: false,
    status: initialData?.status || "active",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof ResellerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add New Reseller" : "Edit Reseller"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new white-label reseller account with their own branding and users."
              : "Update reseller account settings and permissions."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Company</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="wallet" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Company Info Tab */}
            <TabsContent value="company" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Company Information</CardTitle>
                  <CardDescription>Basic details about the reseller company</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company / Business Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      placeholder="e.g., LiveStream Pro Media"
                      className="bg-secondary border-0"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Admin Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="admin@company.com"
                        className="bg-secondary border-0"
                        required
                        disabled={mode === "edit"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        className="bg-secondary border-0"
                      />
                    </div>
                  </div>

                  {mode === "create" && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Temporary Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="bg-secondary border-0"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-muted-foreground">
                        Reseller will be prompted to change this on first login
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Full business address..."
                      className="bg-secondary border-0 min-h-[80px]"
                    />
                  </div>

                  {mode === "edit" && (
                    <div className="space-y-2">
                      <Label htmlFor="status">Account Status</Label>
                      <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                        <SelectTrigger className="bg-secondary border-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Platform Branding</CardTitle>
                  <CardDescription>Initial branding settings (reseller can customize later)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Platform Name *</Label>
                    <Input
                      id="platformName"
                      value={formData.platformName}
                      onChange={(e) => updateField("platformName", e.target.value)}
                      placeholder="e.g., StreamPro, LiveCast, EventHub"
                      className="bg-secondary border-0"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This will appear in the header and emails for their users
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => updateField("primaryColor", e.target.value)}
                          className="w-12 h-10 p-1 bg-secondary border-0 cursor-pointer"
                        />
                        <Input
                          value={formData.primaryColor}
                          onChange={(e) => updateField("primaryColor", e.target.value)}
                          className="bg-secondary border-0 font-mono uppercase"
                          placeholder="#10b981"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => updateField("secondaryColor", e.target.value)}
                          className="w-12 h-10 p-1 bg-secondary border-0 cursor-pointer"
                        />
                        <Input
                          value={formData.secondaryColor}
                          onChange={(e) => updateField("secondaryColor", e.target.value)}
                          className="bg-secondary border-0 font-mono uppercase"
                          placeholder="#059669"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="pt-4">
                    <Label className="mb-2 block">Preview</Label>
                    <div
                      className="rounded-lg p-4 flex items-center gap-3"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold">
                        {formData.platformName.charAt(0) || "P"}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{formData.platformName || "Platform Name"}</p>
                        <p className="text-white/70 text-sm">White-label streaming</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wallet Tab */}
            <TabsContent value="wallet" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Wallet & Commission</CardTitle>
                  <CardDescription>Initial balance and commission settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialBalance">Initial Wallet Balance</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        id="initialBalance"
                        type="number"
                        min="0"
                        step="100"
                        value={formData.initialBalance}
                        onChange={(e) => updateField("initialBalance", Number.parseFloat(e.target.value) || 0)}
                        className="bg-secondary border-0 pl-8"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Credit this amount to the reseller's wallet on creation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <div className="relative">
                      <Input
                        id="commissionRate"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.commissionRate}
                        onChange={(e) => updateField("commissionRate", Number.parseFloat(e.target.value) || 0)}
                        className="bg-secondary border-0 pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Platform commission on each package sold by this reseller
                    </p>
                  </div>

                  {/* Commission Example */}
                  <div className="rounded-lg bg-secondary/50 p-4 space-y-2">
                    <p className="text-sm font-medium">Example Calculation</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>If reseller sells a package for ₹1,000:</p>
                      <p>
                        • Platform commission: ₹{((1000 * formData.commissionRate) / 100).toFixed(0)} (
                        {formData.commissionRate}%)
                      </p>
                      <p>• Reseller keeps: ₹{(1000 - (1000 * formData.commissionRate) / 100).toFixed(0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Limits & Permissions</CardTitle>
                  <CardDescription>Resource limits and feature permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxUsers">Max Users</Label>
                      <Input
                        id="maxUsers"
                        type="number"
                        min="1"
                        value={formData.maxUsers}
                        onChange={(e) => updateField("maxUsers", Number.parseInt(e.target.value) || 1)}
                        className="bg-secondary border-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxEvents">Max Events / Month</Label>
                      <Input
                        id="maxEvents"
                        type="number"
                        min="1"
                        value={formData.maxEvents}
                        onChange={(e) => updateField("maxEvents", Number.parseInt(e.target.value) || 1)}
                        className="bg-secondary border-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Custom Pricing</p>
                        <p className="text-sm text-muted-foreground">
                          Allow reseller to set custom prices for their users
                        </p>
                      </div>
                      <Switch
                        checked={formData.canSetCustomPricing}
                        onCheckedChange={(checked) => updateField("canSetCustomPricing", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Payment Gateway Access</p>
                        <p className="text-sm text-muted-foreground">
                          Allow reseller to configure their own payment gateways
                        </p>
                      </div>
                      <Switch
                        checked={formData.canManagePaymentGateway}
                        onCheckedChange={(checked) => updateField("canManagePaymentGateway", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-Approve Orders</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve user orders (skip manual approval)
                        </p>
                      </div>
                      <Switch
                        checked={formData.autoApproveOrders}
                        onCheckedChange={(checked) => updateField("autoApproveOrders", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create Reseller" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
