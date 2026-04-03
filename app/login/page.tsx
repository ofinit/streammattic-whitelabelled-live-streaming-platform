"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { useBranding } from "@/lib/branding-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, X, Loader2, Mail } from "lucide-react"
import Link from "next/link"

const POLL_INTERVAL_MS = 2000
const DEFAULT_CALLBACK = "/streamer"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isWhiteLabel, studio } = useBranding()
  const [error, setError] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [loginSessionId, setLoginSessionId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [credentialsLoading, setCredentialsLoading] = useState(false)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data) => setGoogleEnabled(!!data?.google))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const authError = searchParams.get("error")
    if (authError) {
      const messages: Record<string, string> = {
        Unauthorized: "Invalid email or password.",
        InvalidLink: "Invalid or expired magic link.",
        ExpiredOrUsed: "This magic link has expired or was already used.",
        AccountSuspended: "Account is suspended.",
      }
      setError(messages[authError] || "Sign-in failed. Please try again.")
      router.replace("/login", { scroll: false })
    }
  }, [searchParams, router])

  useEffect(() => {
    if (!magicLinkSent || !loginSessionId) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/auth/magic-link/session?id=${encodeURIComponent(loginSessionId)}`)
        const data = await res.json().catch(() => ({}))
        if (data.status === "approved" && data.one_time_token) {
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
          const signInResult = await signIn("credentials", {
            email: "__stack__",
            password: data.one_time_token,
            redirect: false,
          })
          if (signInResult?.error) {
            setError("Session creation failed")
            return
          }
          if (data.user?.role === "studio") router.replace("/studio")
          else if (data.user?.role === "admin") router.replace("/admin")
          else router.replace("/streamer")
        } else if (data.status === "expired") {
          if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
          }
          setMagicLinkSent(false)
          setLoginSessionId(null)
          setError("Link expired. Request a new one.")
        }
      } catch {
        // keep polling
      }
    }
    poll()
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [magicLinkSent, loginSessionId, router])

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim() || !password) return
    setCredentialsLoading(true)
    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      })
      if (result?.error) {
        setError("Invalid email or password.")
        return
      }
      router.push(result?.url || DEFAULT_CALLBACK)
    } catch {
      setError("Something went wrong.")
    } finally {
      setCredentialsLoading(false)
    }
  }

  const handleMagicLinkRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Failed to send magic link")
        return
      }
      if (data.login_session_id) {
        setLoginSessionId(data.login_session_id)
        setMagicLinkSent(true)
      } else {
        setError("Invalid response")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setSending(false)
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
              <CardDescription>Sign in with your preferred method. Platform administrators use the admin login.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && <p className="text-sm text-destructive">{error}</p>}

              {!magicLinkSent ? (
                <>
                  {googleEnabled && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        size="lg"
                        onClick={() => signIn("google", { callbackUrl: DEFAULT_CALLBACK })}
                      >
                        Sign in with Google
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                        </div>
                      </div>
                    </>
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
                    <Label htmlFor="login-password">Password</Label>
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
                      {credentialsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in with email and password"}
                    </Button>
                  </form>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or email a magic link (no password)</span>
                    </div>
                  </div>
                  <form onSubmit={handleMagicLinkRequest} className="space-y-3">
                    <Label htmlFor="magic-email" className="sr-only">Email a magic link</Label>
                    <div className="flex gap-2">
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-secondary border-border flex-1"
                        required
                      />
                      <Button type="submit" disabled={sending}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                  <p className="text-sm font-medium text-foreground">Check your email</p>
                  <p className="text-xs text-muted-foreground">
                    We sent a sign-in link to <strong>{email}</strong>. Open it on this device or another (e.g. your phone). This page will log you in automatically when the link is used.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => { setMagicLinkSent(false); setLoginSessionId(null); setError("") }}
                  >
                    Use a different email
                  </Button>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wide">Demo logins</p>
                <p className="text-center text-xs text-muted-foreground">Use these to try the platform. Password: Demo@123</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: "Admin",    role: "admin",    dest: "/admin"    },
                    { label: "Studio",   role: "studio",   dest: "/studio"   },
                    { label: "Streamer", role: "streamer", dest: "/streamer" },
                  ].map(({ label, role, dest }) => (
                  <Button
                    key={role}
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                    disabled={credentialsLoading}
                    onClick={async () => {
                      setError("")
                      setCredentialsLoading(true)
                      try {
                        const res = await fetch("/api/auth/demo-login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ role }),
                        })
                        const data = await res.json().catch(() => ({}))
                        if (!res.ok || !data.ok) {
                          setError(data.error || "Demo login failed. Set DATABASE_URL and run: npm run db:migrate")
                          return
                        }
                        window.location.replace(dest)
                      } catch (e) {
                        setError(e instanceof Error ? e.message : "Something went wrong.")
                      } finally {
                        setCredentialsLoading(false)
                      }
                    }}
                  >
                    {label}
                  </Button>
                  ))}
                </div>
              </div>
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
              <p>Powered by StreamLivee</p>
            </div>
          )}
        </div>
      </div>

      {/* Landing page footer */}
      <footer className="border-t border-border/40 py-12 text-center text-sm text-muted-foreground mt-auto">
        <div className="container mx-auto px-6">
          <BrandedLogo size="sm" className="mx-auto mb-4 opacity-50 grayscale" />
          <p>© {new Date().getFullYear()} StreamLivee Software. All rights reserved.</p>
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
