"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BrandedLogo } from "@/components/branding/branded-logo"
import { useBranding } from "@/lib/branding-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Menu, X, Loader2, ChevronsUpDown } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { IndianStateCombobox } from "@/components/auth/indian-state-combobox"
import {
  PHONE_DIAL_OPTIONS,
  flagEmojiFromIso,
} from "@/lib/phone-country-codes"
import { cn } from "@/lib/utils"

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

export default function SignupPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { isWhiteLabel, studio, branding } = useBranding()
  const [error, setError] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phoneDial, setPhoneDial] = useState("+91")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [dialOpen, setDialOpen] = useState(false)
  const [billingState, setBillingState] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedDial = useMemo(
    () => PHONE_DIAL_OPTIONS.find((o) => o.dial === phoneDial) ?? PHONE_DIAL_OPTIONS[0],
    [phoneDial],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match")
      return
    }
    if (!billingState) {
      setError("Please select your state")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          phoneDial,
          phoneLocal,
          billingState,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Registration failed")
        setLoading(false)
        return
      }
      const loggedIn = await login(email.trim(), password)
      if (!loggedIn) {
        setError("Account created. Please sign in.")
        setLoading(false)
        router.push("/login")
        return
      }
      setLoading(false)
      window.setTimeout(() => router.replace(pathForRole(loggedIn.role)), 0)
    } catch {
      setError("Something went wrong")
      setLoading(false)
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
            <Link href="/signup">
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
                <CardTitle>Create an account</CardTitle>
                <CardDescription>Enter your details to get started.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Full name as per PAN / bank"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-secondary border-border"
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile number</Label>
                    <div className="flex gap-2">
                      <Popover open={dialOpen} onOpenChange={setDialOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={dialOpen}
                            className={cn(
                              "h-10 w-[118px] shrink-0 justify-between px-2 font-mono tabular-nums bg-secondary border-border",
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="text-lg leading-none" aria-hidden>
                                {flagEmojiFromIso(selectedDial.iso)}
                              </span>
                              <span>{phoneDial}</span>
                            </span>
                            <ChevronsUpDown className="ml-0.5 h-4 w-4 shrink-0 opacity-60" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(100vw-2rem,280px)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search code or country…" className="h-9" />
                            <CommandList className="max-h-[280px]">
                              <CommandEmpty>No match.</CommandEmpty>
                              <CommandGroup>
                                {PHONE_DIAL_OPTIONS.map((o) => (
                                  <CommandItem
                                    key={`${o.iso}-${o.dial}`}
                                    value={`${o.dial} ${o.iso} ${o.name}`}
                                    onSelect={() => {
                                      setPhoneDial(o.dial)
                                      setDialOpen(false)
                                    }}
                                  >
                                    <span className="mr-2 text-lg leading-none" aria-hidden>
                                      {flagEmojiFromIso(o.iso)}
                                    </span>
                                    <span className="font-mono tabular-nums">{o.dial}</span>
                                    <span className="ml-2 truncate text-muted-foreground text-xs">{o.name}</span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input
                        id="signup-phone-local"
                        type="tel"
                        inputMode="tel"
                        placeholder={phoneDial === "+91" ? "10-digit number" : "Number"}
                        value={phoneLocal}
                        onChange={(e) => setPhoneLocal(e.target.value)}
                        className="min-w-0 flex-1 bg-secondary border-border"
                        required
                        autoComplete="tel-national"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      India: 10 digits starting with 6–9. Other countries: local number without country code.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label id="signup-state-label">State (for GST billing)</Label>
                    <IndianStateCombobox
                      value={billingState}
                      onValueChange={setBillingState}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-secondary border-border"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary border-border"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">At least 8 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password-confirm">Confirm password</Label>
                    <Input
                      id="signup-password-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="bg-secondary border-border"
                      required
                      minLength={8}
                    />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                  </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
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
