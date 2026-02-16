import { NextResponse } from "next/server"
import { getActiveProvider } from "@/lib/streaming"

export async function GET() {
  try {
    const provider = getActiveProvider()
    const health = await provider.getServerHealth()

    if (!health) {
      return NextResponse.json({ error: "Unable to reach streaming server" }, { status: 503 })
    }

    return NextResponse.json({
      healthy: true,
      backendName: provider.backendName,
      backendType: provider.backendType,
      stats: health,
    })
  } catch (error) {
    console.error("Failed to fetch streaming stats:", error)
    return NextResponse.json(
      { healthy: false, error: "Failed to fetch server stats" },
      { status: 500 },
    )
  }
}
