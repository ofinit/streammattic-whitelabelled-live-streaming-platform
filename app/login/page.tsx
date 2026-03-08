"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { useBranding } from "@/lib/branding-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Palette, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading, switchRole } = useAuth()
  const { branding, isWhiteLabel, studio } = useBranding()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  // Show error when redirected from NextAuth (e.g. /api/auth/error)
  useEffect(() => {
    const authError = searchParams.get("error")
    if (authError) {
      setError(authError === "Unauthorized" ? "Invalid email or password." : "Sign-in failed. Please try again.")
      router.replace("/login", { scroll: false })
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const success = await login(email, password)
    if (success) {
      // Redirect based on role
      if (email === "admin@streamlivee.com" || email === "admin@streammattic.com") {
        router.push("/admin")
      } else if (email.includes("livestream.pro") || email.includes("streamhub")) {
        router.push("/studio")
      } else {
        router.push("/streamer")
      }
    } else {
      setError("Invalid email or password")
    }
  }

  const handleDemoLogin = (role: "admin" | "studio" | "streamer") => {
    switchRole(role)
    switch (role) {
      case "admin":
        router.push("/admin")
        break
      case "studio":
        router.push("/studio")
        break
      case "streamer":
        router.push("/streamer")
        break
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-4">
      <div className="w-full max-w-7xl mx-auto mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-2">
            <BrandedLogo size="lg" showText={false} />
            <h1 className="text-2xl font-bold text-foreground">{branding.brandName}</h1>
            <p className="text-muted-foreground text-center">
              {isWhiteLabel ? `Welcome to ${branding.brandName}` : "White-Label Live Streaming Platform - Pay Per Event"}
            </p>
          </div>

          {/* Login Form */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Sign in to your account</CardTitle>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary border-0"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>

              {!isWhiteLabel && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with demo</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Button variant="outline" onClick={() => handleDemoLogin("admin")} className="border-border">
                      Admin
                    </Button>
                    <Button variant="outline" onClick={() => handleDemoLogin("studio")} className="border-border">
                      Studio
                    </Button>
                    <Button variant="outline" onClick={() => handleDemoLogin("streamer")} className="border-border">
                      Streamer
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {!isWhiteLabel && (
            <Card className="border-border bg-card/50">
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium text-foreground">Demo Credentials</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="text-foreground">Admin:</span> admin@streamlivee.com
                  </p>
                  <p>
                    <span className="text-foreground">Studio:</span> john@livestream.pro
                  </p>
                  <p>
                    <span className="text-foreground">User:</span> alice@example.com
                  </p>
                  <p className="text-muted-foreground/70">Any password works for demo</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isWhiteLabel && (
            <div className="text-center">
              <Link href="/demo/white-label">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Palette className="h-4 w-4 mr-2" />
                  Try White-Label Demo
                </Button>
              </Link>
            </div>
          )}

          {/* Show studio info when in white-label mode */}
          {isWhiteLabel && studio && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by StreamLivee</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
