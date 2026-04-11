"use client"

import { LegalPageShell } from "@/components/legal/legal-page-shell"

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="April 10, 2026">
      <p>
        This Privacy Policy describes how the StreamLivee platform (“we”, “us”, “our”) handles personal
        information when you use our websites, applications, and related services (collectively, the
        “Services”). By using the Services, you agree to this policy.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email address, phone number, password (stored securely;
          we do not store plaintext passwords where modern hashing is used), and role (e.g. streamer,
          studio, admin).
        </li>
        <li>
          <strong>Billing and tax (India):</strong> state, GST-related details you provide (such as GSTIN
          and business address), and transaction references needed for invoices and compliance.
        </li>
        <li>
          <strong>Usage and technical data:</strong> IP address, device/browser type, cookies or similar
          identifiers where applicable, and logs needed for security, debugging, and service
          improvement.
        </li>
        <li>
          <strong>Content you upload:</strong> images, stream metadata, event details, and other materials
          you choose to submit through the platform.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>Provide, operate, and improve the Services;</li>
        <li>Authenticate users, prevent fraud, and protect security;</li>
        <li>Process payments, wallet activity, and issue tax invoices where applicable;</li>
        <li>Communicate with you about your account, support requests, and important notices;</li>
        <li>Comply with legal obligations and respond to lawful requests.</li>
      </ul>

      <h2>3. Sharing of information</h2>
      <p>
        We do not sell your personal information. We may share data with service providers who assist us
        (e.g. hosting, email, payment gateways, analytics) under appropriate contracts and safeguards, or
        when required by law, court order, or to protect our rights and users.
      </p>

      <h2>4. Data retention</h2>
      <p>
        We retain information for as long as your account is active and as needed to provide the Services,
        meet legal, tax, and accounting requirements, and resolve disputes. Some aggregated or
        de-identified data may be retained longer.
      </p>

      <h2>5. Security</h2>
      <p>
        We implement technical and organizational measures designed to protect personal information.
        No method of transmission or storage is 100% secure; you use the Services at your own risk
        beyond what we reasonably control.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on applicable law, you may have the right to access, correct, delete, or restrict
        processing of your personal data, or to object to certain processing. Contact us using the
        details below to make a request. We may need to verify your identity before responding.
      </p>

      <h2>7. Children</h2>
      <p>
        The Services are not directed at children under the age required by applicable law for consent.
        We do not knowingly collect personal information from such children.
      </p>

      <h2>8. International transfers</h2>
      <p>
        If we process data across borders, we take steps consistent with applicable law to protect your
        information.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this Privacy Policy from time to time. We will post the revised version on this
        page and update the “Last updated” date. Continued use of the Services after changes constitutes
        acceptance of the updated policy where permitted by law.
      </p>

      <h2>10. Contact</h2>
      <p>
        For privacy-related questions or requests, contact us through the support channels listed on the
        platform or your account dashboard.
      </p>
    </LegalPageShell>
  )
}
