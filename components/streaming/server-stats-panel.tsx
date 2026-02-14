"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { streamingService, type ServerStats } from "@/lib/streaming-service"
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Radio,
  Users,
  ArrowDown,
  ArrowUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react"

interface ServerStatsPanelProps {
  refreshInterval?: number
}

export function ServerStatsPanel({ refreshInterval = 10000 }: ServerStatsPanelProps) {
  const [stats, setStats] = useState<ServerStats | null>(null)
  const [isHealthy, setIsHealthy] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [serverStats, health] = await Promise.all([
          streamingService.getServerStats(),
          streamingService.healthCheck(),
        ])
        setStats(serverStats)
        setIsHealthy(health)
      } catch (error) {
        console.error("Failed to fetch server stats:", error)
        setIsHealthy(false)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval])

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  if (isLoading || !stats) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Server className="h-5 w-5 animate-pulse" />
            <span>Loading server status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Nimble Streamer Server
          </CardTitle>
          <Badge
            variant="outline"
            className={
              isHealthy
                ? "bg-green-500/20 text-green-500 border-green-500/30"
                : "bg-red-500/20 text-red-500 border-red-500/30"
            }
          >
            {isHealthy ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" />
                Healthy
              </>
            ) : (
              <>
                <XCircle className="mr-1 h-3 w-3" />
                Unhealthy
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Uptime
            </div>
            <p className="text-lg font-bold text-foreground">{formatUptime(stats.uptime)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Radio className="h-3 w-3" />
              Active Streams
            </div>
            <p className="text-lg font-bold text-foreground">{stats.activeStreams}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              Connected Clients
            </div>
            <p className="text-lg font-bold text-foreground">{stats.totalClients.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Network I/O
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center text-green-500">
                <ArrowDown className="h-3 w-3" />
                {stats.bandwidthIn.toFixed(0)} Mbps
              </span>
              <span className="flex items-center text-blue-500">
                <ArrowUp className="h-3 w-3" />
                {stats.bandwidthOut.toFixed(0)} Mbps
              </span>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Resource Usage</h4>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Cpu className="h-3 w-3" />
                  CPU
                </span>
                <span className="font-medium text-foreground">{stats.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={stats.cpuUsage} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Memory
                </span>
                <span className="font-medium text-foreground">{stats.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={stats.memoryUsage} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HardDrive className="h-3 w-3" />
                  Disk
                </span>
                <span className="font-medium text-foreground">{stats.diskUsage.toFixed(1)}%</span>
              </div>
              <Progress value={stats.diskUsage} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
