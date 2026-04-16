"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import { PLATFORM_LANDING_BRANDING } from "@/lib/platform-landing-defaults"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"

export default function SiteLoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuth()
  const { branding: contextBranding } = useBranding()

  // Merge branding
  const branding = {
    ...PLATFORM_LANDING_BRANDING,
    ...contextBranding,
  }

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const user = await login(email, password)
    if (user) {
      const dest =
        user.role === "admin" ? "/admin" : user.role === "studio" ? "/studio" : "/streamer"
      window.setTimeout(() => router.push(dest), 0)
    } else {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="dark flex min-h-screen flex-col bg-background">
      {/* Back to site link */}
      <div className="px-6 py-4">
        <Link href="/site" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to {branding.brandName}
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md space-y-8">
          {/* Brand Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            {branding.companyLogo ? (
              <img
                src={branding.companyLogoDark || branding.companyLogo}
                alt={branding.brandName}
                className="h-12"
              />
            ) : (
              <span className="text-3xl font-bold" style={{ color: branding.themeColor }}>
                {branding.brandName}
              </span>
            )}
            <p className="text-muted-foreground">Sign in to manage your events and dashboard</p>
          </div>

          {/* Login Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your credentials to access the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary border-0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-0"
                    required
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  style={{ backgroundColor: branding.themeColor, color: "#fff" }}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/50">
            Powered by StreamLivee
          </p>
        </div>
      </div>
    </div>
  )
}
