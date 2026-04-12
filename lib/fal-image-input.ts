/**
 * Fal text-to-image: model IDs differ in input shape.
 * - FLUX Schnell (`fal-ai/flux-1/schnell` or legacy `fal-ai/flux/schnell`): `image_size`, fast steps.
 * - FLUX Dev (`fal-ai/flux/dev`): same size enum, more steps (see Fal schema).
 * - Nano-banana / Gemini-style: `aspect_ratio` + `num_images` (partner-only on many accounts).
 *
 * Default is `fal-ai/flux-1/schnell` per https://fal.ai/models/fal-ai/flux-1/schnell/api
 * (distinct from `fal-ai/flux/schnell`, which can 403 depending on account routing).
 */

export const DEFAULT_FAL_IMAGE_MODEL = "fal-ai/flux-1/schnell"

/** Maps UI / legacy flux `image_size` values to aspect ratio strings (nano-banana, OpenRouter `image_config`, etc.). */
const FLUX_IMAGE_SIZE_TO_ASPECT: Record<string, string> = {
  landscape_16_9: "16:9",
  landscape_4_3: "4:3",
  portrait_16_9: "9:16",
  portrait_4_3: "3:4",
  square_hd: "1:1",
  square: "1:1",
}

/** Shared mapping for any provider that uses `16:9`-style aspect ratio strings. */
export function imageSizeToAspectRatioString(imageSize: string): string {
  return FLUX_IMAGE_SIZE_TO_ASPECT[imageSize] ?? "16:9"
}

function isFluxSchnellFamily(modelId: string): boolean {
  const m = modelId.toLowerCase()
  return m.includes("flux-1/schnell") || m.includes("flux/schnell")
}

function isFluxDevFamily(modelId: string): boolean {
  return modelId.toLowerCase().includes("/flux/dev")
}

export function getFalImageModelId(): string {
  const m = process.env.FAL_IMAGE_MODEL?.trim()
  return m && m.length > 0 ? m : DEFAULT_FAL_IMAGE_MODEL
}

export function buildFalSubscribeInput(
  modelId: string,
  prompt: string,
  imageSize: string,
): Record<string, unknown> {
  if (isFluxSchnellFamily(modelId)) {
    return {
      prompt,
      image_size: imageSize,
      num_inference_steps: 4,
      num_images: 1,
    }
  }
  if (isFluxDevFamily(modelId)) {
    return {
      prompt,
      image_size: imageSize,
      num_inference_steps: 28,
      num_images: 1,
      guidance_scale: 3.5,
      output_format: "jpeg",
    }
  }
  const aspect = imageSizeToAspectRatioString(imageSize)
  return {
    prompt,
    num_images: 1,
    aspect_ratio: aspect,
    output_format: "png",
  }
}
