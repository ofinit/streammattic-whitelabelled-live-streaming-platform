/** Shared body copy for /privacy-policy and inline modals (e.g. visitor gate). */
export function PrivacyPolicyContent() {
  return (
    <>
      <p>
        This Privacy Policy describes how the StreamLivee platform (“we”, “us”, “our”) handles personal
        information when you use our websites, applications, and related services (collectively, the
        “Services”). By using the Services, you agree to this policy.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">1. Information we collect</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
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
        <li>
          <strong>Event visitor details (when enabled by the event host):</strong> if an event requires
          registration before viewing, we collect the name, email, and phone number you submit, along
          with technical data such as IP address and browser information, and make these available to
          the hosting streamer or studio and to platform administrators as described in this policy.
        </li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-foreground">2. How we use information</h2>
      <p className="mt-2">We use personal information to:</p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>Provide, operate, and improve the Services;</li>
        <li>Authenticate users, prevent fraud, and protect security;</li>
        <li>Process payments, wallet activity, and issue tax invoices where applicable;</li>
        <li>Communicate with you about your account, support requests, and important notices;</li>
        <li>Comply with legal obligations and respond to lawful requests.</li>
      </ul>

      <h2 className="mt-6 text-base font-semibold text-foreground">3. Sharing of information</h2>
      <p className="mt-2">
        We do not sell your personal information. We may share data with service providers who assist us
        (e.g. hosting, email, payment gateways, analytics) under appropriate contracts and safeguards, or
        when required by law, court order, or to protect our rights and users.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">4. Data retention</h2>
      <p className="mt-2">
        We retain information for as long as your account is active and as needed to provide the Services,
        meet legal, tax, and accounting requirements, and resolve disputes. Some aggregated or
        de-identified data may be retained longer.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">5. Security</h2>
      <p className="mt-2">
        We implement technical and organizational measures designed to protect personal information.
        No method of transmission or storage is 100% secure; you use the Services at your own risk
        beyond what we reasonably control.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">6. Your rights</h2>
      <p className="mt-2">
        Depending on applicable law, you may have the right to access, correct, delete, or restrict
        processing of your personal data, or to object to certain processing. Contact us using the
        details below to make a request. We may need to verify your identity before responding.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">7. Children</h2>
      <p className="mt-2">
        The Services are not directed at children under the age required by applicable law for consent.
        We do not knowingly collect personal information from such children.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">8. International transfers</h2>
      <p className="mt-2">
        If we process data across borders, we take steps consistent with applicable law to protect your
        information.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">9. Changes</h2>
      <p className="mt-2">
        We may update this Privacy Policy from time to time. We will post the revised version on this
        page and update the “Last updated” date. Continued use of the Services after changes constitutes
        acceptance of the updated policy where permitted by law.
      </p>

      <h2 className="mt-6 text-base font-semibold text-foreground">10. Contact</h2>
      <p className="mt-2">
        For privacy-related questions or requests, contact us through the support channels listed on the
        platform or your account dashboard.
      </p>
    </>
  )
}
