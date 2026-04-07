"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import { useBranding } from "@/lib/branding-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { ArrowLeft, Globe, Palette, Building2, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Branding, User } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function WhiteLabelDemoPage() {
  const { branding, studio, isWhiteLabel, setDemoStudio } = useBranding()
  const [selectedStudioId, setSelectedStudioId] = useState<string>("")
  const [isApplying, setIsApplying] = useState(false)

  const { data: studiosData, isLoading: isLoadingStudios } = useSWR("/api/admin/users?role=studio", fetcher)
  const studios = useMemo(() => studiosData?.users || [], [studiosData])

  const handleApply = async () => {
    if (!selectedStudioId) {
       setDemoStudio(null)
       return
    }

    setIsApplying(true)
    try {
      const res = await fetch(`/api/branding?userId=${selectedStudioId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.branding) {
           // The API returns camelCase branding, BrandingProvider expects Branding type
           // studio_branding table has matching fields but some might need mapping
           const b = data.branding
           const customBranding: Branding = {
              id: b.id,
              userId: b.userId,
              brandName: b.platformName || "Untitled",
              companyLogo: b.logo,
              companyLogoDark: b.companyLogoDark,
              themeColor: b.primaryColor || "#10b981",
              accentColor: b.accentColor || b.secondaryColor || "#059669",
              email: b.supportEmail,
              phone: b.supportPhone,
              metaTitle: b.metaTitle,
              metaDescription: b.metaDescription,
              hasGatewayConfig: !!b.preferredGateway,
              createdAt: new Date(b.createdAt),
              updatedAt: new Date(b.updatedAt),
           }
           setDemoStudio(customBranding)
        }
      }
    } catch (err) {
      console.error("Failed to fetch branding for demo:", err)
    } finally {
      setIsApplying(false)
    }
  }

  const handleReset = () => {
    setSelectedStudioId("")
    setDemoStudio(null)
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
            Test how the platform appears with different studio brandings from the database.
          </p>
        </div>

        {/* Current State */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Current Active Branding
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
          </CardContent>
        </Card>

        {/* Studio Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Select Studio from Database
            </CardTitle>
            <CardDescription>Choose a studio to preview their white-label experience</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingStudios ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <RadioGroup value={selectedStudioId} onValueChange={setSelectedStudioId} className="space-y-4">
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
                        <p className="font-semibold">StreamLivee (Platform Default)</p>
                        <p className="text-sm text-muted-foreground">Default platform branding</p>
                      </div>
                    </div>
                  </Label>
                </div>

                {studios.map((s: User) => (
                  <div
                    key={s.id}
                    className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
                  >
                    <RadioGroupItem value={s.id} id={s.id} />
                    <Label htmlFor={s.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: s.branding?.primaryColor || "#eee" }}
                        >
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{s.branding?.platformName || s.name}</p>
                          <p className="text-sm text-muted-foreground"> {s.email} </p>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            <div className="flex gap-3 mt-6">
              <Button onClick={handleApply} className="flex-1" disabled={isApplying}>
                {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Apply Branding
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview UI Elements */}
        <Card>
          <CardHeader>
            <CardTitle>UI Elements Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-3">Buttons (Themed)</p>
              <div className="flex flex-wrap gap-3">
                <Button>Primary Action</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-3">Badges</p>
              <div className="flex flex-wrap gap-2">
                <Badge>Live Now</Badge>
                <Badge variant="secondary">Draft</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
