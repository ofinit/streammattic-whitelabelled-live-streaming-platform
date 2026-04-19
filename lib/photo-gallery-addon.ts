/**
 * Client photo gallery add-on (BYOS S3) — control-plane settings and parsing.
 * Neutral naming only in user-visible defaults.
 */

import { getDefaultGalleryVisionModelId } from "@/lib/photo-gallery-vision-model-catalog"

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
  /**
   * Retail wallet debit per image after successful face-identity processing (AWS Rekognition path).
   * Public gallery views / person filter clicks are not billed.
   */
  faceIndexCreditPricePaisa: number
  /**
   * Optional admin-only: your estimated AWS cost per processed image (paise), for margin planning.
   * Not charged to streamers; does not affect wallet debits.
   */
  faceRecognitionProviderCostReferencePaisa: number
  /** Legacy JSON field; admin save forces 0 (not used). */
  rekognitionReferencePaisaPerCreateCollection: number
  /** Legacy JSON field; admin save forces 0 (not used). */
  rekognitionReferencePaisaPerIndexFaces: number
  /** Legacy JSON field; admin save forces 0 (not used). */
  rekognitionReferencePaisaPerSearchFaces: number
  /** Legacy JSON field; admin save forces 0 — album creation is not billed. */
  albumCreatePricePaisa: number
  /** Legacy JSON field; admin save forces 0 — presigned upload is not billed. */
  uploadPricePaisa: number
  /** Legacy JSON field; admin save resets to default model id (unused for face identity). */
  faceIndexOpenRouterModelId: string
}

export const PHOTO_GALLERY_PLATFORM_SETTING_KEY = "photo_gallery_addon" as const

export function getDefaultPhotoGalleryAddonSettings(): PhotoGalleryAddonSettings {
  const defaultVisionId = getDefaultGalleryVisionModelId()
  return {
    listingEnabled: false,
    productName: "Client photo gallery",
    galleryPath: DEFAULT_CLIENT_GALLERY_PATH,
    galleryServiceBaseUrl: "",
    monthlyPricePaisa: 0,
    faceIndexCreditPricePaisa: 500,
    rekognitionReferencePaisaPerCreateCollection: 0,
    rekognitionReferencePaisaPerIndexFaces: 0,
    rekognitionReferencePaisaPerSearchFaces: 0,
    faceIndexOpenRouterModelId: defaultVisionId,
    albumCreatePricePaisa: 0,
    uploadPricePaisa: 0,
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
  const faceRecognitionProviderCostReferencePaisa = isFiniteNonNeg(o.faceRecognitionProviderCostReferencePaisa)
    ? Math.round(o.faceRecognitionProviderCostReferencePaisa)
    : d.faceRecognitionProviderCostReferencePaisa

  let faceIndexOpenRouterModelId = d.faceIndexOpenRouterModelId
  if (typeof o.faceIndexOpenRouterModelId === "string") {
    const t = o.faceIndexOpenRouterModelId.trim().slice(0, 200)
    if (t.length > 0) faceIndexOpenRouterModelId = t
  }

  const albumCreatePricePaisa = isFiniteNonNeg(o.albumCreatePricePaisa)
    ? Math.round(o.albumCreatePricePaisa)
    : d.albumCreatePricePaisa
  const uploadPricePaisa = isFiniteNonNeg(o.uploadPricePaisa) ? Math.round(o.uploadPricePaisa) : d.uploadPricePaisa

  const rekognitionReferencePaisaPerCreateCollection = isFiniteNonNeg(o.rekognitionReferencePaisaPerCreateCollection)
    ? Math.round(o.rekognitionReferencePaisaPerCreateCollection)
    : d.rekognitionReferencePaisaPerCreateCollection
  const rekognitionReferencePaisaPerIndexFaces = isFiniteNonNeg(o.rekognitionReferencePaisaPerIndexFaces)
    ? Math.round(o.rekognitionReferencePaisaPerIndexFaces)
    : d.rekognitionReferencePaisaPerIndexFaces
  const rekognitionReferencePaisaPerSearchFaces = isFiniteNonNeg(o.rekognitionReferencePaisaPerSearchFaces)
    ? Math.round(o.rekognitionReferencePaisaPerSearchFaces)
    : d.rekognitionReferencePaisaPerSearchFaces

  return {
    listingEnabled,
    productName,
    galleryPath,
    galleryServiceBaseUrl,
    monthlyPricePaisa,
    faceIndexCreditPricePaisa,
    rekognitionReferencePaisaPerCreateCollection,
    rekognitionReferencePaisaPerIndexFaces,
    rekognitionReferencePaisaPerSearchFaces,
    faceIndexOpenRouterModelId,
    albumCreatePricePaisa,
    uploadPricePaisa,
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
  if (parsed.faceRecognitionProviderCostReferencePaisa > 1e12) {
    throw new Error("faceRecognitionProviderCostReferencePaisa is too large")
  }
  if (parsed.albumCreatePricePaisa > 1e12) {
    throw new Error("albumCreatePricePaisa is too large")
  }
  if (parsed.uploadPricePaisa > 1e12) {
    throw new Error("uploadPricePaisa is too large")
  }
  if (parsed.rekognitionReferencePaisaPerCreateCollection > 1e12) {
    throw new Error("rekognitionReferencePaisaPerCreateCollection is too large")
  }
  if (parsed.rekognitionReferencePaisaPerIndexFaces > 1e12) {
    throw new Error("rekognitionReferencePaisaPerIndexFaces is too large")
  }
  if (parsed.rekognitionReferencePaisaPerSearchFaces > 1e12) {
    throw new Error("rekognitionReferencePaisaPerSearchFaces is too large")
  }
  if (!parsed.galleryPath.startsWith("/")) {
    throw new Error("galleryPath must start with /")
  }
  return parsed
}
