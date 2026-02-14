"use client"

import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle, AlertTriangle, XCircle, AlertOctagon } from "lucide-react"

interface StreamHealthBadgeProps {
  health: "excellent" | "good" | "fair" | "poor" | "critical"
  showLabel?: boolean
}

export function StreamHealthBadge({ health, showLabel = true }: StreamHealthBadgeProps) {
  const config = {
    excellent: {
      icon: CheckCircle,
      label: "Excellent",
      className: "bg-green-500/20 text-green-500 border-green-500/30",
    },
    good: {
      icon: Activity,
      label: "Good",
      className: "bg-blue-500/20 text-blue-500 border-blue-500/30",
    },
    fair: {
      icon: AlertTriangle,
      label: "Fair",
      className: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    },
    poor: {
      icon: XCircle,
      label: "Poor",
      className: "bg-red-500/20 text-red-500 border-red-500/30",
    },
    critical: {
      icon: AlertOctagon,
      label: "Critical",
      className: "bg-red-600/30 text-red-400 border-red-500/50 animate-pulse",
    },
  }

  const { icon: Icon, label, className } = config[health]

  return (
    <Badge variant="outline" className={className}>
      <Icon className="mr-1 h-3 w-3" />
      {showLabel && label}
    </Badge>
  )
}
