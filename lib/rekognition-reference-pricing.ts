/**
 * Customer-facing face-recognition price for Packages / status API (retail per processed image).
 * Legacy: previously included admin AWS reference estimates — removed from UI; fields in DB stay 0.
 */

import type { PhotoGalleryAddonSettings } from "@/lib/photo-gallery-addon"

export type FaceRecognitionPricingPayload = {
  retailPaisaPerProcessedImage: number
}

export function buildFaceRecognitionPricingPayload(catalog: PhotoGalleryAddonSettings): FaceRecognitionPricingPayload {
  return {
    retailPaisaPerProcessedImage: catalog.faceIndexCreditPricePaisa,
  }
}
