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
} from "lucide-react"
import type { Branding, BrandingService } from "@/lib/types"
import { applyFaviconHrefToDocument } from "@/lib/favicon-dom"

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

/** Merge saved/mock defaults with overrides (context or editor draft) for the studio landing page */
export function mergeStudioLandingBranding(overrides: Partial<Branding>): Branding {
  return {
    ...PLATFORM_LANDING_BRANDING,
    ...overrides,
    heroImage: overrides.heroImage || PLATFORM_LANDING_BRANDING.heroImage,
    aboutImage: overrides.aboutImage || PLATFORM_LANDING_BRANDING.aboutImage,
    services: overrides.services || PLATFORM_LANDING_BRANDING.services,
    eventTypes: overrides.eventTypes || PLATFORM_LANDING_BRANDING.eventTypes,
    stats: overrides.stats || PLATFORM_LANDING_BRANDING.stats,
    testimonials: overrides.testimonials || PLATFORM_LANDING_BRANDING.testimonials,
    galleryImages: overrides.galleryImages || PLATFORM_LANDING_BRANDING.galleryImages,
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

  const navLinks = [
    { label: "Services", href: "#services" },
    { label: "Gallery", href: "#gallery" },
    { label: "About", href: "#about" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          {branding.companyLogo ? (
            <img src={branding.companyLogoDark || branding.companyLogo} alt={branding.brandName} className="h-8" />
          ) : (
            <span className="text-xl font-bold" style={{ color: branding.themeColor }}>
              {branding.brandName}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          {branding.whatsapp ? (
            <a href={`https://wa.me/${branding.whatsapp?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
              <Button size="sm" style={{ backgroundColor: branding.themeColor, color: "#fff" }}>
                Contact Us
              </Button>
            </a>
          ) : branding.phone ? (
            <a href={`tel:${branding.phone}`}>
              <Button size="sm" style={{ backgroundColor: branding.themeColor, color: "#fff" }}>
                Contact Us
              </Button>
            </a>
          ) : (
            <a href="#contact">
              <Button size="sm" style={{ backgroundColor: branding.themeColor, color: "#fff" }}>
                Contact Us
              </Button>
            </a>
          )}
          <Link href="/login">
            <Button variant="outline" size="sm">
              Login
            </Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="border-t border-border/40 bg-background px-6 py-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
              <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full" style={{ backgroundColor: branding.themeColor, color: "#fff" }}>
                  Contact Us
                </Button>
              </a>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function HeroSection({ branding }: { branding: Branding }) {
  const stats = branding.stats?.filter(Boolean) || []

  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-20 text-center">
      {/* Hero background image */}
      {branding.heroImage && (
        <div className="absolute inset-0">
          <img
            src={branding.heroImage}
            alt="Hero background"
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <div className="absolute inset-0 bg-background/85" />
        </div>
      )}
      {/* Subtle gradient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${branding.themeColor}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-4xl">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Photography & Videography
        </p>
        <h1 className="text-4xl font-bold leading-tight text-balance text-foreground md:text-6xl lg:text-7xl">
          {branding.metaTitle || branding.brandName}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {branding.metaDescription || "Professional photography, videography and live streaming services for your special events."}
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {branding.whatsapp ? (
            <a href={`https://wa.me/${branding.whatsapp?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" style={{ backgroundColor: branding.themeColor, color: "#fff" }}>
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Us
              </Button>
            </a>
          ) : branding.phone ? (
            <a href={`tel:${branding.phone}`}>
              <Button size="lg" style={{ backgroundColor: branding.themeColor, color: "#fff" }}>
                <Phone className="mr-2 h-5 w-5" />
                Call Now
              </Button>
            </a>
          ) : (
            <a href="#contact">
              <Button size="lg" style={{ backgroundColor: branding.themeColor, color: "#fff" }}>
                Contact Us
              </Button>
            </a>
          )}
          <a href="#gallery">
            <Button variant="outline" size="lg">
              View Our Work
            </Button>
          </a>
        </div>

        {/* Trust Stats */}
        {stats.length > 0 && (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, i) => (
              <div key={stat.id} className="flex flex-col items-center">
                {i > 0 && <div className="hidden" />}
                <span className="text-3xl font-bold text-foreground md:text-4xl">{stat.value}</span>
                <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ServicesSection({ branding }: { branding: Branding }) {
  const services = (branding.services || []).filter((s: BrandingService) => s.enabled)
  if (services.length === 0) return null

  return (
    <section id="services" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: branding.themeColor }}>
            What We Offer
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">Our Services</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            From capturing the perfect shot to streaming it live across the globe -- we handle it all.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service: BrandingService) => {
            const Icon = getServiceIcon(service.icon)
            return (
              <div
                key={service.id}
                className="group rounded-xl border border-border/50 bg-card p-8 transition-all hover:border-border hover:shadow-lg"
              >
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: branding.themeColor + "15" }}
                >
                  <Icon className="h-6 w-6" style={{ color: branding.themeColor }} />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">{service.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{service.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function EventTypesSection({ branding }: { branding: Branding }) {
  const eventTypes = (branding.eventTypes || []).filter((e) => e.enabled)
  if (eventTypes.length === 0) return null

  return (
    <section className="px-6 py-24 bg-card/50">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: branding.themeColor }}>
            What We Cover
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">Every Occasion, Captured</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="group relative overflow-hidden rounded-xl border border-border/50 aspect-[4/3]"
            >
              <img
                src={eventType.image || "/placeholder.svg?height=400&width=600"}
                alt={eventType.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-semibold text-white">{eventType.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function GallerySection({ branding }: { branding: Branding }) {
  const allImages = branding.galleryImages || []
  const [activeFilter, setActiveFilter] = useState("All")

  if (allImages.length === 0) return null

  const categories = ["All", ...Array.from(new Set(allImages.map((img) => img.category)))]
  const filteredImages = activeFilter === "All" ? allImages : allImages.filter((img) => img.category === activeFilter)

  return (
    <section id="gallery" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: branding.themeColor }}>
            Portfolio
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl text-balance">Our Recent Work</h2>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${activeFilter === cat
                ? "text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              style={activeFilter === cat ? { backgroundColor: branding.themeColor } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative overflow-hidden rounded-xl border border-border/50 aspect-[3/2]"
            >
              <img
                src={image.src}
                alt={image.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/50" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-full p-5 transition-transform group-hover:translate-y-0">
                <h3 className="text-base font-semibold text-white">{image.title}</h3>
                <p className="text-sm text-white/70">{image.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
    <section className="px-6 py-24 bg-card/50">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: branding.themeColor }}>
          Testimonials
        </p>
        <h2 className="mb-16 text-3xl font-bold text-foreground md:text-4xl text-balance">
          What Our Clients Say
        </h2>

        <div className="relative">
          <div className="mb-8 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" style={{ color: branding.themeColor }} />
            ))}
          </div>

          <blockquote className="text-xl leading-relaxed text-foreground md:text-2xl">
            &ldquo;{testimonials[current].quote}&rdquo;
          </blockquote>

          <div className="mt-8">
            <p className="font-semibold text-foreground">{testimonials[current].name}</p>
            <p className="text-sm text-muted-foreground">
              {testimonials[current].eventType} &middot; {testimonials[current].location}
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-foreground"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2 rounded-full transition-all ${i === current ? "w-8" : "w-2 bg-muted-foreground/30"
                    }`}
                  style={i === current ? { backgroundColor: branding.themeColor } : undefined}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground hover:border-foreground"
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
  if (!branding.aboutUs) return null

  return (
    <section id="about" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: branding.themeColor }}>
              About Us
            </p>
            <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl text-balance">
              About {branding.brandName}
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">{branding.aboutUs}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border/50">
            <img
              src={branding.aboutImage || "/placeholder.svg?height=600&width=800"}
              alt={`About ${branding.brandName}`}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
            />
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
    <section id="contact" className="px-6 py-24 bg-card/50">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest" style={{ color: branding.themeColor }}>
          Get In Touch
        </p>
        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl text-balance">
          {"Let's Capture Your Moment"}
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-muted-foreground leading-relaxed">
          Ready to book? Reach out to us directly -- we would love to hear about your event.
        </p>

        {/* Contact info cards */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {branding.phone && (
            <a href={`tel:${branding.phone}`} className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: branding.themeColor + "15" }}>
                <Phone className="h-5 w-5" style={{ color: branding.themeColor }} />
              </div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">{branding.phone}</p>
            </a>
          )}
          {branding.email && (
            <a href={`mailto:${branding.email}`} className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: branding.themeColor + "15" }}>
                <Mail className="h-5 w-5" style={{ color: branding.themeColor }} />
              </div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{branding.email}</p>
            </a>
          )}
          {branding.address && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border/50 bg-card p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: branding.themeColor + "15" }}>
                <MapPin className="h-5 w-5" style={{ color: branding.themeColor }} />
              </div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium text-foreground text-center">{branding.address}</p>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {branding.whatsapp && (
            <a href={`https://wa.me/${branding.whatsapp?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" style={{ backgroundColor: "#25D366", color: "#fff" }}>
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp Us
              </Button>
            </a>
          )}
          {branding.phone && (
            <a href={`tel:${branding.phone}`}>
              <Button variant="outline" size="lg">
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
    <footer className="border-t border-border/40 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-1">
            {branding.companyLogo ? (
              <img src={branding.companyLogoDark || branding.companyLogo} alt={branding.brandName} className="mb-4 h-8" />
            ) : (
              <span className="mb-4 inline-block text-xl font-bold" style={{ color: branding.themeColor }}>
                {branding.brandName}
              </span>
            )}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {branding.metaDescription || "Professional photography, videography and live streaming services."}
            </p>
          </div>

          {/* Services Column */}
          {services.length > 0 && (
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Services</h4>
              <ul className="flex flex-col gap-2">
                {services.map((service: BrandingService) => (
                  <li key={service.id}>
                    <a href="#services" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {service.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social Column */}
          {socialLinks.length > 0 && (
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Follow Us</h4>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:text-foreground hover:border-border"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Legal Column */}
          {hasLegal && (
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Legal</h4>
              <ul className="flex flex-col gap-2">
                {branding.termsConditions && (
                  <li>
                    <span className="text-sm text-muted-foreground cursor-pointer transition-colors hover:text-foreground">
                      Terms & Conditions
                    </span>
                  </li>
                )}
                {branding.privacyPolicy && (
                  <li>
                    <span className="text-sm text-muted-foreground cursor-pointer transition-colors hover:text-foreground">
                      Privacy Policy
                    </span>
                  </li>
                )}
                {branding.refundPolicy && (
                  <li>
                    <span className="text-sm text-muted-foreground cursor-pointer transition-colors hover:text-foreground">
                      Refund Policy
                    </span>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-border/40 pt-8">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            &copy; {new Date().getFullYear()} {branding.brandName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
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
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: theme.fontFamily }}
    >
      <Head>
        <link rel="stylesheet" href={googleFontsUrl} />
      </Head>
      {previewBanner}
      <SiteHeader branding={branding} />
      <main>
        <HeroSection branding={branding} />
        <ServicesSection branding={branding} />
        <EventTypesSection branding={branding} />
        <GallerySection branding={branding} />
        <TestimonialsSection branding={branding} />
        <AboutSection branding={branding} />
        <ContactSection branding={branding} />
      </main>
      <SiteFooter branding={branding} />
    </div>
  )
}
