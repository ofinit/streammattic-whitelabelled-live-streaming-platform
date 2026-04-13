/**
 * Client photo gallery add-on (BYOS S3) — control-plane settings and parsing.
 * Neutral naming only in user-visible defaults.
 */

/** Default path for same-origin gallery (platform + studio custom domains). */
export const DEFAULT_CLIENT_GALLERY_PATH = "/client-gallery" as const

export type PhotoGalleryAddonSettings = {
  /** When false, catalog card and APIs hide the module for studios/streamers. */
  listingEnabled: boolean
  /** Shown in Packages / marketing copy. */
  productName: string
  /**
   * Path on this Next.js app (must start with `/`). Used when `galleryServiceBaseUrl` is empty.
   * @default "/client-gallery"
   */
  galleryPath: string
  /**
   * Legacy: full HTTPS URL of an external gallery app. If set, “Open gallery” uses this instead of `galleryPath`.
   * Prefer same-origin `galleryPath` for new setups.
   */
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
    galleryPath: DEFAULT_CLIENT_GALLERY_PATH,
    galleryServiceBaseUrl: "",
    monthlyPricePaisa: 0,
    faceIndexCreditPricePaisa: 500,
    includedFaceIndexesPerMonth: 0,
  }
}

function normalizeGalleryPath(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_CLIENT_GALLERY_PATH
  const t = raw.trim()
  if (!t.startsWith("/") || t.length > 200) return DEFAULT_CLIENT_GALLERY_PATH
  const noTrail = t.replace(/\/$/, "") || "/"
  return noTrail === "/" ? DEFAULT_CLIENT_GALLERY_PATH : noTrail
}

/**
 * Href for “open gallery”: legacy absolute URL wins; otherwise same-origin path.
 */
export function resolveGalleryHref(settings: Pick<PhotoGalleryAddonSettings, "galleryPath" | "galleryServiceBaseUrl">): string {
  const ext = settings.galleryServiceBaseUrl?.trim()
  if (ext) {
    try {
      const u = new URL(ext)
      if (u.protocol === "http:" || u.protocol === "https:") return ext.replace(/\/$/, "")
    } catch {
      /* fall through */
    }
  }
  return normalizeGalleryPath(settings.galleryPath)
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

  const galleryPath = o.galleryPath !== undefined ? normalizeGalleryPath(o.galleryPath) : d.galleryPath

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
    galleryPath,
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
  if (!parsed.galleryPath.startsWith("/")) {
    throw new Error("galleryPath must start with /")
  }
  return parsed
}
