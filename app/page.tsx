"use client"

import { useBranding } from "@/lib/branding-context"
import { StudioLandingPage } from "@/components/landing/studio-landing"
import { PlatformLandingPage } from "@/components/landing/platform-landing"

export default function RootPage() {
    const { isWhiteLabel } = useBranding()

    if (isWhiteLabel) {
        return <StudioLandingPage />
    }

    // If viewing from the default platform domain, show the SaaS Homepage
    return <PlatformLandingPage />
}
