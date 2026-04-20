import type { Branding } from "./types"

/** First-paint branding from Host + DB (passed from RootLayout → BrandingProvider) */
export type BrandingServerInitialState = {
  branding: Branding
  isWhiteLabel: boolean
  currentDomain: string | null
}
