import { NextResponse } from "next/server"
import { getActiveProvider } from "@/lib/streaming"
import { getSrsSettings, testSrsConnection } from "@/lib/srs-settings"

export async function GET() {
  try {
    const srsSettings = await getSrsSettings().catch(() => null)
    if (srsSettings?.enabled) {
      const health = await testSrsConnection(srsSettings)
      return NextResponse.json({
        healthy: health.ok,
        backendName: "SRS (Simple Realtime Server)",
        backendType: "srs",
        stats: {
          id: "server-srs",
          name: srsSettings.serverName,
          host: srsSettings.apiUrl,
          rtmpPort: srsSettings.rtmpPort,
          httpPort: srsSettings.httpPort,
          apiPort: srsSettings.httpPort,
          isActive: health.ok,
          isPrimary: true,
          maxStreams: 1000,
          currentStreams: 0,
          uptime: 0,
          activeStreams: 0,
          totalClients: 0,
          bandwidthIn: 0,
          bandwidthOut: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0,
          region: srsSettings.host,
        },
        message: health.message,
      })
    }

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
