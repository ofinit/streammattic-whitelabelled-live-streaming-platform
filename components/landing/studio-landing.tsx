"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import Head from "next/head"
import { useBranding } from "@/lib/branding-context"
import { PLATFORM_LANDING_BRANDING } from "@/lib/platform-landing-defaults"
import { getThemeConfig } from "@/lib/landing-themes"
import { Button } from "@/components/ui/button"
import {
  Camera,
  Film,
  Radio,
  Plane,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Star,
  Sparkles,
  Music,
  Mic2,
  Image as ImageIcon,
  Play,
  ArrowRight,
  Calendar,
  Clock,
  Heart,
  Share2,
  ChevronDown,
  Award,
  Zap,
  Shield,
  Users,
  CheckCircle2,
  X as XIcon,
  Maximize2,
} from "lucide-react"
import type { Branding, BrandingService, BrandingGalleryImage, BrandingDifferentiator } from "@/lib/types"
import { applyFaviconHrefToDocument } from "@/lib/favicon-dom"
import { cn } from "@/lib/utils"
import { normalizeBrandingImageUrl } from "@/lib/resolve-branding-image-url"

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Camera,
  Film,
  Radio,
  Plane,
  Music,
  Mic2,
  ImageIcon,
  Sparkles,
  Star,
}

function getServiceIcon(iconName: string) {
  return iconMap[iconName] || Camera
}

/** Serif wordmark when no logo image — matches landing elegance (Playfair via --font-serif) */
function StudioBrandNameText({
  branding,
  className,
}: {
  branding: Branding
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-serif text-xl sm:text-2xl font-semibold tracking-[0.02em] text-white antialiased [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]",
        className
      )}
    >
      {branding.brandName}
    </span>
  )
}

/**
 * Logo image with URL fix for custom domains + fallback chain (dark → light → text).
 */
function StudioBrandLogo({
  branding,
  imgClassName,
  textClassName,
  loading = "eager",
}: {
  branding: Branding
  imgClassName?: string
  textClassName?: string
  loading?: "eager" | "lazy"
}) {
  const dark = normalizeBrandingImageUrl(branding.companyLogoDark)
  const light = normalizeBrandingImageUrl(branding.companyLogo)
  const candidates = [dark, light].filter((x): x is string => Boolean(x)).filter((x, i, a) => a.indexOf(x) === i)
  const [failIndex, setFailIndex] = useState(0)

  if (failIndex >= candidates.length || candidates.length === 0) {
    return <StudioBrandNameText branding={branding} className={textClassName} />
  }

  return (
    <img
      src={candidates[failIndex]}
      alt={branding.brandName}
      className={imgClassName}
      loading={loading}
      decoding="async"
      onError={() => setFailIndex((i) => i + 1)}
    />
  )
}

function omitUndefined<T extends Record<string, unknown>>(obj: Partial<T>): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

/** Merge saved/mock defaults with overrides (context or editor draft) for the studio landing page */
export function mergeStudioLandingBranding(overrides: Partial<Branding>): Branding {
  const base = omitUndefined(overrides as Record<string, unknown>) as Partial<Branding>
  const P = PLATFORM_LANDING_BRANDING
  return {
    ...P,
    ...base,
    heroImage: base.heroImage || P.heroImage,
    aboutImage: base.aboutImage || P.aboutImage,
    services: base.services ?? P.services,
    eventTypes: base.eventTypes ?? P.eventTypes,
    stats: base.stats ?? P.stats,
    testimonials: base.testimonials ?? P.testimonials,
    galleryImages: base.galleryImages ?? P.galleryImages,
    differentiators: base.differentiators ?? P.differentiators,
    ctaBannerTitle: base.ctaBannerTitle ?? P.ctaBannerTitle,
    ctaBannerSubtitle: base.ctaBannerSubtitle ?? P.ctaBannerSubtitle,
    ctaBannerButtonText: base.ctaBannerButtonText ?? P.ctaBannerButtonText,
    ctaBannerButtonUrl: base.ctaBannerButtonUrl ?? P.ctaBannerButtonUrl,
  }
}

function useLandingBranding(): Branding {
  const { branding } = useBranding()
  /** On localhost / platform domain, context is platform StreamLivee — keep neutral platform marketing defaults */
  const isPlatformDefault = branding.id === "platform" || branding.userId === "platform"
  if (isPlatformDefault) {
    return mergeStudioLandingBranding({})
  }
  return mergeStudioLandingBranding(branding)
}

// --- Section Components ---

function SiteHeader({ branding }: { branding: Branding }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { label: "Services", href: "#services" },
    { label: "Gallery", href: "#gallery" },
    { label: "About", href: "#about" },
    { label: "Contact", href: "#contact" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50 shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
        <Link href="/" className="flex min-w-0 max-w-[min(100%,14rem)] items-center gap-3 z-10">
          <StudioBrandLogo
            branding={branding}
            imgClassName="h-8 sm:h-10 w-auto max-w-full object-contain object-left"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-300 transition-all hover:text-white hover:scale-105"
            >
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 ml-4">
            {branding.whatsapp ? (
              <a
                href={`https://wa.me/${branding.whatsapp?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Us
                </Button>
              </a>
            ) : branding.phone ? (
              <a href={`tel:${branding.phone}`}>
                <Button
                  size="sm"
                  style={{ backgroundColor: branding.themeColor, color: "#fff" }}
                  className="font-medium px-6"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Us
                </Button>
              </a>
            ) : (
              <a href="#contact">
                <Button
                  size="sm"
                  style={{ backgroundColor: branding.themeColor, color: "#fff" }}
                  className="font-medium px-6"
                >
                  Contact Us
                </Button>
              </a>
            )}
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Login
              </Button>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-slate-300 hover:text-white transition-colors p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-slate-950/98 backdrop-blur-xl border-b border-slate-800/50 transition-all duration-300 ${
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <nav className="flex flex-col gap-2 px-4 py-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-medium text-slate-300 transition-colors hover:text-white py-3 px-4 rounded-lg hover:bg-slate-800/50"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-800/50 mt-4">
            {branding.whatsapp ? (
              <a
                href={`https://wa.me/${branding.whatsapp?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp Us
                </Button>
              </a>
            ) : (
              <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  className="w-full font-medium"
                  style={{ backgroundColor: branding.themeColor, color: "#fff" }}
                >
                  Contact Us
                </Button>
              </a>
            )}
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Login
              </Button>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}

function HeroSection({ branding }: { branding: Branding }) {
  const stats = branding.stats?.filter(Boolean) || []
  const hasHeroPhoto = Boolean(branding.heroImage)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      {branding.heroImage ? (
        <div className="absolute inset-0">
          <img
            src={branding.heroImage}
            alt="Hero background"
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          {/* Lighter overlay so the photo stays visible; text legibility via shadows + bottom scrim */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-900/35 to-slate-950/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      )}

      {/* Animated Background Elements — dimmer when a real hero photo is shown */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-1/2 -right-1/2 w-full h-full ${hasHeroPhoto ? "opacity-10" : "opacity-20"}`}
          style={{
            background: `radial-gradient(ellipse at 70% 30%, ${branding.themeColor}40, transparent 60%)`,
          }}
        />
        <div
          className={`absolute -bottom-1/2 -left-1/2 w-full h-full ${hasHeroPhoto ? "opacity-5" : "opacity-10"}`}
          style={{
            background: `radial-gradient(ellipse at 30% 70%, ${branding.themeColor}30, transparent 60%)`,
          }}
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div
        className={`absolute inset-0 ${hasHeroPhoto ? "opacity-[0.015]" : "opacity-[0.03]"}`}
        style={{
          backgroundImage: `linear-gradient(${branding.themeColor}20 1px, transparent 1px), linear-gradient(90deg, ${branding.themeColor}20 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 py-32 sm:py-40">
        <div className="text-center">
          {/* Tagline */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm px-4 py-2 mb-6 sm:mb-8">
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: branding.themeColor }}
            />
            <span className="text-xs sm:text-sm font-medium text-slate-300 uppercase tracking-wider">
              Photography & Videography
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight text-white mb-6 sm:mb-8 [text-shadow:0_2px_24px_rgba(0,0,0,0.75),0_1px_3px_rgba(0,0,0,0.9)]">
            {branding.metaTitle || branding.brandName}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed text-slate-200 mb-8 sm:mb-10 px-4 [text-shadow:0_1px_12px_rgba(0,0,0,0.85)]">
            {branding.metaDescription ||
              "Professional photography, videography and live streaming services for your special events. Capturing moments that last forever."}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
            {branding.whatsapp ? (
              <a
                href={`https://wa.me/${branding.whatsapp?.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-14 text-base group"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp Us
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            ) : branding.phone ? (
              <a href={`tel:${branding.phone}`}>
                <Button
                  size="lg"
                  style={{ backgroundColor: branding.themeColor, color: "#fff" }}
                  className="w-full sm:w-auto font-semibold px-8 h-14 text-base group"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            ) : (
              <a href="#contact">
                <Button
                  size="lg"
                  style={{ backgroundColor: branding.themeColor, color: "#fff" }}
                  className="w-full sm:w-auto font-semibold px-8 h-14 text-base group"
                >
                  Get In Touch
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </a>
            )}
            <a href="#gallery">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 h-14 text-base"
              >
                <Play className="mr-2 h-5 w-5" />
                View Our Work
              </Button>
            </a>
          </div>
        </div>

        {/* Trust Stats */}
        {stats.length > 0 && (
          <div className="mt-16 sm:mt-24 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
            {stats.map((stat) => (
              <div key={stat.id} className="text-center">
                <span className="block text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-1">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:flex flex-col items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Scroll</span>
          <ChevronDown className="h-5 w-5 text-slate-500 animate-bounce" />
        </div>
      </div>
    </section>
  )
}

function ServicesSection({ branding }: { branding: Branding }) {
  const services = (branding.services || []).filter((s: BrandingService) => s.enabled)
  const hasServices = services.length > 0

  return (
    <section id="services" className="relative py-20 sm:py-32 bg-slate-950">
      {/* Background Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${branding.themeColor}, transparent)`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16 text-center">
          <span
            className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
            style={{ color: branding.themeColor }}
          >
            What We Offer
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
            Our Services
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed px-4">
            From capturing the perfect shot to streaming it live across the globe — we handle it all
            with professional excellence.
          </p>
        </div>

        {/* Services Grid or Placeholder */}
        {hasServices ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service: BrandingService) => {
              const Icon = getServiceIcon(service.icon)
              return (
                <div
                  key={service.id}
                  className="group relative rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
                >
                  {/* Icon */}
                  <div
                    className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${branding.themeColor}15` }}
                  >
                    <Icon
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      style={{ color: branding.themeColor }}
                    />
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-semibold text-white">
                    {service.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-400">
                    {service.description}
                  </p>

                  {/* Hover Accent Line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl sm:rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: branding.themeColor }}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div
              className="inline-flex items-center justify-center h-16 w-16 rounded-full mb-4"
              style={{ backgroundColor: `${branding.themeColor}15` }}
            >
              <Sparkles className="h-8 w-8" style={{ color: branding.themeColor }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Services Coming Soon</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              We&apos;re currently updating our services. Contact us directly to learn about what we offer.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function EventTypesSection({ branding }: { branding: Branding }) {
  const eventTypes = (branding.eventTypes || []).filter((e) => e.enabled)
  if (eventTypes.length === 0) return null

  return (
    <section className="relative py-20 sm:py-32 bg-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${branding.themeColor} 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16 text-center">
          <span
            className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
            style={{ color: branding.themeColor }}
          >
            What We Cover
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Every Occasion, Captured
          </h2>
        </div>

        {/* Event Types Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 aspect-[4/3] cursor-pointer"
            >
              <img
                src={eventType.image || "/placeholder.svg?height=400&width=600"}
                alt={eventType.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                  {eventType.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Click to explore
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function WhyChooseUsSection({ branding }: { branding: Branding }) {
  const differentiators = (branding.differentiators || []).filter((d) => d.enabled)
  const hasDifferentiators = differentiators.length > 0

  // Default differentiators if none configured
  const defaultDifferentiators = [
    { id: "1", title: "Professional Team", description: "Experienced photographers & videographers", icon: "Users", enabled: true },
    { id: "2", title: "Latest Equipment", description: "4K cameras, drones & professional lighting", icon: "Award", enabled: true },
    { id: "3", title: "Quick Delivery", description: "Get your photos within 48 hours", icon: "Clock", enabled: true },
    { id: "4", title: "24/7 Support", description: "Always here when you need us", icon: "Shield", enabled: true },
  ]

  const displayDifferentiators = hasDifferentiators ? differentiators : defaultDifferentiators

  const getDiffIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      Users, Award, Clock, Shield, Zap, Heart, Star, Camera
    }
    return icons[iconName] || Award
  }

  return (
    <section className="relative py-20 sm:py-32 bg-slate-900 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${branding.themeColor}20, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-12 sm:mb-16 text-center">
          <span
            className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
            style={{ color: branding.themeColor }}
          >
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            What Makes Us Different
          </h2>
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
            We go above and beyond to ensure your special moments are captured perfectly.
          </p>
        </div>

        {/* Differentiators Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {displayDifferentiators.map((diff) => {
            const Icon = getDiffIcon(diff.icon)
            return (
              <div
                key={diff.id}
                className="group relative rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1"
              >
                {/* Icon */}
                <div
                  className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${branding.themeColor}15` }}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: branding.themeColor }} />
                </div>

                {/* Content */}
                <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-semibold text-white">
                  {diff.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-slate-400">
                  {diff.description}
                </p>

                {/* Hover Accent Line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 rounded-b-xl sm:rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: branding.themeColor }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function CTABanner({ 
  branding, 
  title, 
  subtitle, 
  buttonText, 
  buttonUrl 
}: { 
  branding: Branding
  title?: string
  subtitle?: string
  buttonText?: string
  buttonUrl?: string
}) {
  const bannerTitle = title || branding.ctaBannerTitle || "Ready to capture your moments?"
  const bannerSubtitle = subtitle || branding.ctaBannerSubtitle || "Contact us today to book your event"
  const btnText = buttonText || branding.ctaBannerButtonText || "Get In Touch"
  const btnUrl = buttonUrl || branding.ctaBannerButtonUrl || "#contact"

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${branding.themeColor}20, ${branding.themeColor}10)`,
        }}
      />
      
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${branding.themeColor} 1px, transparent 0)`,
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
          {bannerTitle}
        </h2>
        <p className="text-base sm:text-lg text-slate-300 mb-8">
          {bannerSubtitle}
        </p>
        <a href={btnUrl}>
          <Button
            size="lg"
            style={{ backgroundColor: branding.themeColor, color: "#fff" }}
            className="font-semibold px-8 h-12 sm:h-14 text-base group"
          >
            {btnText}
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </a>
      </div>
    </section>
  )
}

function GallerySection({ branding }: { branding: Branding }) {
  const allImages = branding.galleryImages || []
  const [activeFilter, setActiveFilter] = useState("All")
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const hasImages = allImages.length > 0

  const categories = hasImages 
    ? ["All", ...Array.from(new Set(allImages.map((img) => img.category)))]
    : ["All"]
  const filteredImages =
    activeFilter === "All" ? allImages : allImages.filter((img) => img.category === activeFilter)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    document.body.style.overflow = "hidden"
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = "unset"
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1))
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1))
  }

  return (
    <section id="gallery" className="relative py-20 sm:py-32 bg-slate-950">
      {/* Top Border Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${branding.themeColor}, transparent)`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <span
            className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
            style={{ color: branding.themeColor }}
          >
            Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Our Recent Work
          </h2>
        </div>

        {/* Filters */}
        {hasImages && (
          <div className="mb-8 sm:mb-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`rounded-full px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeFilter === cat
                    ? "text-white shadow-lg"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700"
                }`}
                style={
                  activeFilter === cat ? { backgroundColor: branding.themeColor } : undefined
                }
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Gallery Grid - Masonry-like */}
        {hasImages ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                onClick={() => openLightbox(index)}
                className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800 cursor-pointer ${
                  index % 3 === 0 ? "aspect-[3/4]" : "aspect-[3/2]"
                }`}
              >
                <img
                  src={image.src}
                  alt={image.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  crossOrigin="anonymous"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
                    {image.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">{image.category}</p>
                </div>

                {/* Hover Actions */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="h-8 w-8 rounded-full bg-slate-950/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div
              className="inline-flex items-center justify-center h-16 w-16 rounded-full mb-4"
              style={{ backgroundColor: `${branding.themeColor}15` }}
            >
              <ImageIcon className="h-8 w-8" style={{ color: branding.themeColor }} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Gallery Coming Soon</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              We&apos;re curating our best work. Check back soon to see our portfolio.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && hasImages && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 h-12 w-12 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
          >
            <XIcon className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {filteredImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 z-10 h-12 w-12 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 z-10 h-12 w-12 rounded-full bg-slate-900/80 flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image */}
          <div 
            className="max-w-5xl max-h-[80vh] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filteredImages[lightboxIndex]?.src}
              alt={filteredImages[lightboxIndex]?.title}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <div className="text-center mt-4">
              <h3 className="text-xl font-semibold text-white">
                {filteredImages[lightboxIndex]?.title}
              </h3>
              <p className="text-slate-400">{filteredImages[lightboxIndex]?.category}</p>
              <p className="text-slate-500 text-sm mt-2">
                {lightboxIndex + 1} / {filteredImages.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function TestimonialsSection({ branding }: { branding: Branding }) {
  const testimonials = branding.testimonials || []
  const [current, setCurrent] = useState(0)

  if (testimonials.length === 0) return null

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1))

  return (
    <section className="relative py-20 sm:py-32 bg-slate-900 overflow-hidden">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${branding.themeColor}20, transparent 70%)`,
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span
            className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
            style={{ color: branding.themeColor }}
          >
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            What Our Clients Say
          </h2>
        </div>

        {/* Testimonial Card */}
        <div className="relative bg-slate-950/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-slate-800 p-6 sm:p-10 lg:p-12">
          {/* Quote Icon */}
          <div
            className="absolute top-4 sm:top-6 left-4 sm:left-6 text-6xl sm:text-8xl font-serif opacity-10 select-none"
            style={{ color: branding.themeColor }}
          >
            &ldquo;
          </div>

          {/* Stars */}
          <div className="mb-6 sm:mb-8 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 sm:h-5 sm:w-5 fill-current"
                style={{ color: branding.themeColor }}
              />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="text-lg sm:text-xl md:text-2xl leading-relaxed text-white text-center mb-6 sm:mb-8">
            &ldquo;{testimonials[current].quote}&rdquo;
          </blockquote>

          {/* Author */}
          <div className="text-center">
            <p className="font-semibold text-white text-base sm:text-lg">
              {testimonials[current].name}
            </p>
            <p className="text-xs sm:text-sm text-slate-400">
              {testimonials[current].eventType} &middot; {testimonials[current].location}
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-all hover:text-white hover:border-slate-500 hover:bg-slate-800"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? "w-6 sm:w-8" : "w-2 bg-slate-600 hover:bg-slate-500"
                  }`}
                  style={i === current ? { backgroundColor: branding.themeColor } : undefined}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-slate-700 text-slate-400 transition-all hover:text-white hover:border-slate-500 hover:bg-slate-800"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutSection({ branding }: { branding: Branding }) {
  const hasAboutContent = branding.aboutUs && branding.aboutUs.trim().length > 0

  return (
    <section id="about" className="relative py-20 sm:py-32 bg-slate-950">
      {/* Top Border */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${branding.themeColor}, transparent)`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 sm:gap-12 lg:gap-16 lg:grid-cols-2 items-center">
          {/* Content */}
          <div className="order-2 lg:order-1">
            <span
              className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
              style={{ color: branding.themeColor }}
            >
              About Us
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              About {branding.brandName}
            </h2>
            
            {hasAboutContent ? (
              <>
                <p className="text-base sm:text-lg leading-relaxed text-slate-400 mb-6 sm:mb-8">
                  {branding.aboutUs}
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {["Professional Team", "Latest Equipment", "Quick Delivery", "24/7 Support"].map(
                    (feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-300"
                      >
                        <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: branding.themeColor }} />
                        {feature}
                      </span>
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-slate-400">
                  We are a professional photography and videography studio dedicated to capturing your most precious moments.
                </p>
                {/* Feature Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {["Professional Team", "Latest Equipment", "Quick Delivery", "24/7 Support"].map(
                    (feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-300"
                      >
                        <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: branding.themeColor }} />
                        {feature}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:rounded-2xl border border-slate-800">
              <img
                src={branding.aboutImage || "/placeholder.svg?height=600&width=800"}
                alt={`About ${branding.brandName}`}
                className="h-full w-full object-cover"
                crossOrigin="anonymous"
              />
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(135deg, ${branding.themeColor}40, transparent)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function ContactSection({ branding }: { branding: Branding }) {
  const hasContact = branding.phone || branding.whatsapp || branding.email || branding.address
  if (!hasContact) return null

  return (
    <section id="contact" className="relative py-20 sm:py-32 bg-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${branding.themeColor} 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <span
            className="inline-block text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4"
            style={{ color: branding.themeColor }}
          >
            Get In Touch
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            {`Let's Capture Your Moment`}
          </h2>
          <p className="mx-auto max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed">
            Ready to book? Reach out to us directly — we would love to hear about your event.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 sm:mb-12">
          {branding.phone && (
            <a
              href={`tel:${branding.phone}`}
              className="group flex flex-col items-center gap-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/50 p-6 sm:p-8 transition-all hover:border-slate-700 hover:bg-slate-950 hover:-translate-y-1"
            >
              <div
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${branding.themeColor}15` }}
              >
                <Phone
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: branding.themeColor }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider mb-1">
                  Phone
                </p>
                <p className="font-semibold text-white text-base sm:text-lg">
                  {branding.phone}
                </p>
              </div>
            </a>
          )}

          {branding.email && (
            <a
              href={`mailto:${branding.email}`}
              className="group flex flex-col items-center gap-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/50 p-6 sm:p-8 transition-all hover:border-slate-700 hover:bg-slate-950 hover:-translate-y-1"
            >
              <div
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${branding.themeColor}15` }}
              >
                <Mail
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: branding.themeColor }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="font-semibold text-white text-sm sm:text-base break-all">
                  {branding.email}
                </p>
              </div>
            </a>
          )}

          {branding.address && (
            <div className="group flex flex-col items-center gap-4 rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/50 p-6 sm:p-8 transition-all hover:border-slate-700 hover:bg-slate-950 sm:col-span-2 lg:col-span-1">
              <div
                className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: `${branding.themeColor}15` }}
              >
                <MapPin
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  style={{ color: branding.themeColor }}
                />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-slate-500 uppercase tracking-wider mb-1">
                  Location
                </p>
                <p className="font-semibold text-white text-sm sm:text-base">
                  {branding.address}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {branding.whatsapp && (
            <a
              href={`https://wa.me/${branding.whatsapp?.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 sm:h-14 text-base group"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Us
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </a>
          )}
          {branding.phone && (
            <a href={`tel:${branding.phone}`}>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8 h-12 sm:h-14 text-base"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call Now
              </Button>
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function SiteFooter({ branding }: { branding: Branding }) {
  const socialLinks = [
    { url: branding.instagramUrl, icon: Instagram, label: "Instagram" },
    { url: branding.youtubeUrl, icon: Youtube, label: "YouTube" },
    { url: branding.facebookUrl, icon: Facebook, label: "Facebook" },
    { url: branding.twitterUrl, icon: Twitter, label: "Twitter" },
    { url: branding.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => s.url)

  const services = (branding.services || []).filter((s: BrandingService) => s.enabled)
  const hasLegal = branding.termsConditions || branding.privacyPolicy || branding.refundPolicy

  return (
    <footer className="relative bg-slate-950 border-t border-slate-800">
      {/* Top Border Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, ${branding.themeColor}, transparent)`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid gap-8 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 sm:mb-6">
              <StudioBrandLogo
                branding={branding}
                imgClassName="h-8 sm:h-10 w-auto max-w-[min(100%,240px)] object-contain object-left"
                textClassName="inline-block"
                loading="lazy"
              />
            </div>
            <p className="text-sm sm:text-base leading-relaxed text-slate-400 mb-4 sm:mb-6">
              {branding.metaDescription ||
                "Professional photography, videography and live streaming services."}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-2 sm:gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition-all hover:text-white hover:border-slate-600 hover:bg-slate-900"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Services Column */}
          {services.length > 0 && (
            <div>
              <h4 className="mb-4 sm:mb-6 text-sm font-semibold uppercase tracking-wider text-white">
                Services
              </h4>
              <ul className="flex flex-col gap-2 sm:gap-3">
                {services.map((service: BrandingService) => (
                  <li key={service.id}>
                    <a
                      href="#services"
                      className="text-sm sm:text-base text-slate-400 transition-colors hover:text-white"
                    >
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 sm:mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-3">
              <li>
                <a
                  href="#gallery"
                  className="text-sm sm:text-base text-slate-400 transition-colors hover:text-white"
                >
                  Gallery
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-sm sm:text-base text-slate-400 transition-colors hover:text-white"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-sm sm:text-base text-slate-400 transition-colors hover:text-white"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm sm:text-base text-slate-400 transition-colors hover:text-white"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          {hasLegal && (
            <div>
              <h4 className="mb-4 sm:mb-6 text-sm font-semibold uppercase tracking-wider text-white">
                Legal
              </h4>
              <ul className="flex flex-col gap-2 sm:gap-3">
                {branding.termsConditions && (
                  <li>
                    <span className="text-sm sm:text-base text-slate-400 cursor-pointer transition-colors hover:text-white">
                      Terms & Conditions
                    </span>
                  </li>
                )}
                {branding.privacyPolicy && (
                  <li>
                    <span className="text-sm sm:text-base text-slate-400 cursor-pointer transition-colors hover:text-white">
                      Privacy Policy
                    </span>
                  </li>
                )}
                {branding.refundPolicy && (
                  <li>
                    <span className="text-sm sm:text-base text-slate-400 cursor-pointer transition-colors hover:text-white">
                      Refund Policy
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-800">
          <p className="text-center text-xs sm:text-sm text-slate-500">
            &copy; {new Date().getFullYear()} {branding.brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

// Check Icon Component
function CheckIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      className={className}
      style={style}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

// --- Main Page ---

export function StudioLandingPage({
  draftBranding,
  previewBanner,
}: {
  /** When set (e.g. from sessionStorage on /site?preview=draft), replaces context branding for this render */
  draftBranding?: Branding | null
  previewBanner?: ReactNode
}) {
  const contextBranding = useLandingBranding()
  const branding = draftBranding != null ? mergeStudioLandingBranding(draftBranding) : contextBranding

  useEffect(() => {
    const title = (branding.metaTitle || branding.brandName || "").trim()
    if (title) document.title = title
    const desc = branding.metaDescription?.trim() ?? ""
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "description")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", desc)
    const fav = branding.favicon?.trim()
    if (fav) applyFaviconHrefToDocument(fav)
  }, [branding])

  const theme = getThemeConfig(branding.selectedTheme)
  const fontName = theme.fontFamily.split(",")[0].replace(/'/g, "")
  const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, "+")}:wght@300;400;500;600;700&display=swap`

  return (
    <div
      className="min-h-screen bg-slate-950 text-white antialiased"
      style={{ fontFamily: theme.fontFamily }}
    >
      <Head>
        <link rel="stylesheet" href={googleFontsUrl} />
        <meta name="theme-color" content="#020617" />
      </Head>
      {previewBanner}
      <SiteHeader branding={branding} />
      <main>
        <HeroSection branding={branding} />
        <CTABanner 
          branding={branding} 
          title="Ready to capture your moments?"
          subtitle="Professional photography and videography services for all your special events"
          buttonText="Explore Our Services"
          buttonUrl="#services"
        />
        <ServicesSection branding={branding} />
        <WhyChooseUsSection branding={branding} />
        <EventTypesSection branding={branding} />
        <CTABanner 
          branding={branding} 
          title="View Our Portfolio"
          subtitle="See our recent work and imagine what we can create for you"
          buttonText="View Gallery"
          buttonUrl="#gallery"
        />
        <GallerySection branding={branding} />
        <TestimonialsSection branding={branding} />
        <AboutSection branding={branding} />
        <CTABanner 
          branding={branding} 
          title="Book Your Event Today"
          subtitle="Don't miss out on capturing your precious moments. Limited slots available."
          buttonText="Contact Us Now"
          buttonUrl="#contact"
        />
        <ContactSection branding={branding} />
      </main>
      <SiteFooter branding={branding} />
    </div>
  )
}
