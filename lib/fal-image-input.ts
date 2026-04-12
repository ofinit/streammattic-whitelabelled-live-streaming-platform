/**
 * Fal text-to-image: model IDs differ in input shape. `fal-ai/flux/schnell` uses
 * `image_size` + `num_inference_steps`; most others (e.g. `fal-ai/nano-banana-2`)
 * use `aspect_ratio` + `num_images`. See each model's API tab on fal.ai.
 */

export const DEFAULT_FAL_IMAGE_MODEL = "fal-ai/nano-banana-2"

/** Maps UI / legacy flux `image_size` values to nano-banana `aspect_ratio` enum. */
const FLUX_IMAGE_SIZE_TO_ASPECT: Record<string, string> = {
  landscape_16_9: "16:9",
  landscape_4_3: "4:3",
  portrait_16_9: "9:16",
  portrait_4_3: "3:4",
  square_hd: "1:1",
  square: "1:1",
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
  const mid = modelId.toLowerCase()
  if (mid.includes("flux/schnell")) {
    return {
      prompt,
      image_size: imageSize,
      num_inference_steps: 4,
      num_images: 1,
    }
  }
  const aspect = FLUX_IMAGE_SIZE_TO_ASPECT[imageSize] ?? "16:9"
  return {
    prompt,
    num_images: 1,
    aspect_ratio: aspect,
    output_format: "png",
  }
}
