"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { LogIn, Loader2, Phone, MessageCircle } from "lucide-react"
import type { Branding } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

interface WeddingRoyalArchHeroProps {
  branding: Branding
}

export function WeddingRoyalArchHero({ branding }: WeddingRoyalArchHeroProps) {
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
    <section className="relative min-h-[90vh] sm:min-h-screen w-full overflow-hidden bg-[#f4e8f7] font-sans flex flex-col justify-between pt-24 sm:pt-28 pb-0 select-none">
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
      <div className="absolute top-0 right-0 z-20 w-[45vw] max-w-[620px] min-w-[280px] pointer-events-none">
        <Image
          src="/themes/royal-arch/wisteria.png"
          alt="Hanging Floral Wisteria"
          width={620}
          height={400}
          priority
          className="w-full h-auto object-contain object-right-top"
        />
      </div>

      {/* 3. Hero Content Container */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center md:items-start justify-between gap-8 pt-4 sm:pt-8">
        {/* Left Side: Brand Title & CTAs */}
        <div className="max-w-xl text-center md:text-left text-purple-950 space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-purple-950 font-serif drop-shadow-sm">
            {branding.brandName}
          </h1>
          <p className="text-base sm:text-lg text-purple-900/80 font-medium">
            {branding.tagline || "Professional photography, videography and live streaming services for your special events."}
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
            {branding.whatsapp ? (
              <a
                href={`https://wa.me/${branding.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 shadow-md rounded-xl">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contact Us
                </Button>
              </a>
            ) : branding.phone ? (
              <a href={`tel:${branding.phone}`}>
                <Button size="lg" className="bg-purple-800 hover:bg-purple-900 text-white font-medium px-6 shadow-md rounded-xl">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Us
                </Button>
              </a>
            ) : (
              <a href="#contact">
                <Button size="lg" className="bg-purple-800 hover:bg-purple-900 text-white font-medium px-6 shadow-md rounded-xl">
                  Contact Us
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Right Side: Floating Glass Login Card */}
        <div className="w-[280px] sm:w-[320px] rounded-2xl bg-[#a855f7]/25 backdrop-blur-md p-4 sm:p-5 border border-[#f472b6]/30 shadow-2xl shrink-0">
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
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-[40px]" />

      {/* 4. Bottom Center Anchored Arch Illustration */}
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
    </section>
  )
}
