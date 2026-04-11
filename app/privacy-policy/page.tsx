"use client"

import { LegalPageShell } from "@/components/legal/legal-page-shell"
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content"

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="April 10, 2026">
      <PrivacyPolicyContent />
    </LegalPageShell>
  )
}
