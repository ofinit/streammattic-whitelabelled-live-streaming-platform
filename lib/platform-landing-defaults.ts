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
  hasGatewayConfig: false,
  selectedTheme: "modern_emerald",
  services: [
    {
      id: "svc-1",
      title: "Live streaming",
      description: "HD streams with recording and viewer chat.",
      icon: "Radio",
      enabled: true,
    },
    {
      id: "svc-2",
      title: "Multi-destination",
      description: "Simulcast to major platforms from one control room.",
      icon: "Film",
      enabled: true,
    },
  ],
  eventTypes: [
    { id: "evt-1", title: "Weddings", enabled: true },
    { id: "evt-2", title: "Corporate", enabled: true },
  ],
  stats: [
    { id: "stat-1", value: "—", label: "Your events" },
    { id: "stat-2", value: "—", label: "Your reach" },
  ],
  testimonials: [],
  galleryImages: [],
  createdAt: now,
  updatedAt: now,
}
