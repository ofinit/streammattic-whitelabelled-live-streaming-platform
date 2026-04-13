/**
 * Client photo gallery add-on (BYOS S3) — control-plane settings and parsing.
 * Neutral naming only in user-visible defaults.
 */

export type PhotoGalleryAddonSettings = {
  /** When false, catalog card and APIs hide the module for studios/streamers. */
  listingEnabled: boolean
  /** Shown in Packages / marketing copy. */
  productName: string
  /** Base URL of the gallery app (e.g. https://gallery.example.com). No trailing slash. */
  galleryServiceBaseUrl: string
  /** Optional monthly entitlement price in paisa (0 = contact admin / custom). */
  monthlyPricePaisa: number
  /** Wallet debit per face-index job when AI search is enabled (future gallery service). */
  faceIndexCreditPricePaisa: number
  /** Included face indexes per month before overage (0 = none). */
  includedFaceIndexesPerMonth: number
}

export const PHOTO_GALLERY_PLATFORM_SETTING_KEY = "photo_gallery_addon" as const

export function getDefaultPhotoGalleryAddonSettings(): PhotoGalleryAddonSettings {
  return {
    listingEnabled: false,
    productName: "Client photo gallery",
    galleryServiceBaseUrl: "",
    monthlyPricePaisa: 0,
    faceIndexCreditPricePaisa: 500,
    includedFaceIndexesPerMonth: 0,
  }
}

function isFiniteNonNeg(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0
}

export function parsePhotoGalleryAddon(raw: unknown): PhotoGalleryAddonSettings {
  const d = getDefaultPhotoGalleryAddonSettings()
  if (!raw || typeof raw !== "object") return d
  const o = raw as Record<string, unknown>

  const listingEnabled = o.listingEnabled === true

  const productName =
    typeof o.productName === "string" && o.productName.trim().length > 0
      ? o.productName.trim().slice(0, 120)
      : d.productName

  let galleryServiceBaseUrl = ""
  if (typeof o.galleryServiceBaseUrl === "string") {
    const t = o.galleryServiceBaseUrl.trim().slice(0, 500)
    if (t.length > 0) {
      try {
        const u = new URL(t)
        if (u.protocol === "http:" || u.protocol === "https:") {
          galleryServiceBaseUrl = t.replace(/\/$/, "")
        }
      } catch {
        galleryServiceBaseUrl = ""
      }
    }
  }

  const monthlyPricePaisa = isFiniteNonNeg(o.monthlyPricePaisa) ? Math.round(o.monthlyPricePaisa) : d.monthlyPricePaisa
  const faceIndexCreditPricePaisa = isFiniteNonNeg(o.faceIndexCreditPricePaisa)
    ? Math.round(o.faceIndexCreditPricePaisa)
    : d.faceIndexCreditPricePaisa
  const includedFaceIndexesPerMonth = isFiniteNonNeg(o.includedFaceIndexesPerMonth)
    ? Math.round(o.includedFaceIndexesPerMonth)
    : d.includedFaceIndexesPerMonth

  return {
    listingEnabled,
    productName,
    galleryServiceBaseUrl,
    monthlyPricePaisa,
    faceIndexCreditPricePaisa,
    includedFaceIndexesPerMonth,
  }
}

export function assertPhotoGalleryAddonForSave(raw: unknown): PhotoGalleryAddonSettings {
  const parsed = parsePhotoGalleryAddon(raw)
  if (parsed.monthlyPricePaisa > 1e14) {
    throw new Error("monthlyPricePaisa is too large")
  }
  if (parsed.faceIndexCreditPricePaisa > 1e12) {
    throw new Error("faceIndexCreditPricePaisa is too large")
  }
  return parsed
}
