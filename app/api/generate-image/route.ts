import path from "path"
import fs from "fs/promises"
import { randomUUID } from "crypto"
import * as fal from "@fal-ai/serverless-client"
import { getDb, toCamel } from "@/lib/db"
import { parseAiImagePricing, AI_IMAGE_PROMPT_MAX_LENGTH } from "@/lib/ai-image-generation"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { encodeBufferToWebp } from "@/lib/server/webp"
import { getPublicBaseUrl } from "@/lib/public-base-url"

fal.config({
  credentials: process.env.FAL_KEY,
})

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads")
const AI_GENERATED_SUBDIR = "ai-generated"

const FETCH_TIMEOUT_MS = 120_000

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
  return jsonOk({ price: config.price, enabled: config.enabled })
}

export const POST = withAuth(async (user, request: Request) => {
  const role = user.role as string
  if (role !== "studio" && role !== "admin" && role !== "streamer") {
    return jsonError("Forbidden", 403)
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
  const sql = getDb()

  const pricingRows = await sql`SELECT value FROM platform_settings WHERE key = 'ai_image_pricing'`
  const aiConfig = parseAiImagePricing(pricingRows.length > 0 ? pricingRows[0].value : null)

  if (!aiConfig.enabled) {
    return jsonError("AI Image Generation is currently disabled by administrators.", 403)
  }

  const price = aiConfig.price

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
  const walletId = wallet.id as string
  const newBalanceAfterDebit = wallet.new_balance as number
  const oldBalance = wallet.old_balance as number

  const debitTxnRows = await sql`
    INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description)
    VALUES (${walletId}, ${userId}, 'debit', 'ai_image_generation', ${price}, ${oldBalance}, ${newBalanceAfterDebit}, ${"AI image generation"})
    RETURNING *
  `

  const debitTxn = debitTxnRows[0] as Record<string, unknown>

  try {
    const result = (await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: imageSize,
        num_inference_steps: 4,
        num_images: 1,
      },
    })) as { images?: { url: string }[] }

    const remoteUrl = result.images?.[0]?.url
    if (!remoteUrl) {
      throw new Error("No image generated")
    }

    const fetchRes = await fetch(remoteUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!fetchRes.ok) {
      throw new Error(`Download failed: HTTP ${fetchRes.status}`)
    }
    const raw = Buffer.from(await fetchRes.arrayBuffer())

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
      transaction: toCamel(debitTxn),
      newBalance: newBalanceAfterDebit,
    })
  } catch (error) {
    console.error("[generate-image] Error:", error)

    await refundAiGenerationWallet(sql, walletId, userId, price, "Refund: AI image generation failed")

    return jsonError("Failed to generate image", 500)
  }
})
