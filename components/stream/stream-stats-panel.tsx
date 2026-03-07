"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Users, Eye, Clock, Wifi, HardDrive, Gauge, MonitorPlay } from "lucide-react"
import type { NimbleStreamStats } from "@/lib/types"

interface StreamStatsPanelProps {
  stats: NimbleStreamStats | null
  isLoading?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function StreamStatsPanel({ stats, isLoading }: StreamStatsPanelProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-6 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const healthColor = {
    excellent: "bg-green-500",
    good: "bg-green-400",
    fair: "bg-yellow-500",
    poor: "bg-orange-500",
    critical: "bg-red-500",
  }[stats.health.status]

  return (
    <div className="space-y-4">
      {/* Health Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Stream Health</span>
            </div>
            <Badge className={`${healthColor} text-white capitalize`}>{stats.health.status}</Badge>
          </div>
          <Progress value={stats.health.score} className="h-2" />
          {stats.health.issues.length > 0 && (
            <div className="mt-2 space-y-1">
              {stats.health.issues.map((issue, i) => (
                <p key={i} className={`text-xs ${issue.severity === "error" ? "text-red-400" : "text-yellow-400"}`}>
                  {issue.message}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Viewers</span>
            </div>
            <p className="text-2xl font-bold">{stats.currentViewers}</p>
            <p className="text-xs text-muted-foreground">Peak: {stats.peakViewers}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-xs font-medium">Total Views</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Uptime</span>
            </div>
            <p className="text-2xl font-bold">{formatDuration(stats.uptime)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gauge className="h-4 w-4" />
              <span className="text-xs font-medium">Bitrate</span>
            </div>
            <p className="text-2xl font-bold">{stats.bitrate ? `${(stats.bitrate / 1000).toFixed(1)} Mbps` : "--"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MonitorPlay className="h-4 w-4" />
              <span className="text-xs font-medium">Resolution</span>
            </div>
            <p className="text-lg font-bold">{stats.resolution || "--"}</p>
            <p className="text-xs text-muted-foreground">{stats.fps ? `${stats.fps} fps` : ""}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wifi className="h-4 w-4" />
              <span className="text-xs font-medium">Codec</span>
            </div>
            <p className="text-lg font-bold">{stats.codec.video || "--"}</p>
            <p className="text-xs text-muted-foreground">{stats.codec.audio || ""}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <HardDrive className="h-4 w-4" />
              <span className="text-xs font-medium">Data In</span>
            </div>
            <p className="text-lg font-bold">{formatBytes(stats.bytesIn)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <HardDrive className="h-4 w-4" />
              <span className="text-xs font-medium">Data Out</span>
            </div>
            <p className="text-lg font-bold">{formatBytes(stats.bytesOut)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
