import { NextResponse } from "next/server"
import { stopStream } from "@/lib/nimble-service"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      streamId: string
      applicationName: string
    }

    if (!body.streamId || !body.applicationName) {
      return NextResponse.json({ error: "streamId and applicationName are required" }, { status: 400 })
    }

    await stopStream(body.streamId, body.applicationName)

    return NextResponse.json({
      success: true,
      message: "Stream stop command sent",
      streamId: body.streamId,
      status: "stopped",
    })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to stop stream: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}
