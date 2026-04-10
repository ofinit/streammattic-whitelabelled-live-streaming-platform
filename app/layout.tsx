import type React from "react"
import type { Metadata, Viewport } from "next"
import {
  Amiri,
  Cormorant_Garamond,
  Fredoka,
  Great_Vibes,
  Inter,
  Italiana,
  Lato,
  Montserrat,
  Pacifico,
  Playfair_Display,
  Poppins,
  Quicksand,
  Rajdhani,
  Raleway,
  Space_Grotesk,
} from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { BrandingProvider } from "@/lib/branding-context"
import { DynamicFavicon } from "@/components/branding/dynamic-favicon"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"

import { getPlatformSetting } from "@/lib/db-queries"
import { getPlatformFaviconUrl, DEFAULT_FAVICON_PATH } from "@/lib/favicon-resolve"

export async function generateMetadata(): Promise<Metadata> {
  const platformName = (await getPlatformSetting("platform_name")) || "StreamLivee"
  const brandIcon = (await getPlatformFaviconUrl()) || DEFAULT_FAVICON_PATH

  let metadataBase: URL
  try {
    metadataBase = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
  } catch {
    metadataBase = new URL("http://localhost:3000")
  }

  const title = `${platformName} - White-Label Live Streaming Platform`
  const description = `Multi-tenant live streaming platform for studios and content creators powered by ${platformName}`

  return {
    title,
    description,
    metadataBase,
    openGraph: {
      title,
      description,
      siteName: platformName,
      type: "website",
      images: [{ url: brandIcon }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [brandIcon],
    },
    icons: {
      icon: brandIcon.endsWith(".svg")
        ? [{ url: brandIcon, type: "image/svg+xml" }]
        : [{ url: brandIcon }],
      apple: [{ url: brandIcon }],
    },
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
})

/** Ethereal Garden wedding watch template */
const cormorantGarden = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant-garden",
  display: "swap",
})

const montserratGarden = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-montserrat-garden",
  display: "swap",
})

/** Animated Christian wedding (rose & faith) — script + body */
const greatVibesChristianRose = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes-christian-rose",
  display: "swap",
})

/** Midnight Elegance wedding (Italiana + Rajdhani) */
const italianaMidnight = Italiana({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-italiana-midnight",
  display: "swap",
})

const rajdhaniMidnight = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-rajdhani-midnight",
  display: "swap",
})

/** Coastal Breeze wedding (Pacifico + Quicksand) */
const pacificoCoastal = Pacifico({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pacifico-coastal",
  display: "swap",
})

const quicksandCoastal = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-quicksand-coastal",
  display: "swap",
})

/** Corporate Tech Forward summit skin */
const spaceGroteskCorporate = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-corporate-tech-display",
  display: "swap",
})

/** Muslim Nikah wedding — Amiri (Arabic + Latin) + Raleway body */
const amiriNikah = Amiri({
  subsets: ["latin", "arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri-nikah",
  display: "swap",
})

const ralewayNikah = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-raleway-nikah",
  display: "swap",
})

/** Birthday party template — Fredoka + Poppins */
const fredokaBirthday = Fredoka({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-fredoka-birthday",
  display: "swap",
})

const poppinsBirthday = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-poppins-birthday",
  display: "swap",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${playfair.variable} ${lato.variable} ${cormorantGarden.variable} ${montserratGarden.variable} ${greatVibesChristianRose.variable} ${italianaMidnight.variable} ${rajdhaniMidnight.variable} ${pacificoCoastal.variable} ${quicksandCoastal.variable} ${spaceGroteskCorporate.variable} ${amiriNikah.variable} ${ralewayNikah.variable} ${fredokaBirthday.variable} ${poppinsBirthday.variable}`}
    >
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <BrandingProvider>
          <AuthProvider>
            <DynamicFavicon />
            {children}
            <Toaster />
            <SonnerToaster richColors closeButton position="top-center" />
          </AuthProvider>
        </BrandingProvider>
      </body>
    </html>
  )
}
