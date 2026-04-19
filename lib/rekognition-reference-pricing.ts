/**
 * Face-recognition pricing for Packages / status API (retail + optional admin cost reference).
 */

import type { PhotoGalleryAddonSettings } from "@/lib/photo-gallery-addon"

export type FaceRecognitionPricingPayload = {
  retailPaisaPerProcessedImage: number
  /** Admin-estimated AWS cost per processed image (0 = not set). Not a streamer charge. */
  providerCostReferencePaisaPerProcessedImage: number
}

export function buildFaceRecognitionPricingPayload(catalog: PhotoGalleryAddonSettings): FaceRecognitionPricingPayload {
  return {
    retailPaisaPerProcessedImage: catalog.faceIndexCreditPricePaisa,
    providerCostReferencePaisaPerProcessedImage: catalog.faceRecognitionProviderCostReferencePaisa,
  }
}
