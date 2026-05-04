import { NextResponse } from "next/server"
import { getActiveProvider } from "@/lib/streaming"
import { getStreamingSettings, testSrsConnection } from "@/lib/srs-settings"
import { listFiveCentsCdnPushServers } from "@/lib/streaming/fivecentscdn-service"

export async function GET() {
  try {
    const streamingSettings = await getStreamingSettings().catch(() => null)
    if (streamingSettings?.enabled) {
      if (streamingSettings.backendType === "fivecentscdn") {
        const data = await listFiveCentsCdnPushServers(streamingSettings)
        return NextResponse.json({
          healthy: true,
          backendName: "5CentsCDN",
          backendType: "fivecentscdn",
          stats: {
            id: "server-fivecentscdn",
            name: streamingSettings.serverName,
            host: streamingSettings.apiUrl,
            rtmpPort: streamingSettings.rtmpPort,
            httpPort: 443,
            apiPort: 443,
            isActive: true,
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
            region: "5CentsCDN",
          },
          message: "5CentsCDN API is reachable and responding",
          data,
        })
      }
      const health = await testSrsConnection(streamingSettings)
      return NextResponse.json({
        healthy: health.ok,
        backendName: "SRS (Simple Realtime Server)",
        backendType: "srs",
        stats: {
          id: "server-srs",
          name: streamingSettings.serverName,
          host: streamingSettings.apiUrl,
          rtmpPort: streamingSettings.rtmpPort,
          httpPort: streamingSettings.httpPort,
          apiPort: streamingSettings.httpPort,
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
          region: streamingSettings.host,
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
