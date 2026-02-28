"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, CheckCircle, Clock, AlertCircle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { mockDomains } from "@/lib/mock-data"

export default function ResellerDomainsPage() {
  const existingDomain = mockDomains.find((d) => d.userId === "reseller-1" && d.isPrimary)
  const [domain, setDomain] = useState(existingDomain?.domain || "")
  const [savedDomain, setSavedDomain] = useState(existingDomain || null)
  const [isEditing, setIsEditing] = useState(!existingDomain)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = () => {
    if (!domain.trim()) return
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSavedDomain({
        id: existingDomain?.id || `dom-${Date.now()}`,
        userId: "reseller-1",
        domain: domain.trim(),
        verificationToken: `streammattic-verify-${Math.random().toString(36).substring(2, 34)}`,
        verificationStatus: "pending",
        sslStatus: "pending",
        isPrimary: true,
        createdAt: existingDomain?.createdAt || new Date(),
      })
      setIsEditing(false)
      setIsSaving(false)
    }, 1000)
  }

  const handleRemove = () => {
    if (confirm("Are you sure you want to remove your custom domain?")) {
      setSavedDomain(null)
      setDomain("")
      setIsEditing(true)
    }
  }

  const getStatusBadge = () => {
    if (!savedDomain) return null
    if (savedDomain.verificationStatus === "verified" && savedDomain.sslStatus === "active") {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active
        </Badge>
      )
    }
    if (savedDomain.verificationStatus === "pending") {
      return (
        <Badge variant="outline" className="border-yellow-500/30 text-yellow-600">
          <Clock className="h-3 w-3 mr-1" />
          Pending Verification
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        <AlertCircle className="h-3 w-3 mr-1" />
        Verification Failed
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custom Domain</h1>
        <p className="text-muted-foreground">Link a custom domain for your white-label platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Your Custom Domain
          </CardTitle>
          <CardDescription>
            Enter your custom domain below. Once submitted, our admin team will configure DNS, SSL, and
            verification for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {savedDomain && !isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{savedDomain.domain}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {savedDomain.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                </div>
              </div>

              {savedDomain.verificationStatus === "pending" && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Verification in Progress</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our admin team is setting up DNS records and SSL for your domain.
                        This usually takes 24-48 hours. You will be notified once your domain is active.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {savedDomain.verificationStatus === "verified" && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Domain Active</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your custom domain is fully configured and active. All your event pages and branding are
                        accessible at your domain.
                      </p>
                      <a
                        href={`https://${savedDomain.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
                      >
                        Visit your domain
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Change Domain
                </Button>
                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleRemove}>
                  Remove Domain
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <div className="flex gap-3">
                  <Input
                    id="domain"
                    placeholder="e.g. live.yourbrand.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="max-w-md"
                  />
                  <Button onClick={handleSave} disabled={!domain.trim() || isSaving}>
                    {isSaving ? "Saving..." : savedDomain ? "Update Domain" : "Link Domain"}
                  </Button>
                  {savedDomain && (
                    <Button variant="outline" onClick={() => { setIsEditing(false); setDomain(savedDomain.domain) }}>
                      Cancel
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the domain or subdomain you want to use for your platform. Our team will handle the technical setup.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Submit Your Domain</p>
                <p className="text-sm text-muted-foreground">
                  Enter the custom domain you want to use for your branded streaming platform.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Admin Configures DNS</p>
                <p className="text-sm text-muted-foreground">
                  Our admin team sets up DNS records, SSL certificates, and verifies your domain.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Domain Goes Live</p>
                <p className="text-sm text-muted-foreground">
                  Once verified, your platform and all event pages will be accessible at your custom domain.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
