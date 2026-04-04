"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import useSWR from "swr"
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

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function ServerStatsPanel({ refreshInterval = 10000 }: ServerStatsPanelProps) {
  const { data, isLoading } = useSWR("/api/streaming/stats", fetcher, {
    refreshInterval,
    revalidateOnFocus: false,
  })

  const stats = data?.stats ?? null
  const isHealthy = data?.healthy ?? false
  const backendName = data?.backendName ?? "Streaming Server"

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
            {backendName} Server
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
            <p className="text-lg font-bold text-foreground">{(stats.totalClients ?? 0).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Network I/O
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center text-green-500">
                <ArrowDown className="h-3 w-3" />
                {(stats.bandwidthIn ?? 0).toFixed(0)} Mbps
              </span>
              <span className="flex items-center text-blue-500">
                <ArrowUp className="h-3 w-3" />
                {(stats.bandwidthOut ?? 0).toFixed(0)} Mbps
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
                <span className="font-medium text-foreground">{(stats.cpuUsage ?? 0).toFixed(1)}%</span>
              </div>
              <Progress value={stats.cpuUsage ?? 0} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Memory
                </span>
                <span className="font-medium text-foreground">{(stats.memoryUsage ?? 0).toFixed(1)}%</span>
              </div>
              <Progress value={stats.memoryUsage ?? 0} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <HardDrive className="h-3 w-3" />
                  Disk
                </span>
                <span className="font-medium text-foreground">{(stats.diskUsage ?? 0).toFixed(1)}%</span>
              </div>
              <Progress value={stats.diskUsage ?? 0} className="h-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
