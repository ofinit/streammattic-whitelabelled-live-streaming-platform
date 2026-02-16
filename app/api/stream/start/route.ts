import { NextResponse } from "next/server"
import { startStream } from "@/lib/nimble-service"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      streamId: string
      applicationName: string
    }

    if (!body.streamId || !body.applicationName) {
      return NextResponse.json({ error: "streamId and applicationName are required" }, { status: 400 })
    }

    await startStream(body.streamId, body.applicationName)

    return NextResponse.json({
      success: true,
      message: "Stream start command sent",
      streamId: body.streamId,
      status: "live",
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to start stream: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}
