import path from "path"
import fs from "fs/promises"
import { randomUUID } from "crypto"
import { fal } from "@fal-ai/client"
import { getDb, toCamel } from "@/lib/db"
import { parseAiImagePricing, AI_IMAGE_PROMPT_MAX_LENGTH } from "@/lib/ai-image-generation"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { encodeBufferToWebp } from "@/lib/server/webp"
import { getPublicBaseUrl } from "@/lib/public-base-url"
import { buildFalSubscribeInput, getFalImageModelId } from "@/lib/fal-image-input"
import {
  getAiImageBackendFromEnv,
  getOpenRouterImageModelFromEnv,
  isFalBackendConfigured,
  isOpenRouterBackendConfigured,
  isActiveAiBackendConfigured,
} from "@/lib/ai-image-backend"
import { generateImageBufferOpenRouter } from "@/lib/openrouter-image"

/** Apply on each request so Coolify/runtime env is always used (avoid stale empty key at module load). */
function configureFalFromEnv() {
  const key = process.env.FAL_KEY?.trim()
  fal.config({ credentials: key })
  return key
}

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")
const AI_GENERATED_SUBDIR = "ai-generated"

const FETCH_TIMEOUT_MS = 120_000

/**
 * Normalize Fal output: `@fal-ai/client` returns `{ data, requestId }` per
 * https://fal.ai/docs/documentation/model-apis/overview — images live under `data.images`.
 * Legacy shapes without `data` are still supported.
 */
function extractImageUrlsFromFalResult(result: unknown): string[] {
  if (result == null || typeof result !== "object") return []
  const top = result as Record<string, unknown>
  const fromImages = (images: unknown): string[] => {
    if (!Array.isArray(images)) return []
    return images
      .map((img) => {
        if (img && typeof img === "object" && "url" in img && typeof (img as { url: unknown }).url === "string") {
          return (img as { url: string }).url
        }
        return ""
      })
      .filter(Boolean)
  }
  const direct = fromImages(top.images)
  if (direct.length > 0) return direct
  const data = top.data
  if (data != null && typeof data === "object") {
    return fromImages((data as Record<string, unknown>).images)
  }
  return []
}

/** Fal often throws plain objects or Errors with non-enumerable fields — stringify for logs + pattern match. */
function stringifyUnknownError(err: unknown): string {
  if (err instanceof Error) {
    const any = err as Error & {
      status?: number
      statusCode?: number
      body?: unknown
      response?: { data?: unknown; status?: number }
    }
    const parts = [err.message]
    if (typeof any.status === "number") parts.push(`status=${any.status}`)
    if (typeof any.statusCode === "number") parts.push(`statusCode=${any.statusCode}`)
    if (any.response?.status != null) parts.push(`http=${any.response.status}`)
    if (any.body !== undefined) {
      try {
        parts.push(`body=${JSON.stringify(any.body)}`)
      } catch {
        parts.push("body=[unserializable]")
      }
    } else if (any.response?.data !== undefined) {
      try {
        parts.push(`response.data=${JSON.stringify(any.response.data)}`)
      } catch {
        parts.push("response.data=[unserializable]")
      }
    }
    return parts.join(" ")
  }
  if (typeof err === "object" && err !== null) {
    try {
      return JSON.stringify(err)
    } catch {
      return String(err)
    }
  }
  return String(err)
}

async function refundAiGenerationWallet(
  sql: ReturnType<typeof getDb>,
  walletId: string,
  userId: string,
  price: number,
  refundDescription: string,
): Promise<void> {
  try {
    const refundRows = await sql`
      UPDATE wallets
      SET balance = balance + ${price}, updated_at = NOW()
      WHERE id = ${walletId}
      RETURNING id, balance as new_balance, balance - ${price} as balance_before
    `

    if (refundRows.length > 0) {
      const rw = refundRows[0] as Record<string, unknown>
      const balanceAfter = rw.new_balance as number
      const balanceBefore = rw.balance_before as number
      await sql`
        INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description)
        VALUES (${walletId}, ${userId}, 'credit', 'correction', ${price}, ${balanceBefore}, ${balanceAfter}, ${refundDescription})
      `
    } else {
      console.error("[generate-image] Refund failed: wallet row missing for", walletId)
    }
  } catch (refundErr) {
    console.error("[generate-image] Refund error:", refundErr)
  }
}

export async function GET() {
  const sql = getDb()
  const rows = await sql`SELECT value FROM platform_settings WHERE key = 'ai_image_pricing'`
  const config = parseAiImagePricing(rows.length > 0 ? rows[0].value : null)
  const backend = getAiImageBackendFromEnv()
  return jsonOk({
    price: config.price,
    enabled: config.enabled,
    backend,
    backendsAvailable: {
      fal: isFalBackendConfigured(),
      openrouter: isOpenRouterBackendConfigured(),
    },
    backendReady: isActiveAiBackendConfigured(),
  })
}

export const POST = withAuth(async (user, request: Request) => {
  const role = user.role as string
  if (role !== "studio" && role !== "admin" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }

  const backend = getAiImageBackendFromEnv()
  if (backend === "fal") {
    const falKey = configureFalFromEnv()
    if (!falKey) {
      console.error("[generate-image] FAL_KEY is not set — set it in the server environment (e.g. Coolify → Environment).")
      return jsonError(
        "AI image generation is not configured on this server (missing FAL_KEY). Add your Fal API key to environment variables.",
        503,
      )
    }
  } else if (!isOpenRouterBackendConfigured()) {
    console.error(
      "[generate-image] OPENROUTER_API_KEY or OPENROUTER_IMAGE_MODEL missing — required when AI_IMAGE_BACKEND=openrouter.",
    )
    return jsonError(
      "AI image generation is not configured for OpenRouter. Set OPENROUTER_API_KEY and OPENROUTER_IMAGE_MODEL in the server environment.",
      503,
    )
  }

  let body: { prompt?: unknown; imageSize?: unknown; userId?: unknown }
  try {
    body = await request.json()
  } catch {
    return jsonError("Invalid JSON body", 400)
  }

  const rawPrompt = typeof body.prompt === "string" ? body.prompt : ""
  const prompt = rawPrompt.trim()
  if (!prompt) {
    return jsonError("Prompt is required", 400)
  }
  if (prompt.length > AI_IMAGE_PROMPT_MAX_LENGTH) {
    return jsonError(`Prompt is too long (max ${AI_IMAGE_PROMPT_MAX_LENGTH} characters)`, 400)
  }

  const imageSize =
    typeof body.imageSize === "string" && body.imageSize.trim() !== ""
      ? body.imageSize
      : "landscape_16_9"

  const requestedUserId = typeof body.userId === "string" ? body.userId.trim() : ""
  const userId =
    role === "admin" && requestedUserId !== ""
      ? requestedUserId
      : (user.id as string)
  /** Platform admin creating assets for their own account — no wallet debit (still uses platform API quota). */
  const isPlatformAdminSelfService = role === "admin" && userId === (user.id as string)
  const sql = getDb()

  const pricingRows = await sql`SELECT value FROM platform_settings WHERE key = 'ai_image_pricing'`
  const aiConfig = parseAiImagePricing(pricingRows.length > 0 ? pricingRows[0].value : null)

  if (!aiConfig.enabled) {
    return jsonError("AI Image Generation is currently disabled by administrators.", 403)
  }

  const price = aiConfig.price

  let walletId: string | null = null
  let newBalanceAfterDebit = 0
  let debitTxn: Record<string, unknown> | null = null

  if (!isPlatformAdminSelfService) {
    const updatedWallets = await sql`
      UPDATE wallets
      SET balance = balance - ${price}, updated_at = NOW()
      WHERE user_id = ${userId} AND balance >= ${price}
      RETURNING id, balance as new_balance, balance + ${price} as old_balance
    `

    if (updatedWallets.length === 0) {
      return jsonError(
        `Insufficient wallet balance or wallet not found. AI image generation costs ₹${(price / 100).toFixed(0)}.`,
        400,
      )
    }

    const wallet = updatedWallets[0] as Record<string, unknown>
    walletId = wallet.id as string
    newBalanceAfterDebit = wallet.new_balance as number
    const oldBalance = wallet.old_balance as number

    const debitTxnRows = await sql`
      INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description)
      VALUES (${walletId}, ${userId}, 'debit', 'ai_image_generation', ${price}, ${oldBalance}, ${newBalanceAfterDebit}, ${"AI image generation"})
      RETURNING *
    `

    debitTxn = debitTxnRows[0] as Record<string, unknown>
  }

  try {
    let raw: Buffer

    if (backend === "openrouter") {
      const apiKey = process.env.OPENROUTER_API_KEY!.trim()
      const orModel = getOpenRouterImageModelFromEnv()
      console.info("[generate-image] OpenRouter model:", orModel)
      raw = await generateImageBufferOpenRouter({
        apiKey,
        model: orModel,
        prompt,
        imageSize,
      })
    } else {
      const modelId = getFalImageModelId()
      console.info("[generate-image] Fal model:", modelId)

      const result = await fal.subscribe(modelId, {
        input: buildFalSubscribeInput(modelId, prompt, imageSize),
      })

      const urls = extractImageUrlsFromFalResult(result)
      const remoteUrl = urls[0]
      if (!remoteUrl) {
        console.error("[generate-image] Unexpected Fal shape (no image URLs):", JSON.stringify(result)?.slice(0, 2000))
        throw new Error("No image generated (empty response from Fal — check API response shape / model access)")
      }

      const fetchRes = await fetch(remoteUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
      if (!fetchRes.ok) {
        throw new Error(`Download failed: HTTP ${fetchRes.status}`)
      }
      raw = Buffer.from(await fetchRes.arrayBuffer())
    }

    let webp: Buffer
    try {
      webp = await encodeBufferToWebp(raw)
    } catch (e) {
      console.error("[generate-image] WebP encode error:", e)
      throw new Error("Failed to process generated image")
    }

    const dir = path.join(UPLOAD_DIR, AI_GENERATED_SUBDIR)
    await fs.mkdir(dir, { recursive: true })
    const filename = `${Date.now()}-${randomUUID().replace(/-/g, "").slice(0, 12)}.webp`
    const filepath = path.join(dir, filename)
    await fs.writeFile(filepath, webp)

    const baseUrl = getPublicBaseUrl(request)
    const imageUrl = `${baseUrl}/api/uploads/${AI_GENERATED_SUBDIR}/${filename}`

    return jsonOk({
      imageUrl,
      transaction: debitTxn ? toCamel(debitTxn) : null,
      newBalance: isPlatformAdminSelfService ? null : newBalanceAfterDebit,
      freeForPlatformAdmin: isPlatformAdminSelfService,
    })
  } catch (error) {
    const detail = stringifyUnknownError(error)
    const lower = detail.toLowerCase()
    console.error("[generate-image] Error:", detail, error)

    if (walletId) {
      await refundAiGenerationWallet(sql, walletId, userId, price, "Refund: AI image generation failed")
    }

    /** Map provider / network failures to actionable messages (key is set but invalid, quota, egress, etc.). */
    const generic =
      "Image generation failed. Check container logs for [generate-image] or verify provider keys and billing (Fal / OpenRouter)."
    let client = generic
    const isOr = backend === "openrouter" || lower.includes("openrouter")
    if (
      lower.includes("401") ||
      lower.includes("unauthorized") ||
      lower.includes("invalid api key") ||
      lower.includes("authentication")
    ) {
      client = isOr
        ? "OpenRouter rejected the credentials (401). Confirm OPENROUTER_API_KEY in Coolify and redeploy."
        : "Fal API rejected the credentials (401). Confirm Coolify has FAL_KEY exactly as shown in fal.ai (no quotes or spaces), redeploy, and that the key is enabled for server-side use."
    } else if (lower.includes("403") && (lower.includes("forbidden") || lower.includes("access"))) {
      client = isOr
        ? `OpenRouter denied access (403) for model "${getOpenRouterImageModelFromEnv()}". Check model id, billing, and OpenRouter dashboard.`
        : `Fal API denied access (403) for model "${getFalImageModelId()}". Confirm billing and model access in the Fal dashboard (partner models need entitlement). Default is fal-ai/flux-1/schnell; try unsetting FAL_IMAGE_MODEL or set FAL_IMAGE_MODEL=fal-ai/flux/dev. See https://fal.ai/docs/documentation/model-apis/overview`
    } else if (lower.includes("402") || lower.includes("payment") || lower.includes("insufficient") || lower.includes("quota")) {
      client = isOr
        ? "OpenRouter billing or quota issue. Check credits and usage on openrouter.ai."
        : "Fal API billing or quota issue. Add credits or check usage on fal.ai."
    } else if (lower.includes("429") || lower.includes("rate limit")) {
      client = isOr ? "OpenRouter rate limit reached. Retry shortly." : "Fal API rate limit reached. Retry shortly."
    } else if (
      lower.includes("econnrefused") ||
      lower.includes("etimedout") ||
      lower.includes("enotfound") ||
      lower.includes("fetch failed") ||
      lower.includes("network")
    ) {
      client =
        "Could not reach the image provider or download the image (network). Ensure the server allows outbound HTTPS and can resolve DNS."
    } else if (lower.includes("download failed") || lower.includes("http 4") || lower.includes("http 5")) {
      client =
        "Generated image could not be downloaded. Retry or check provider status; wallet was refunded if debited."
    } else if (lower.includes("webp") || lower.includes("sharp") || lower.includes("process generated image")) {
      client = "Could not process the generated image on the server (encoding). Check logs; wallet was refunded if debited."
    } else if (lower.includes("no image generated")) {
      client = "Fal returned no image for this prompt. Try a different prompt or retry."
    } else if (lower.includes("openrouter: no image")) {
      client = "OpenRouter returned no image for this prompt. Try a model with image output or a different prompt."
    } else if (client === generic) {
      /** Surface a short, safe snippet so operators see the real Fal/validation error without digging in logs. */
      const hint = detail.replace(/\s+/g, " ").trim().slice(0, 420)
      if (hint.length > 0) {
        client = `${generic} Detail: ${hint}`
      }
    }

    return jsonError(client, 500)
  }
})
