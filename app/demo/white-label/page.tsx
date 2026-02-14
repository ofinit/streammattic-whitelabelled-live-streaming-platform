"use client"

import { useState } from "react"
import { useBranding } from "@/lib/branding-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { mockResellers } from "@/lib/mock-data"
import { ArrowLeft, Globe, Palette, Building2 } from "lucide-react"
import Link from "next/link"

export default function WhiteLabelDemoPage() {
  const { branding, reseller, isWhiteLabel, setDemoReseller } = useBranding()
  const [selectedReseller, setSelectedReseller] = useState<string>(reseller?.id || "")

  const handleApply = () => {
    setDemoReseller(selectedReseller || null)
  }

  const handleReset = () => {
    setSelectedReseller("")
    setDemoReseller(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with current branding */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <BrandedLogo size="md" />
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">White-Label Demo</h1>
          <p className="text-muted-foreground">
            Test how the platform appears with different reseller brandings. Select a reseller to see their colors and
            branding applied.
          </p>
        </div>

        {/* Current State */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Current Branding
              </CardTitle>
              {isWhiteLabel && <Badge variant="secondary">White-Label Active</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Brand Name</p>
                <p className="font-semibold">{branding.brandName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Theme Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-md border border-border"
                    style={{ backgroundColor: branding.themeColor }}
                  />
                  <span className="font-mono text-sm">{branding.themeColor}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Accent Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-md border border-border"
                    style={{ backgroundColor: branding.accentColor || branding.themeColor }}
                  />
                  <span className="font-mono text-sm">{branding.accentColor || branding.themeColor}</span>
                </div>
              </div>
            </div>

            {reseller && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Reseller</p>
                <p className="font-semibold">{reseller.name}</p>
                <p className="text-sm text-muted-foreground">{reseller.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reseller Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Select Reseller Branding
            </CardTitle>
            <CardDescription>Choose a reseller to preview their white-label experience</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedReseller} onValueChange={setSelectedReseller} className="space-y-4">
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="" id="platform" />
                <Label htmlFor="platform" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#10b981" }}
                    >
                      <Globe className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">StreamMattic (Platform Default)</p>
                      <p className="text-sm text-muted-foreground">Default platform branding</p>
                    </div>
                  </div>
                </Label>
              </div>

              {mockResellers.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                >
                  <RadioGroupItem value={r.id} id={r.id} />
                  <Label htmlFor={r.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: r.branding.primaryColor }}
                      >
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{r.branding.platformName}</p>
                        <p className="text-sm text-muted-foreground">
                          {r.name} - {r.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: r.branding.primaryColor }}
                          title="Primary"
                        />
                        <div
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: r.branding.secondaryColor }}
                          title="Secondary"
                        />
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex gap-3 mt-6">
              <Button onClick={handleApply} className="flex-1">
                Apply Branding
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Branding Preview</CardTitle>
            <CardDescription>See how UI elements appear with the current branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Buttons */}
            <div>
              <p className="text-sm font-medium mb-3">Buttons</p>
              <div className="flex flex-wrap gap-3">
                <Button>Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            {/* Badges */}
            <div>
              <p className="text-sm font-medium mb-3">Badges</p>
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            {/* Cards */}
            <div>
              <p className="text-sm font-medium mb-3">Example Cards</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Active Events</p>
                        <p className="text-2xl font-bold text-primary">12</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">Total Users</p>
                        <p className="text-2xl font-bold">156</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
