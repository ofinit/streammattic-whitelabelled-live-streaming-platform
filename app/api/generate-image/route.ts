import * as fal from "@fal-ai/serverless-client"
import { getDb, toCamel } from "@/lib/db"
import { AI_IMAGE_GENERATION_PRICE_PAISE, AI_IMAGE_PROMPT_MAX_LENGTH } from "@/lib/ai-image-generation"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"

fal.config({
  credentials: process.env.FAL_KEY,
})

export async function GET() {
  return jsonOk({ price: AI_IMAGE_GENERATION_PRICE_PAISE })
}

export const POST = withAuth(async (user, request: Request) => {
  const role = user.role as string
  if (role !== "studio" && role !== "admin" && role !== "streamer") {
    return jsonError("Forbidden", 403)
  }

  let body: { prompt?: unknown; imageSize?: unknown }
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

  const userId = user.id as string
  const sql = getDb()
  const price = AI_IMAGE_GENERATION_PRICE_PAISE

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

    const imageUrl = result.images?.[0]?.url
    if (!imageUrl) {
      throw new Error("No image generated")
    }

    return jsonOk({
      imageUrl,
      transaction: toCamel(debitTxn),
      newBalance: newBalanceAfterDebit,
    })
  } catch (error) {
    console.error("[generate-image] Fal error:", error)

    const refundDesc = "Refund: AI image generation failed"
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
          VALUES (${walletId}, ${userId}, 'credit', 'correction', ${price}, ${balanceBefore}, ${balanceAfter}, ${refundDesc})
        `
      } else {
        console.error("[generate-image] Refund failed: wallet row missing for", walletId)
      }
    } catch (refundErr) {
      console.error("[generate-image] Refund error:", refundErr)
    }

    return jsonError("Failed to generate image", 500)
  }
})
