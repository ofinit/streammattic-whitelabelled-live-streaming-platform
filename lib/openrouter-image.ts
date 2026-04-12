import { imageSizeToAspectRatioString } from "@/lib/fal-image-input"

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"
const REQUEST_TIMEOUT_MS = 120_000

function dataUrlToBuffer(dataUrl: string): Buffer {
  const m = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl)
  if (!m) {
    throw new Error("OpenRouter: image was not a base64 data URL")
  }
  return Buffer.from(m[2], "base64")
}

function extractFirstImageUrl(message: unknown): string | null {
  if (message == null || typeof message !== "object") return null
  const msg = message as Record<string, unknown>
  const images = msg.images
  if (!Array.isArray(images)) return null
  for (const img of images) {
    if (img == null || typeof img !== "object") continue
    const o = img as Record<string, unknown>
    const nested =
      o.image_url && typeof o.image_url === "object"
        ? (o.image_url as { url?: unknown }).url
        : o.imageUrl && typeof o.imageUrl === "object"
          ? (o.imageUrl as { url?: unknown }).url
          : undefined
    if (typeof nested === "string" && (nested.startsWith("data:") || nested.startsWith("http://") || nested.startsWith("https://"))) {
      return nested
    }
  }
  return null
}

/**
 * Text-to-image via OpenRouter chat completions (modalities image + text).
 * @see https://openrouter.ai/docs/guides/overview/multimodal/image-generation
 */
export async function generateImageBufferOpenRouter(options: {
  apiKey: string
  model: string
  prompt: string
  imageSize: string
}): Promise<Buffer> {
  const aspectRatio = imageSizeToAspectRatioString(options.imageSize)

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_HTTP_REFERER?.trim()
        ? { Referer: process.env.OPENROUTER_HTTP_REFERER.trim() }
        : {}),
      ...(process.env.OPENROUTER_APP_TITLE?.trim()
        ? { "X-Title": process.env.OPENROUTER_APP_TITLE.trim() }
        : { "X-Title": "Stream-Livee" }),
    },
    body: JSON.stringify({
      model: options.model,
      messages: [{ role: "user", content: options.prompt }],
      modalities: ["image", "text"],
      image_config: {
        aspect_ratio: aspectRatio,
      },
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text) as unknown
  } catch {
    throw new Error(`OpenRouter: invalid JSON response (HTTP ${res.status})`)
  }

  if (!res.ok) {
    const snippet =
      typeof json === "object" && json !== null
        ? JSON.stringify(json).slice(0, 800)
        : text.slice(0, 800)
    throw new Error(`OpenRouter API HTTP ${res.status}: ${snippet}`)
  }

  const root = json as { choices?: unknown[]; error?: { message?: string } }
  if (root.error?.message) {
    throw new Error(`OpenRouter: ${root.error.message}`)
  }

  const choices = root.choices
  const first = Array.isArray(choices) ? choices[0] : undefined
  const message =
    first && typeof first === "object" && first !== null
      ? (first as { message?: unknown }).message
      : undefined

  const imageRef = extractFirstImageUrl(message)
  if (!imageRef) {
    const preview = JSON.stringify(json).slice(0, 1500)
    throw new Error(`OpenRouter: no image in response (check model supports image output). ${preview}`)
  }

  if (imageRef.startsWith("data:")) {
    return dataUrlToBuffer(imageRef)
  }

  const imgRes = await fetch(imageRef, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  if (!imgRes.ok) {
    throw new Error(`OpenRouter: failed to download image URL (HTTP ${imgRes.status})`)
  }
  return Buffer.from(await imgRes.arrayBuffer())
}
