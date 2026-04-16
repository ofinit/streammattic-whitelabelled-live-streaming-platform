"use client"

import { useBranding } from "@/lib/branding-context"
import { StudioLandingPage } from "@/components/landing/studio-landing"
import { PlatformLandingPage } from "@/components/landing/platform-landing"

export default function RootPage() {
    const { isWhiteLabel } = useBranding()

    if (isWhiteLabel) {
        return <div className="dark"><StudioLandingPage /></div>
    }

    // If viewing from the default platform domain, show the SaaS Homepage
    return <div className="dark"><PlatformLandingPage /></div>
}
