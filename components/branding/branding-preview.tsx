"use client"

import { Monitor, Smartphone, Camera, Film, Radio, Plane, Star, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Head from "next/head"
import type { Branding, BrandingService } from "@/lib/types"
import { mockBranding } from "@/lib/mock-data"
import { BRANDING_PREVIEW_SESSION_KEY } from "@/lib/branding-preview-session"
import { getThemeConfig } from "@/lib/landing-themes"

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Camera,
  Film,
  Radio,
  Plane,
}

interface BrandingPreviewProps {
  branding: Branding
}

export function BrandingPreview({ branding }: BrandingPreviewProps) {
  if (!branding) {
    return (
      <Card>
        <CardContent className="flex h-96 items-center justify-center text-muted-foreground">
          No branding data available
        </CardContent>
      </Card>
    )
  }

  const services = (branding.services || mockBranding.services || []).filter((s: BrandingService) => s.enabled).slice(0, 4)
  const stats = branding.stats || mockBranding.stats || []
  const testimonial = (branding.testimonials || mockBranding.testimonials || [])[0]
  const theme = getThemeConfig(branding.selectedTheme)
  const fontName = theme.fontFamily.split(",")[0].replace(/'/g, "")
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`

  return (
    <>
      <Head>
         <link rel="stylesheet" href={googleFontsUrl} />
      </Head>
      <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your landing page looks</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                sessionStorage.setItem(BRANDING_PREVIEW_SESSION_KEY, JSON.stringify(branding))
              } catch {
                // ignore quota / private mode
              }
              window.open("/site?preview=draft", "_blank", "noopener,noreferrer")
            }}
          >
            <ExternalLink className="mr-2 h-3.5 w-3.5" />
            Open Full Page
          </Button>
        </div>
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
              <div 
                className="bg-background overflow-y-auto" 
                style={{ 
                  maxHeight: 500,
                  fontFamily: theme.fontFamily 
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/40 px-6 py-3">
                  <div className="flex items-center gap-3">
                    {branding.companyLogo ? (
                      <img src={branding.companyLogo || "/placeholder.svg"} alt="Logo" className="h-6" />
                    ) : (
                      <div className="font-bold text-base" style={{ color: branding.themeColor || theme.primaryColor }}>
                        {branding.brandName}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">Services</span>
                    <span className="text-xs text-muted-foreground">Gallery</span>
                    <span className="text-xs text-muted-foreground">About</span>
                    <span className="rounded px-2.5 py-1 text-xs text-white" style={{ backgroundColor: branding.themeColor || theme.primaryColor }}>
                      Contact Us
                    </span>
                    <span className="rounded border border-border px-2.5 py-1 text-xs text-foreground">
                      Login
                    </span>
                  </div>
                </div>

                {/* Hero */}
                <div className="px-6 py-12 text-center">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                    Photography & Videography
                  </p>
                  <h1 className="text-2xl font-bold mb-2 text-foreground">{branding.metaTitle || branding.brandName}</h1>
                  <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                    {branding.metaDescription || "Professional photography, videography and live streaming services."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="rounded px-3 py-1.5 text-xs text-white" style={{ backgroundColor: branding.themeColor || theme.primaryColor }}>
                      WhatsApp Us
                    </span>
                    <span className="rounded border border-border px-3 py-1.5 text-xs text-foreground">
                      View Our Work
                    </span>
                  </div>
                  {/* Stats */}
                  {stats.length > 0 && (
                    <div className="mt-8 flex items-center justify-center gap-10">
                      {stats.map((stat) => (
                        <div key={stat.id} className="text-center">
                          <div className="text-lg font-bold text-foreground">{stat.value}</div>
                          <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Services Mini */}
                {services.length > 0 && (
                  <div className="px-6 pb-8">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-center" style={{ color: branding.themeColor || theme.primaryColor }}>
                      What We Offer
                    </p>
                    <h2 className="text-base font-bold text-foreground text-center mb-4">Our Services</h2>
                    <div className="grid grid-cols-4 gap-2">
                      {services.map((service: BrandingService) => {
                        const Icon = iconMap[service.icon] || Camera
                        return (
                          <div key={service.id} className="rounded-lg border border-border/50 bg-card p-3 text-center">
                            <Icon className="mx-auto mb-1.5 h-4 w-4" style={{ color: branding.themeColor || theme.primaryColor }} />
                            <p className="text-[10px] font-medium text-foreground">{service.title}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Testimonial Mini */}
                {testimonial && (
                  <div className="px-6 pb-8">
                    <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center">
                      <div className="mb-2 flex items-center justify-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" style={{ color: branding.themeColor || theme.primaryColor }} />
                        ))}
                      </div>
                      <p className="text-xs text-foreground leading-relaxed italic">
                        &ldquo;{testimonial.quote.substring(0, 100)}...&rdquo;
                      </p>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        -- {testimonial.name}, {testimonial.location}
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer Mini */}
                <div className="border-t border-border/40 px-6 py-4 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    &copy; {new Date().getFullYear()} {branding.brandName}. All rights reserved.
                  </p>
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
                <div 
                  className="bg-background overflow-y-auto" 
                  style={{ 
                    maxHeight: 500,
                    fontFamily: theme.fontFamily
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                    <div className="font-bold text-sm" style={{ color: branding.themeColor || theme.primaryColor }}>
                      {branding.brandName}
                    </div>
                    <span className="text-xs text-muted-foreground">Menu</span>
                  </div>

                  {/* Hero */}
                  <div className="px-4 py-8 text-center">
                    <p className="mb-2 text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                      Photography & Videography
                    </p>
                    <h1 className="text-lg font-bold mb-2 text-foreground">{branding.brandName}</h1>
                    <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                      {branding.metaDescription || "Professional photography and live streaming services."}
                    </p>
                    <span className="inline-block rounded px-3 py-1.5 text-xs text-white" style={{ backgroundColor: branding.themeColor || theme.primaryColor }}>
                      Contact Us
                    </span>

                    {/* Stats */}
                    {stats.length > 0 && (
                      <div className="mt-6 flex items-center justify-center gap-6">
                        {stats.slice(0, 3).map((stat) => (
                          <div key={stat.id} className="text-center">
                            <div className="text-base font-bold text-foreground">{stat.value}</div>
                            <div className="text-[9px] text-muted-foreground">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Services Mini */}
                  {services.length > 0 && (
                    <div className="px-4 pb-6">
                      <h2 className="text-xs font-bold text-foreground text-center mb-3">Our Services</h2>
                      <div className="grid grid-cols-2 gap-2">
                        {services.slice(0, 4).map((service: BrandingService) => {
                          const Icon = iconMap[service.icon] || Camera
                          return (
                            <div key={service.id} className="rounded-lg border border-border/50 bg-card p-2.5 text-center">
                              <Icon className="mx-auto mb-1 h-3.5 w-3.5" style={{ color: branding.themeColor || theme.primaryColor }} />
                              <p className="text-[9px] font-medium text-foreground">{service.title}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer Mini */}
                  <div className="border-t border-border/40 px-4 py-3 text-center">
                    <p className="text-[9px] text-muted-foreground">
                      &copy; {new Date().getFullYear()} {branding.brandName}
                    </p>
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
    </>
  )
}
