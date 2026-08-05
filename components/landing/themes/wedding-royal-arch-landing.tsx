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
    <div className="relative h-screen w-full overflow-hidden bg-[#f4e8f7] font-sans flex flex-col justify-between select-none">
      {/* 1. Background Soft Pink/Purple Bokeh Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/themes/royal-arch/bg-bokeh.jpg"
          alt="Soft Bokeh Background"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      {/* 2. Top Right Hanging Floral Wisteria Overlay */}
      <div className="absolute top-0 right-0 z-20 w-[45vw] max-w-[620px] min-w-[300px] pointer-events-none">
        <Image
          src="/themes/royal-arch/wisteria.png"
          alt="Hanging Floral Wisteria"
          width={620}
          height={400}
          priority
          className="w-full h-auto object-contain object-right-top"
        />
      </div>

      {/* 3. Header Bar with Brand Logo */}
      <header className="relative z-30 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-3">
          <BrandedLogo size="lg" />
        </Link>

        {/* 4. Top Right Compact Glass Login Card */}
        <div className="w-[280px] sm:w-[320px] rounded-2xl bg-[#a855f7]/25 backdrop-blur-md p-4 sm:p-5 border border-[#f472b6]/30 shadow-2xl mr-4 sm:mr-8 mt-2">
          {error && (
            <div className="mb-3 p-2 text-xs text-red-100 bg-red-900/60 rounded-lg border border-red-400/30 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Username or Email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#7e22ce]/60 text-white placeholder-purple-100/70 border border-purple-300/30 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all text-xs sm:text-sm"
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#7e22ce]/60 text-white placeholder-purple-100/70 border border-purple-300/30 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all text-xs sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-[#581c87] to-[#3b0764] hover:from-[#6b21a8] hover:to-[#4c1d95] border border-purple-300/30 shadow-md transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
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
      </header>

      {/* Spacer */}
      <div className="flex-1" />

      {/* 5. Bottom Center Anchored Arch Illustration */}
      <div className="relative z-10 w-full flex justify-center pointer-events-none pb-0 mb-0">
        <div className="w-full max-w-[1300px] px-2">
          <Image
            src="/themes/royal-arch/arch-couple.png"
            alt="Wedding Arch Couple Illustration"
            width={1300}
            height={650}
            priority
            className="w-full h-auto object-contain object-bottom block"
          />
        </div>
      </div>
    </div>
  )
}
