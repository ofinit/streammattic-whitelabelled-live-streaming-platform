"use client"

import { useSearchParams } from "next/navigation"
import { StudioSetupWizard } from "@/components/studio/studio-setup-wizard"

export const dynamic = "force-dynamic"

export default function StudioSetupPage() {
  const searchParams = useSearchParams()
  return (
    <StudioSetupWizard
      mode="page"
      forceSetupWizard={searchParams.get("force") === "1"}
      upgradedBanner={searchParams.get("upgraded") === "1"}
    />
  )
}
