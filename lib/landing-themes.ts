import { LandingTheme } from "./types"

export interface ThemeConfig {
  id: LandingTheme
  name: string
  primaryColor: string
  accentColor: string
  fontFamily: string
  description: string
}

export const LANDING_THEMES: ThemeConfig[] = [
  {
    id: "modern_emerald",
    name: "Modern Emerald",
    primaryColor: "#10b981",
    accentColor: "#059669",
    fontFamily: "'Inter', sans-serif",
    description: "Sleek, professional, and vibrant green tones for a tech-forward look.",
  },
  {
    id: "midnight_royal",
    name: "Midnight Royal",
    primaryColor: "#1e3a8a",
    accentColor: "#d4af37",
    fontFamily: "'Outfit', sans-serif",
    description: "Deep luxury blue paired with majestic gold accents for premium events.",
  },
  {
    id: "rosewood_elegance",
    name: "Rosewood Elegance",
    primaryColor: "#7f1d1d",
    accentColor: "#f5f5dc",
    fontFamily: "'Playfair Display', serif",
    description: "Sophisticated deep red and cream palette for classic weddings and ceremonies.",
  },
  {
    id: "nordic_slate",
    name: "Nordic Slate",
    primaryColor: "#334155",
    accentColor: "#2dd4bf",
    fontFamily: "'Roboto', sans-serif",
    description: "Cool, minimalistic gray scales with fresh mint highlights.",
  },
  {
    id: "sunset_orchard",
    name: "Sunset Orchard",
    primaryColor: "#4c1d95",
    accentColor: "#f97316",
    fontFamily: "'Poppins', sans-serif",
    description: "Vibrant purple and orange gradient for energetic and creative studios.",
  },
]

export function getThemeConfig(themeId?: LandingTheme): ThemeConfig {
  return LANDING_THEMES.find((t) => t.id === themeId) || LANDING_THEMES[0]
}
