/**
 * Illustrative AWS Rekognition reference cost (paise) for margin planning.
 * Matches call pattern in lib/client-gallery-face-identity.ts:
 * CreateCollection (once per album, first processed image),
 * IndexFaces (once per image),
 * SearchFaces (once per detected face).
 */

import type { PhotoGalleryAddonSettings } from "@/lib/photo-gallery-addon"

export type RekognitionReferenceEstimateInput = {
  /** Number of faces returned from IndexFaces for this image. */
  faceCount: number
  /** True when this is the first image in the album that yields face processing (collection may be created). */
  includeCreateCollection: boolean
}

export type PhotoGalleryRekognitionReferenceFields = {
  rekognitionReferencePaisaPerCreateCollection: number
  rekognitionReferencePaisaPerIndexFaces: number
  rekognitionReferencePaisaPerSearchFaces: number
}

export function estimateRekognitionReferencePaisa(
  ref: PhotoGalleryRekognitionReferenceFields,
  input: RekognitionReferenceEstimateInput,
): number {
  const fc = Math.max(0, Math.floor(input.faceCount))
  let total = 0
  if (input.includeCreateCollection) {
    total += ref.rekognitionReferencePaisaPerCreateCollection
  }
  total += ref.rekognitionReferencePaisaPerIndexFaces
  total += fc * ref.rekognitionReferencePaisaPerSearchFaces
  return Math.round(total)
}

/** Shown to admins and streamers/studios for transparency (reference vs retail). */
export type FaceRecognitionPricingPayload = {
  retailPaisaPerProcessedImage: number
  referencePaisaFirstImageOneFace: number
  referencePaisaLaterImageOneFace: number
  referencePaisaLaterImageFiveFaces: number
  marginPaisaFirstImageOneFace: number
  marginPaisaLaterImageOneFace: number
  marginPaisaLaterImageFiveFaces: number
}

export function buildFaceRecognitionPricingPayload(catalog: PhotoGalleryAddonSettings): FaceRecognitionPricingPayload {
  const ref: PhotoGalleryRekognitionReferenceFields = {
    rekognitionReferencePaisaPerCreateCollection: catalog.rekognitionReferencePaisaPerCreateCollection,
    rekognitionReferencePaisaPerIndexFaces: catalog.rekognitionReferencePaisaPerIndexFaces,
    rekognitionReferencePaisaPerSearchFaces: catalog.rekognitionReferencePaisaPerSearchFaces,
  }
  const retail = catalog.faceIndexCreditPricePaisa
  const first1 = estimateRekognitionReferencePaisa(ref, { faceCount: 1, includeCreateCollection: true })
  const later1 = estimateRekognitionReferencePaisa(ref, { faceCount: 1, includeCreateCollection: false })
  const later5 = estimateRekognitionReferencePaisa(ref, { faceCount: 5, includeCreateCollection: false })
  return {
    retailPaisaPerProcessedImage: retail,
    referencePaisaFirstImageOneFace: first1,
    referencePaisaLaterImageOneFace: later1,
    referencePaisaLaterImageFiveFaces: later5,
    marginPaisaFirstImageOneFace: Math.max(0, retail - first1),
    marginPaisaLaterImageOneFace: Math.max(0, retail - later1),
    marginPaisaLaterImageFiveFaces: Math.max(0, retail - later5),
  }
}
