import { NextResponse } from "next/server"
import { createStream, type CreateStreamOptions } from "@/lib/nimble-service"

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventId: string
      eventTitle: string
      enableRecording?: boolean
      enableTranscoding?: boolean
      transcodingProfiles?: string[]
    }

    if (!body.eventId || !body.eventTitle) {
      return NextResponse.json({ error: "eventId and eventTitle are required" }, { status: 400 })
    }

    const options: CreateStreamOptions = {
      eventId: body.eventId,
      eventTitle: body.eventTitle,
      enableRecording: body.enableRecording ?? false,
      enableTranscoding: body.enableTranscoding ?? false,
      transcodingProfiles: body.transcodingProfiles,
    }

    const stream = await createStream(options)

    return NextResponse.json({ success: true, stream })
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create stream: ${(error as Error).message}` },
      { status: 500 },
    )
  }
}
