import type { Branding, BrandingGalleryImage } from "@/lib/types"

const now = new Date()

/**
 * Default hero / section imagery for studio landing when the DB has no uploads yet.
 * Uses Unsplash CDN (same pattern as `lib/template-default-media.ts`). Do not use
 * `/placeholder-*.jpg` paths — those files are not shipped in `/public`.
 */
const STUDIO_LANDING_DEFAULT_MEDIA = {
  /** Photography / videography — camera & creative work (readable behind lighter hero overlay) */
  hero: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2400&q=80",
  /** Wedding / event photography (Unsplash — verified 200; do not use dead photo IDs) */
  about: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80",
  eventWedding: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
  eventCorporate: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
  eventBirthday: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
  eventReligious: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=1200&q=80",
} as const

/**
 * Old platform defaults. Merged landing treats these like “no custom about image”
 * so studios get the current default without re-saving branding.
 */
export function isLegacyStudioDefaultAboutImage(url: string | undefined): boolean {
  if (!url) return false
  return (
    url.includes("photo-1606800052052") || // wedding rings
    url.includes("photo-1502920917128") || // generic DSLR product on table
    url.includes("photo-1493863641943") // bad Unsplash id (404); replaced by current default
  )
}

/** Portfolio grid when the studio has not uploaded gallery items yet (Unsplash CDN). */
const STUDIO_LANDING_DEFAULT_GALLERY: BrandingGalleryImage[] = [
  {
    id: "g-1",
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    title: "Garden ceremony",
    category: "Wedding",
  },
  {
    id: "g-2",
    src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80",
    title: "Annual summit",
    category: "Corporate",
  },
  {
    id: "g-3",
    src: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1600&q=80",
    title: "Birthday celebration",
    category: "Birthday",
  },
  {
    id: "g-4",
    src: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=1600&q=80",
    title: "Traditional ceremony",
    category: "Religious",
  },
  {
    id: "g-5",
    src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
    title: "Live stage",
    category: "Live Event",
  },
  {
    id: "g-6",
    src: "https://images.unsplash.com/photo-1464366400606-199abd6e36b0?auto=format&fit=crop&w=1600&q=80",
    title: "Reception details",
    category: "Wedding",
  },
]

/**
 * Platform marketing defaults for studio landing + previews when no white-label row exists.
 * Not tied to a real tenant — replace with context/DB branding when configured.
 */
export const PLATFORM_LANDING_BRANDING: Branding = {
  id: "platform-landing-default",
  userId: "platform",
  brandName: "StreamLivee",
  companyLogo: "/icon.svg",
  companyLogoDark: "/icon.svg",
  favicon: "/icon.svg",
  themeColor: "#10b981",
  accentColor: "#059669",
  email: "support@streamlivee.com",
  metaTitle: "StreamLivee — Live streaming platform",
  metaDescription: "Professional live streaming for events, studios, and creators.",
  aboutUs: "We are a professional media company specializing in capturing life's most precious moments. With state-of-the-art equipment and an experienced team, we deliver stunning photography and videography services for events of all sizes.",
  heroImage: STUDIO_LANDING_DEFAULT_MEDIA.hero,
  aboutImage: STUDIO_LANDING_DEFAULT_MEDIA.about,
  hasGatewayConfig: false,
  selectedTheme: "modern_emerald",
  services: [
    {
      id: "svc-1",
      title: "Wedding Photography",
      description: "Capture every precious moment of your special day with our professional wedding photography services.",
      icon: "Camera",
      enabled: true,
    },
    {
      id: "svc-2",
      title: "Live Streaming",
      description: "Broadcast your events live to audiences worldwide with HD quality and professional production.",
      icon: "Radio",
      enabled: true,
    },
    {
      id: "svc-3",
      title: "Video Production",
      description: "Professional videography services for commercials, documentaries, and corporate videos.",
      icon: "Film",
      enabled: true,
    },
    {
      id: "svc-4",
      title: "Aerial Photography",
      description: "Stunning drone footage and aerial photography for unique perspectives on your events.",
      icon: "Drone",
      enabled: true,
    },
  ],
  eventTypes: [
    { id: "evt-1", title: "Weddings", image: STUDIO_LANDING_DEFAULT_MEDIA.eventWedding, enabled: true },
    { id: "evt-2", title: "Corporate Events", image: STUDIO_LANDING_DEFAULT_MEDIA.eventCorporate, enabled: true },
    { id: "evt-3", title: "Birthdays", image: STUDIO_LANDING_DEFAULT_MEDIA.eventBirthday, enabled: true },
    { id: "evt-4", title: "Religious Events", image: STUDIO_LANDING_DEFAULT_MEDIA.eventReligious, enabled: true },
  ],
  stats: [
    { id: "stat-1", value: "500+", label: "Events Covered" },
    { id: "stat-2", value: "1000+", label: "Happy Clients" },
    { id: "stat-3", value: "50+", label: "Live Streams" },
    { id: "stat-4", value: "10+", label: "Years Experience" },
  ],
  differentiators: [
    {
      id: "diff-1",
      title: "Professional Team",
      description: "Experienced photographers and videographers dedicated to excellence.",
      icon: "Users",
      enabled: true,
    },
    {
      id: "diff-2",
      title: "Latest Equipment",
      description: "4K cameras, drones, and professional lighting for stunning results.",
      icon: "Award",
      enabled: true,
    },
    {
      id: "diff-3",
      title: "Quick Delivery",
      description: "Receive your edited photos and videos within 48 hours.",
      icon: "Clock",
      enabled: true,
    },
    {
      id: "diff-4",
      title: "24/7 Support",
      description: "Always here when you need us, before, during, and after your event.",
      icon: "Shield",
      enabled: true,
    },
  ],
  testimonials: [
    {
      id: "test-1",
      quote: "Absolutely amazing service! The team captured our wedding perfectly. Every photo tells a story.",
      name: "Sarah & John",
      eventType: "Wedding",
      location: "New York",
    },
    {
      id: "test-2",
      quote: "Professional, punctual, and the quality exceeded our expectations. Highly recommended!",
      name: "Michael Chen",
      eventType: "Corporate Event",
      location: "San Francisco",
    },
  ],
  ctaBannerTitle: "Ready to capture your moments?",
  ctaBannerSubtitle: "Contact us today to book your event",
  ctaBannerButtonText: "Get In Touch",
  ctaBannerButtonUrl: "#contact",
  galleryImages: STUDIO_LANDING_DEFAULT_GALLERY,
  createdAt: now,
  updatedAt: now,
}
