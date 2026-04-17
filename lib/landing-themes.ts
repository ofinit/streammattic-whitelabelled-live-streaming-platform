import type { LandingTheme, LandingThemeCategory } from "./types"

export interface ThemeConfig {
  id: LandingTheme
  category: LandingThemeCategory
  name: string
  primaryColor: string
  accentColor: string
  fontFamily: string
  description: string
}

/** Tab order and labels (Foto Owl–style buckets). */
export const LANDING_THEME_CATEGORY_TABS: { id: LandingThemeCategory; label: string }[] = [
  { id: "wedding", label: "Wedding" },
  { id: "events", label: "Events" },
  { id: "sports", label: "Sports" },
  { id: "custom", label: "Custom" },
]

export const LANDING_THEMES: ThemeConfig[] = [
  // —— Wedding ——
  {
    id: "rosewood_elegance",
    category: "wedding",
    name: "Rosewood Elegance",
    primaryColor: "#7f1d1d",
    accentColor: "#f5f5dc",
    fontFamily: "'Playfair Display', serif",
    description: "Deep red and cream for classic ceremonies and formal receptions.",
  },
  {
    id: "lavender_veil",
    category: "wedding",
    name: "Lavender Veil",
    primaryColor: "#7c3aed",
    accentColor: "#ede9fe",
    fontFamily: "'Cormorant Garamond', serif",
    description: "Soft violet and misty lilac for romantic, airy galleries.",
  },
  {
    id: "ivory_gold",
    category: "wedding",
    name: "Ivory Gold",
    primaryColor: "#b45309",
    accentColor: "#fffbeb",
    fontFamily: "'Libre Baskerville', serif",
    description: "Warm champagne gold on ivory for timeless wedding portfolios.",
  },
  // —— Events (conferences, corporate, public studio) ——
  {
    id: "modern_emerald",
    category: "events",
    name: "Modern Emerald",
    primaryColor: "#10b981",
    accentColor: "#059669",
    fontFamily: "'Inter', sans-serif",
    description: "Sleek, professional green tones for a tech-forward look.",
  },
  {
    id: "midnight_royal",
    category: "events",
    name: "Midnight Royal",
    primaryColor: "#1e3a8a",
    accentColor: "#d4af37",
    fontFamily: "'Outfit', sans-serif",
    description: "Luxury blue and gold for premium launches and galas.",
  },
  {
    id: "nordic_slate",
    category: "events",
    name: "Nordic Slate",
    primaryColor: "#334155",
    accentColor: "#2dd4bf",
    fontFamily: "'Roboto', sans-serif",
    description: "Cool minimal gray with mint highlights for clean B2B brands.",
  },
  {
    id: "sunset_orchard",
    category: "events",
    name: "Sunset Orchard",
    primaryColor: "#4c1d95",
    accentColor: "#f97316",
    fontFamily: "'Poppins', sans-serif",
    description: "Vibrant purple and orange for creative agencies and festivals.",
  },
  {
    id: "graphite_pulse",
    category: "events",
    name: "Graphite Pulse",
    primaryColor: "#1f2937",
    accentColor: "#38bdf8",
    fontFamily: "'DM Sans', sans-serif",
    description: "Charcoal and electric blue for conferences and keynote-heavy sites.",
  },
  // —— Sports ——
  {
    id: "arena_night",
    category: "sports",
    name: "Arena Night",
    primaryColor: "#0f172a",
    accentColor: "#22c55e",
    fontFamily: "'Oswald', sans-serif",
    description: "Stadium black with field green for matches and race day galleries.",
  },
  {
    id: "velocity_teal",
    category: "sports",
    name: "Velocity Teal",
    primaryColor: "#0d9488",
    accentColor: "#fbbf24",
    fontFamily: "'Barlow Condensed', sans-serif",
    description: "High-energy teal and gold for endurance and team sports.",
  },
  {
    id: "stadium_amber",
    category: "sports",
    name: "Stadium Amber",
    primaryColor: "#171717",
    accentColor: "#f59e0b",
    fontFamily: "'Rajdhani', sans-serif",
    description: "Bold black and amber accents for night games and esports.",
  },
  // —— Custom ——
  {
    id: "mono_editorial",
    category: "custom",
    name: "Mono Editorial",
    primaryColor: "#18181b",
    accentColor: "#a1a1aa",
    fontFamily: "'Newsreader', serif",
    description: "Neutral grayscale for photographers who want content-first layouts.",
  },
]

export function themesForCategory(category: LandingThemeCategory): ThemeConfig[] {
  return LANDING_THEMES.filter((t) => t.category === category)
}

export function categoryForTheme(themeId?: LandingTheme): LandingThemeCategory | undefined {
  return LANDING_THEMES.find((t) => t.id === themeId)?.category
}

const DEFAULT_THEME_ID: LandingTheme = "modern_emerald"

export function getThemeConfig(themeId?: LandingTheme): ThemeConfig {
  const fallback =
    LANDING_THEMES.find((t) => t.id === DEFAULT_THEME_ID) ?? LANDING_THEMES[0]
  if (!themeId) return fallback
  return LANDING_THEMES.find((t) => t.id === themeId) ?? fallback
}
