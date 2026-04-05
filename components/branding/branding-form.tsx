"use client"

import { useState, useEffect } from "react"
import { Save, Upload, ExternalLink, Palette, Globe, FileText, Mail, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Branding } from "@/lib/types"

interface BrandingFormProps {
  branding: Branding
  onSave: (branding: Partial<Branding>) => void
}

export function BrandingForm({ branding, onSave }: BrandingFormProps) {
  const [formData, setFormData] = useState<Branding>(branding || {
    brandName: "",
    themeColor: "#10b981",
    accentColor: "#059669",
    metaTitle: "",
    metaDescription: "",
  } as Branding)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (branding) {
      setFormData(branding)
    }
  }, [branding])

  const handleUpload = async (file: File, field: keyof Branding) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("subdir", "branding")
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setFormData((prev: any) => ({ ...prev, [field]: data.url }))
      }
    } catch (err) {
      console.error("Upload failed", err)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/studio/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        onSave(formData)
      }
    } catch (err) {
      console.error("Save failed", err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Legal</span>
          </TabsTrigger>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">SMTP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>Customize your platform appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="Your Brand Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title (SEO)</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle || ""}
                    onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                    placeholder="Page title for search engines"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description (SEO)</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription || ""}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  placeholder="Brief description for search engines"
                  rows={2}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-4">
                    {formData.companyLogo ? (
                      <img
                        src={formData.companyLogo || "/placeholder.svg"}
                        alt="Logo"
                        className="h-16 object-contain"
                      />
                    ) : (
                      <div className="h-16 w-32 rounded bg-muted" />
                    )}
                    <Input
                      type="file"
                      id="logo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(file, "companyLogo")
                      }}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </label>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo (Dark Mode)</Label>
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-4 bg-zinc-900">
                    {formData.companyLogoDark ? (
                      <img
                        src={formData.companyLogoDark || "/placeholder.svg"}
                        alt="Logo Dark"
                        className="h-16 object-contain"
                      />
                    ) : (
                      <div className="h-16 w-32 rounded bg-zinc-800" />
                    )}
                    <Input
                      type="file"
                      id="logo-dark-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(file, "companyLogoDark")
                      }}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="logo-dark-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </label>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-4">
                    {formData.favicon ? (
                      <img
                        src={formData.favicon || "/placeholder.svg"}
                        alt="Favicon"
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                    <Input
                      type="file"
                      id="favicon-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(file, "favicon")
                      }}
                    />
                    <Button variant="outline" size="sm" asChild>
                      <label htmlFor="favicon-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </label>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="themeColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="themeColor"
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={formData.themeColor}
                      onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="accentColor"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      placeholder="#059669"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  value={formData.googleAnalyticsId || ""}
                  onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Support Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp || ""}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your full business address"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">Facebook</Label>
                  <Input
                    id="facebookUrl"
                    value={formData.facebookUrl || ""}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">Instagram</Label>
                  <Input
                    id="instagramUrl"
                    value={formData.instagramUrl || ""}
                    onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter / X</Label>
                  <Input
                    id="twitterUrl"
                    value={formData.twitterUrl || ""}
                    onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl || ""}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn</Label>
                  <Input
                    id="linkedinUrl"
                    value={formData.linkedinUrl || ""}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Legal Pages</CardTitle>
              <CardDescription>Terms, privacy, and other legal content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aboutUs">About Us</Label>
                <Textarea
                  id="aboutUs"
                  value={formData.aboutUs || ""}
                  onChange={(e) => setFormData({ ...formData, aboutUs: e.target.value })}
                  placeholder="Tell your customers about your company..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termsConditions">Terms & Conditions</Label>
                <Textarea
                  id="termsConditions"
                  value={formData.termsConditions || ""}
                  onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                  placeholder="Your terms and conditions..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacyPolicy">Privacy Policy</Label>
                <Textarea
                  id="privacyPolicy"
                  value={formData.privacyPolicy || ""}
                  onChange={(e) => setFormData({ ...formData, privacyPolicy: e.target.value })}
                  placeholder="Your privacy policy..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refundPolicy">Refund Policy</Label>
                <Textarea
                  id="refundPolicy"
                  value={formData.refundPolicy || ""}
                  onChange={(e) => setFormData({ ...formData, refundPolicy: e.target.value })}
                  placeholder="Your refund policy..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SMTP Configuration</CardTitle>
              <CardDescription>Configure your own mail server to send emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={formData.smtpHost || ""}
                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                    placeholder="smtp.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={formData.smtpPort || ""}
                    onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value) || 0 })}
                    placeholder="587"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP User</Label>
                  <Input
                    id="smtpUser"
                    value={formData.smtpUser || ""}
                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={formData.smtpPassword || ""}
                    onChange={(e) => setFormData({ ...formData, smtpPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtpFromEmail">From Email</Label>
                  <Input
                    id="smtpFromEmail"
                    value={formData.smtpFromEmail || ""}
                    onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.target.value })}
                    placeholder="noreply@yourbrand.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpFromName">From Name</Label>
                  <Input
                    id="smtpFromName"
                    value={formData.smtpFromName || ""}
                    onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                    placeholder="Your Brand Support"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="smtpSecure" 
                   checked={formData.smtpSecure ?? true} 
                   onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
                   className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                 />
                 <Label htmlFor="smtpSecure">Use TLS/SSL (Secure)</Label>
              </div>
              <div className="rounded-lg bg-primary/5 p-4 flex gap-3 items-start">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  Once SMTP is configured correctly, all system emails (welcome, orders, event alerts) will be sent using your custom mail server instead of the platform default.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
