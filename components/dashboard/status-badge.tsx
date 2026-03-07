import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "success" | "warning" | "error" | "info"
}

const variantStyles = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
  warning: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  error: "bg-destructive/20 text-destructive border-destructive/30",
  info: "bg-blue-500/20 text-blue-500 border-blue-500/30",
}

const statusToVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  active: "success",
  live: "success",
  completed: "info",
  approved: "success",
  pending: "warning",
  scheduled: "info",
  inactive: "default",
  suspended: "error",
  rejected: "error",
  cancelled: "error",
  draft: "default",
  verified: "success",
  failed: "error",
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const resolvedVariant = variant || statusToVariant[status.toLowerCase()] || "default"

  return (
    <Badge variant="outline" className={cn("capitalize", variantStyles[resolvedVariant])}>
      {status}
    </Badge>
  )
}
