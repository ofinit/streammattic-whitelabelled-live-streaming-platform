"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { LogIn, Loader2 } from "lucide-react"
import type { Branding } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { BrandedLogo } from "@/components/branding/branded-logo"

interface WeddingRoyalArchLandingProps {
  branding: Branding
}

export function WeddingRoyalArchLanding({ branding }: WeddingRoyalArchLandingProps) {
  const router = useRouter()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim() || !password) return
    setError("")
    setLoading(true)

    try {
      const user = await login(identifier.trim(), password)
      if (!user) {
        setError("Invalid email/username or password.")
        return
      }
      const route = user.role === "admin" ? "/admin" : user.role === "studio" ? "/studio" : "/streamer"
      router.replace(route)
    } catch {
      setError("Sign in failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#f4e8f7] font-sans">
      {/* 1. Background Bokeh Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/themes/royal-arch/bg-bokeh.jpg"
          alt="Bokeh Background"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* 2. Top Right Hanging Wisteria Flowers */}
      <div className="absolute top-0 right-0 z-10 w-[300px] sm:w-[450px] md:w-[550px] pointer-events-none">
        <Image
          src="/themes/royal-arch/wisteria.png"
          alt="Hanging Floral Wisteria"
          width={550}
          height={350}
          priority
          className="w-full h-auto object-contain object-right-top"
        />
      </div>

      {/* 3. Header / Brand Logo */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3">
          <BrandedLogo size="lg" />
        </Link>
      </header>

      {/* 4. Top Right Floating Login Card */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 pt-4 md:pt-8 flex justify-end">
        <div className="w-full max-w-sm sm:max-w-md rounded-3xl bg-purple-900/35 backdrop-blur-md p-6 sm:p-8 border border-purple-300/30 shadow-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center drop-shadow-sm">
            Sign In to {branding.brandName}
          </h2>
          <p className="text-xs sm:text-sm text-purple-100 text-center mb-6 opacity-90">
            Enter your credentials to access live events
          </p>

          {error && (
            <div className="mb-4 p-3 text-xs sm:text-sm text-red-200 bg-red-900/50 rounded-xl border border-red-400/30 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Username or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-purple-300/40 text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-sm"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-purple-950/60 border border-purple-300/40 text-white placeholder-purple-200/60 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all text-sm"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-purple-200">
              <Link href="/forgot-password" className="hover:underline transition-all">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Login
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 5. Bottom Center Arch with Peacocks & Couple */}
      <div className="relative z-10 w-full flex justify-center mt-12 md:mt-24 pointer-events-none">
        <div className="w-[90%] max-w-4xl">
          <Image
            src="/themes/royal-arch/arch-couple.png"
            alt="Wedding Arch Couple Illustration"
            width={1000}
            height={500}
            priority
            className="w-full h-auto object-contain object-bottom"
          />
        </div>
      </div>
    </div>
  )
}
