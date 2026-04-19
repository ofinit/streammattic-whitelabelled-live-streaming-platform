import type { Branding } from "@/lib/types"

const now = new Date()

/**
 * Platform marketing defaults for studio landing + previews when no white-label row exists.
 * Not tied to a real tenant — replace with context/DB branding when configured.
 */
export const PLATFORM_LANDING_BRANDING: Branding = {
  id: "platform-landing-default",
  userId: "platform",
  brandName: "StreamLivee",
  companyLogo: "/logo.png",
  companyLogoDark: "/logo-dark.png",
  favicon: "/favicon.png",
  themeColor: "#10b981",
  accentColor: "#059669",
  email: "support@streamlivee.com",
  metaTitle: "StreamLivee — Live streaming platform",
  metaDescription: "Professional live streaming for events, studios, and creators.",
  aboutUs: "We are a professional media company specializing in capturing life's most precious moments. With state-of-the-art equipment and an experienced team, we deliver stunning photography and videography services for events of all sizes.",
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
      icon: "Plane",
      enabled: true,
    },
  ],
  eventTypes: [
    { id: "evt-1", title: "Weddings", image: "/placeholder-wedding.jpg", enabled: true },
    { id: "evt-2", title: "Corporate Events", image: "/placeholder-corporate.jpg", enabled: true },
    { id: "evt-3", title: "Birthdays", image: "/placeholder-birthday.jpg", enabled: true },
    { id: "evt-4", title: "Religious Events", image: "/placeholder-religious.jpg", enabled: true },
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
  galleryImages: [],
  createdAt: now,
  updatedAt: now,
}
