"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useBranding } from "@/lib/branding-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoading } = useAuth()
  const { branding } = useBranding()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const resetOk = searchParams.get("reset") === "ok"
  useEffect(() => {
    const authError = searchParams.get("error")
    if (authError) {
      setError(authError === "Unauthorized" ? "Invalid email or password." : "Sign-in failed. Please try again.")
      router.replace("/admin/login", { scroll: false })
    }
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const user = await login(email, password)
    if (user) {
      if (user.role === "admin") {
        const redirect = searchParams.get("redirect") || "/admin"
        window.setTimeout(() => router.push(redirect), 0)
        return
      }
      setError("Access denied. Admin only.")
      return
    }
    setError("Invalid email or password.")
  }

  return (
    <div className="dark min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="text-lg font-semibold text-primary">
            {branding.brandName}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Platform Admin</p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>Use your admin credentials. This page is for platform administrators only.</CardDescription>
          </CardHeader>
          <CardContent>
            {resetOk && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4">
                Password updated. Sign in with your new password.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder={`admin@${branding.brandName.toLowerCase().replace(/\s+/g, "")}.com`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Link
                    href="/admin/forgot-password"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="dark min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <AdminLoginContent />
    </Suspense>
  )
}
