import { type NextRequest, NextResponse } from "next/server"
import * as fal from "@fal-ai/serverless-client"

fal.config({
  credentials: process.env.FAL_KEY,
})

// Default AI image generation price in paisa (500 = 5 INR)
const AI_IMAGE_GENERATION_PRICE = 500

export async function GET() {
  // Return current generation price for UI display
  return NextResponse.json({ price: AI_IMAGE_GENERATION_PRICE })
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageSize, walletBalance } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check wallet balance (in paisa)
    if (typeof walletBalance === "number" && walletBalance < AI_IMAGE_GENERATION_PRICE) {
      return NextResponse.json(
        {
          error: `Insufficient wallet balance. AI image generation costs ${(AI_IMAGE_GENERATION_PRICE / 100).toFixed(0)} INR. Please top up your wallet.`,
          code: "INSUFFICIENT_BALANCE",
          requiredAmount: AI_IMAGE_GENERATION_PRICE,
        },
        { status: 402 }
      )
    }

    const result = (await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt,
        image_size: imageSize || "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
      },
    })) as { images?: { url: string }[] }

    const imageUrl = result.images?.[0]?.url

    if (!imageUrl) {
      throw new Error("No image generated")
    }

    // Return image URL and debit amount for the client to record the wallet transaction
    return NextResponse.json({
      imageUrl,
      debitAmount: AI_IMAGE_GENERATION_PRICE,
      transactionDescription: "AI Image Generation",
    })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    )
  }
}
