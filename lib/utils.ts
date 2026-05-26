import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// <CHANGE> Added utility functions from spec
export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Format a paise value as rupees (divides by 100 then formats as INR currency). */
export function formatPaisa(paise: number, currency = "INR"): string {
  return formatCurrency(paise / 100, currency)
}

export function formatDate(date: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return "—"
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(d)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

/**
 * Event list / dashboards: show scheduled start with clock time and timezone label.
 * Uses the event's IANA timezone when provided (matches watch page behavior).
 */
export function formatEventScheduledDisplay(
  scheduledAt: string | Date,
  timezone?: string | null,
  short = false
): string {
  const d = new Date(scheduledAt)
  if (Number.isNaN(d.getTime())) return ""
  const tzRaw = timezone != null ? String(timezone).trim() : ""
  const tz = tzRaw && tzRaw !== "UTC" ? tzRaw : undefined

  if (short) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...(tz ? { timeZone: tz } : {}),
    }).format(d)
  }

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...(tz ? { timeZone: tz } : {}),
    timeZoneName: "shortGeneric",
  }).format(d)
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-green-500/20 text-green-400",
    active: "bg-green-500/20 text-green-400",
    INACTIVE: "bg-muted text-muted-foreground",
    inactive: "bg-muted text-muted-foreground",
    SUSPENDED: "bg-red-500/20 text-red-400",
    suspended: "bg-red-500/20 text-red-400",
    PENDING: "bg-yellow-500/20 text-yellow-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    APPROVED: "bg-green-500/20 text-green-400",
    approved: "bg-green-500/20 text-green-400",
    REJECTED: "bg-red-500/20 text-red-400",
    rejected: "bg-red-500/20 text-red-400",
    SUCCESS: "bg-green-500/20 text-green-400",
    success: "bg-green-500/20 text-green-400",
    FAILED: "bg-red-500/20 text-red-400",
    failed: "bg-red-500/20 text-red-400",
    DRAFT: "bg-muted text-muted-foreground",
    draft: "bg-muted text-muted-foreground",
    SCHEDULED: "bg-blue-500/20 text-blue-400",
    scheduled: "bg-blue-500/20 text-blue-400",
    LIVE: "bg-red-500/20 text-red-400",
    live: "bg-red-500/20 text-red-400",
    ENDED: "bg-muted text-muted-foreground",
    ended: "bg-muted text-muted-foreground",
    completed: "bg-muted text-muted-foreground",
    VERIFIED: "bg-green-500/20 text-green-400",
    verified: "bg-green-500/20 text-green-400",
    ADMIN: "bg-purple-500/20 text-purple-400",
    admin: "bg-purple-500/20 text-purple-400",
    STUDIO: "bg-blue-500/20 text-blue-400",
    studio: "bg-blue-500/20 text-blue-400",
    USER: "bg-muted text-muted-foreground",
    user: "bg-muted text-muted-foreground",
  }
  return colors[status] || "bg-muted text-muted-foreground"
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

export function getInitials(name: string): string {
  const parts = name.split(" ")
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function generateOrderNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const segment1 = Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
  const segment2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
  return `ORD-${segment1}-${segment2}`
}
