"use client"

import { Monitor, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { Branding } from "@/lib/types"

interface BrandingPreviewProps {
  branding: Branding
}

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
        <CardDescription>See how your branding looks</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="desktop">
          <TabsList className="mb-4">
            <TabsTrigger value="desktop" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Desktop
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop">
            <div className="rounded-lg border overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-zinc-700 rounded px-3 py-1 text-xs text-zinc-400">https://your-domain.com</div>
                </div>
              </div>

              {/* Preview Content */}
              <div className="bg-background p-6" style={{ minHeight: 300 }}>
                {/* Header */}
                <div
                  className="flex items-center justify-between border-b pb-4 mb-6"
                  style={{ borderColor: branding.themeColor + "33" }}
                >
                  <div className="flex items-center gap-3">
                    {branding.companyLogo ? (
                      <img src={branding.companyLogo || "/placeholder.svg"} alt="Logo" className="h-8" />
                    ) : (
                      <div className="font-bold text-xl" style={{ color: branding.themeColor }}>
                        {branding.brandName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">Events</span>
                    <span className="text-sm text-muted-foreground">Pricing</span>
                    <Button size="sm" style={{ backgroundColor: branding.themeColor }}>
                      Login
                    </Button>
                  </div>
                </div>

                {/* Hero */}
                <div className="text-center py-8">
                  <h1 className="text-3xl font-bold mb-2">{branding.metaTitle || branding.brandName}</h1>
                  <p className="text-muted-foreground mb-6">
                    {branding.metaDescription || "Professional live streaming for your events"}
                  </p>
                  <Button style={{ backgroundColor: branding.themeColor }}>Get Started</Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mobile">
            <div className="flex justify-center">
              <div className="w-[320px] rounded-[2rem] border-4 border-zinc-800 overflow-hidden">
                {/* Phone Notch */}
                <div className="bg-zinc-800 h-6 flex justify-center">
                  <div className="w-20 h-4 bg-black rounded-b-xl" />
                </div>

                {/* Preview Content */}
                <div className="bg-background p-4" style={{ minHeight: 400 }}>
                  {/* Header */}
                  <div
                    className="flex items-center justify-between border-b pb-3 mb-4"
                    style={{ borderColor: branding.themeColor + "33" }}
                  >
                    <div className="font-bold" style={{ color: branding.themeColor }}>
                      {branding.brandName}
                    </div>
                    <Button size="sm" variant="ghost" style={{ color: branding.themeColor }}>
                      Menu
                    </Button>
                  </div>

                  {/* Hero */}
                  <div className="text-center py-6">
                    <h1 className="text-xl font-bold mb-2">{branding.brandName}</h1>
                    <p className="text-sm text-muted-foreground mb-4">Professional live streaming</p>
                    <Button size="sm" style={{ backgroundColor: branding.themeColor }}>
                      Get Started
                    </Button>
                  </div>
                </div>

                {/* Phone Bottom */}
                <div className="bg-zinc-800 h-4" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
