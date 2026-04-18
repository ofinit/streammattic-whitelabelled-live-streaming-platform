"use client"

import Link from "next/link"
import useSWR from "swr"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { calendarDaysUntilSubscriptionEnd } from "@/lib/studio-subscription-shared"

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) return null
  return data
}

type PgStatus = {
  eligible?: boolean
  adminEnabled?: boolean
  optIn?: boolean
  entitled?: boolean
  subscriptionExpiresAt?: string | null
}

export function PhotoGalleryRenewalBanner({ packagesHref }: { packagesHref: string }) {
  const { user } = useAuth()
  const { data } = useSWR<PgStatus | null>(
    user?.role === "streamer" || user?.role === "studio" ? "/api/photo-gallery-addon/status" : null,
    fetcher,
    { revalidateOnFocus: true },
  )

  if (!data?.eligible || !data.adminEnabled || !data.optIn) return null
  const exp = data.subscriptionExpiresAt
  if (!exp) return null

  const daysLeft = calendarDaysUntilSubscriptionEnd(exp)
  const expired = !data.entitled

  if (!expired && daysLeft > 14) return null

  return (
    <Alert className="mb-4 border-amber-500/40 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-foreground">
        {expired ? "Client photo gallery subscription expired" : "Client photo gallery renewal soon"}
      </AlertTitle>
      <AlertDescription className="flex flex-col gap-3 text-foreground sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm">
          {expired
            ? "Add wallet funds and keep the service enabled under Packages to restore access."
            : daysLeft <= 0
              ? "Your subscription period ends today. Ensure your wallet can cover renewal."
              : `About ${daysLeft} calendar day${daysLeft === 1 ? "" : "s"} until renewal.`}
        </span>
        <Button type="button" variant="secondary" size="sm" className="shrink-0" asChild>
          <Link href={packagesHref}>Manage subscription</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
