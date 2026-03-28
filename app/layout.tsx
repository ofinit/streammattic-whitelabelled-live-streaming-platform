import type React from "react"
import type { Metadata, Viewport } from "next"
import {
  Cormorant_Garamond,
  Inter,
  Italiana,
  Lato,
  Montserrat,
  Pacifico,
  Playfair_Display,
  Quicksand,
  Rajdhani,
  Space_Grotesk,
} from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { BrandingProvider } from "@/lib/branding-context"
import { DynamicFavicon } from "@/components/branding/dynamic-favicon"
import { StackProvider } from "@/components/stack-provider"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  title: "StreamLivee - White-Label Live Streaming Platform",
  description: "Multi-tenant live streaming platform for studios and content creators",
  generator: "v0.app",
  icons: {
    icon: [{ url: "/favicon-live-red.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${playfair.variable} ${lato.variable} ${cormorantGarden.variable} ${montserratGarden.variable} ${italianaMidnight.variable} ${rajdhaniMidnight.variable} ${pacificoCoastal.variable} ${quicksandCoastal.variable} ${spaceGroteskCorporate.variable}`}
    >
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <StackProvider>
          <BrandingProvider>
            <AuthProvider>
              <DynamicFavicon />
              {children}
              <Toaster />
            </AuthProvider>
          </BrandingProvider>
        </StackProvider>
      </body>
    </html>
  )
}
