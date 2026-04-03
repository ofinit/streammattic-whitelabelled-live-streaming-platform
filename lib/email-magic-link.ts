/**
 * Send magic link email. In production, wire to your SMTP/Resend/SendGrid.
 * When MAGIC_LINK_EMAIL_DEV is set or NODE_ENV is development, logs the link to console.
 */
export async function sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
  const isDev = process.env.MAGIC_LINK_EMAIL_DEV === "true" || process.env.NODE_ENV === "development"
  if (isDev) {
    console.log("[Magic link] To:", email, "Link:", magicLinkUrl)
    return
  }
  // Production: use Resend, SendGrid, or SMTP. Example placeholder:
  // await resend.emails.send({ from: '...', to: email, subject: 'Sign in to StreamLivee', html: `...<a href="${magicLinkUrl}">Sign in</a>...` })
  // For now in production without configured sender, we still log so deploy works
  console.log("[Magic link] To:", email, "Link:", magicLinkUrl)
}
