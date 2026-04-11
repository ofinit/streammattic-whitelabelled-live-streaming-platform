"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { useBranding } from "@/lib/branding-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

const DEFAULT_CALLBACK = "/streamer"

function pathForRole(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "studio":
      return "/studio"
    default:
      return DEFAULT_CALLBACK
  }
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const { isWhiteLabel, studio, branding } = useBranding()
  const [error, setError] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const resetOk = searchParams.get("reset") === "ok"

  useEffect(() => {
    const authError = searchParams.get("error")
    if (authError) {
      const messages: Record<string, string> = {
        Unauthorized: "Invalid email or password.",
        InvalidLink: "Invalid or expired link.",
        ExpiredOrUsed: "This link has expired or was already used.",
        AccountSuspended: "Account is suspended.",
      }
      setError(messages[authError] || "Sign-in failed. Please try again.")
      router.replace("/login", { scroll: false })
    }
  }, [searchParams, router])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || !password) return
    setCredentialsLoading(true)
    try {
      const user = await login(email.trim(), password)
      if (!user) {
        setError("Invalid email or password.")
        return
      }
      // Defer navigation so AuthContext commit runs before streamer layout’s guard (would send anonymous users to /).
      const dest = pathForRole(user.role)
      window.setTimeout(() => router.replace(dest), 0)
    } catch {
      setError("Something went wrong.")
    } finally {
      setCredentialsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandedLogo size="lg" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Platform</Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</Link>
            <Link href="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
          <button type="button" className="md:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col pt-24 pb-16">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Sign in to your account</CardTitle>
              <CardDescription>Use your email and password. Platform administrators use the admin login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {resetOk && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Password updated. Sign in with your new password.
                </p>
              )}

              <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
                <Button type="submit" className="w-full" size="lg" disabled={credentialsLoading}>
                  {credentialsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Admin? <Link href="/admin/login" className="text-primary hover:underline">Sign in here</Link>
              </p>
            </CardContent>
          </Card>

          {isWhiteLabel && studio && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by {branding.brandName}</p>
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-border/40 py-12 text-center text-sm text-muted-foreground mt-auto">
        <div className="container mx-auto px-6">
          <BrandedLogo size="sm" className="mx-auto mb-4 opacity-50 grayscale" />
          <p>© {new Date().getFullYear()} {branding.brandName} Software. All rights reserved.</p>
          <p className="mt-2">
            Powered by{" "}
            <a href="https://www.ofinit.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              OfinIT
            </a>
          </p>
        </div>
      </footer>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <LoginPageContent />
    </Suspense>
  )
}
