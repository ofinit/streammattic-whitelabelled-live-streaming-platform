import nodemailer from "nodemailer"
import { Resend } from "resend"
import { getPlatformSetting, getStudioBranding } from "@/lib/db-queries"
import { resolvePlatformDisplayName } from "@/lib/platform-display-name"
import type { StudioBranding } from "@/lib/types"

function hasPlatformEmailProvider(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() || process.env.SMTP_HOST?.trim())
}

/** Shown when `sendEmail` returns false (Resend or SMTP failure). No secrets. */
export const EMAIL_SEND_FAILED_MESSAGE =
  "Could not send email. For Resend: set RESEND_API_KEY and RESEND_FROM with a verified domain. For SMTP: set SMTP_HOST, port, and credentials. Check server logs for [Resend] or [SMTP]."

const DEFAULT_MAIL_FROM = `"StreamLivee" <noreply@streamlivee.com>`

/**
 * Cleans `RESEND_FROM` / `SMTP_FROM` when env UIs add extra quotes or backslash-escaped quotes,
 * which otherwise produce malformed From headers in Resend request bodies.
 */
export function normalizeFromAddress(raw: string): string {
  let s = raw.trim()
  while (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    s = s.slice(1, -1).trim()
  }
  const angle = s.indexOf("<")
  if (angle > 0) {
    let name = s.slice(0, angle).trim()
    const addr = s.slice(angle).trim()
    name = name.replace(/^[\\"]+/g, "").replace(/[\\"]+$/g, "").replace(/\\"/g, '"')
    s = `${name} ${addr}`.trim()
  } else {
    s = s.replace(/^[\\"]+/g, "").replace(/[\\"]+$/g, "").trim()
  }
  if (!/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(s)) {
    return DEFAULT_MAIL_FROM
  }
  return s
}

/** Default app SMTP (Coolify / VPS). Port 587 = STARTTLS; 465 = implicit TLS. */
function createDefaultSmtpTransport(): nodemailer.Transporter {
  const port = Number(process.env.SMTP_PORT) || 587
  const secure =
    process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1" || port === 465

  const options = {
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 20000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 45000),
    // 587: upgrade with STARTTLS. 465: already TLS (secure: true).
    requireTLS: !secure && process.env.SMTP_REQUIRE_TLS !== "false",
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
      minVersion: "TLSv1.2" as const,
    },
    debug: process.env.SMTP_DEBUG === "1" || process.env.SMTP_DEBUG === "true",
    logger: process.env.SMTP_DEBUG === "1" || process.env.SMTP_DEBUG === "true",
  }

  return nodemailer.createTransport(options)
}

// Reusable transporter for the default platform SMTP
export const mailer = createDefaultSmtpTransport()

/**
 * Sends a generic email: Resend (HTTPS) when `RESEND_API_KEY` is set for platform mail,
 * else Nodemailer SMTP. Studio custom SMTP always uses Nodemailer.
 */
export async function sendEmail(to: string, subject: string, html: string, text?: string, studioId?: string) {
  let finalMailer = mailer
  let from = normalizeFromAddress(
    process.env.RESEND_FROM ||
      process.env.SMTP_FROM ||
      DEFAULT_MAIL_FROM,
  )
  let brandName = resolvePlatformDisplayName(await getPlatformSetting("platform_name"))

  // Check if studio has custom SMTP
  if (studioId) {
    const branding = await getStudioBranding(studioId) as StudioBranding | null
    if (branding && branding.smtpHost && branding.smtpUser && branding.smtpPassword) {
      console.log(`[SMTP] Using custom SMTP for studio ${studioId}: ${branding.smtpHost}`)
      const sPort = Number(branding.smtpPort) || 587
      const sSecure = branding.smtpSecure ?? sPort === 465
      finalMailer = nodemailer.createTransport({
        host: branding.smtpHost,
        port: sPort,
        secure: sSecure,
        auth: {
          user: branding.smtpUser,
          pass: branding.smtpPassword,
        },
        connectionTimeout: 20000,
        socketTimeout: 45000,
        requireTLS: !sSecure,
        tls: { minVersion: "TLSv1.2" as const },
      })
      brandName = branding.platformName || brandName
      from = normalizeFromAddress(
        branding.smtpFromEmail
          ? branding.smtpFromName
            ? `"${branding.smtpFromName}" <${branding.smtpFromEmail}>`
            : branding.smtpFromEmail
          : `"${brandName}" <${branding.smtpUser}>`,
      )
    }
  }

  from = normalizeFromAddress(from)

  if (finalMailer === mailer && process.env.RESEND_API_KEY?.trim()) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || "Please enable HTML to view this message.",
    })
    if (error) {
      console.error("[Resend] emails.send failed:", JSON.stringify(error))
      return false
    }
    console.log("[Resend] Message sent:", data?.id)
    return true
  }

  if (finalMailer === mailer && !hasPlatformEmailProvider()) {
    console.log(`\n======================================================`)
    console.log(`[EMAIL MOCK] Email to: ${to}`)
    console.log(`[EMAIL MOCK] Subject: ${subject}`)
    console.log(`[EMAIL MOCK] Brand: ${brandName}`)
    console.log(`[EMAIL MOCK] From: ${from}`)
    console.log(`[EMAIL MOCK] Set RESEND_API_KEY or SMTP_HOST to send real emails.`)
    console.log(`======================================================\n`)
    return true
  }

  try {
    const info = await finalMailer.sendMail({
      from,
      to,
      subject,
      text: text || "Please enable HTML to view this message.",
      html,
    })
    console.log("Message sent: %s", info.messageId)
    return true
  } catch (err: unknown) {
    const e = err as { message?: string; code?: string; command?: string; response?: string; stack?: string }
    console.error(
      "[SMTP] sendMail failed:",
      e?.message,
      "| code:",
      e?.code,
      "| command:",
      e?.command,
      "| response:",
      typeof e?.response === "string" ? e.response.slice(0, 200) : e?.response,
    )
    console.error("Nodemailer Email Error:", err)
    return false
  }
}

/**
 * Specialized function for sending the 6-digit OTP code securely
 */
export async function sendVerificationOTP(toEmail: string, otpCode: string, studioId?: string) {
  const brandName = resolvePlatformDisplayName(await getPlatformSetting("platform_name"))

  if (!hasPlatformEmailProvider() && !studioId) {
    console.log(`\n======================================================`)
    console.log(`[EMAIL VERIFICATION OTP] To: ${toEmail}`)
    console.log(`[EMAIL VERIFICATION OTP] Brand: ${brandName}`)
    console.log(`[EMAIL VERIFICATION OTP] Code: ${otpCode}`)
    console.log(`[EMAIL VERIFICATION OTP] Set RESEND_API_KEY or SMTP_HOST to send real email.`)
    console.log(`======================================================\n`)
    return true
  }

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #000; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${brandName}</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hello,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">You recently requested to update the email address associated with your account.</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">Your 6-digit verification code is:</p>
        
        <div style="margin: 32px 0; padding: 16px; background-color: #f4f4f5; text-align: center; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #000;">${otpCode}</span>
        </div>
        
        <p style="font-size: 14px; color: #666; line-height: 1.5;">This code will expire in 10 minutes. If you did not request this change, please ignore this email.</p>
      </div>
      <div style="background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
        &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
      </div>
    </div>
  `

  return sendEmail(
    toEmail, 
    `Your ${brandName} Verification Code`, 
    htmlTemplate, 
    `Your verification code is: ${otpCode}`,
    studioId
  )
}

export async function sendStudioSubscriptionRenewalReminder(params: {
  toEmail: string
  name: string
  daysLeft: number
  renewUrl: string
}) {
  const brandName = resolvePlatformDisplayName(await getPlatformSetting("platform_name"))
  const { toEmail, name, daysLeft, renewUrl } = params
  const when =
    daysLeft === 0
      ? "today"
      : daysLeft === 1
        ? "tomorrow"
        : `in ${daysLeft} days`

  const subject =
    daysLeft === 0
      ? `Your ${brandName} Studio plan renews ${when}`
      : `Reminder: Studio subscription renews ${when}`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <p style="font-size: 16px; color: #333;">Hi ${name || "there"},</p>
      <p style="font-size: 16px; color: #333; line-height: 1.5;">
        Your <strong>Studio annual subscription</strong> for ${brandName} ends <strong>${when}</strong>
        (${daysLeft === 0 ? "renew before the end of the period to avoid interruption" : `about ${daysLeft} calendar days remaining`}).
      </p>
      <p style="font-size: 16px; color: #333; line-height: 1.5;">
        Renew now to keep creating and editing events without interruption.
      </p>
      <p style="margin: 24px 0;">
        <a href="${renewUrl}" style="display: inline-block; padding: 12px 20px; background: #059669; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Renew Studio subscription</a>
      </p>
      <p style="font-size: 13px; color: #666;">If you already renewed, you can ignore this message.</p>
    </div>
  `

  const text = `Hi ${name || "there"}, your Studio annual subscription for ${brandName} renews ${when}. Renew: ${renewUrl}`

  return sendEmail(toEmail, subject, html, text)
}

/**
 * Password reset link (see /api/auth/forgot-password).
 */
export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  const brandName = resolvePlatformDisplayName(await getPlatformSetting("platform_name"))

  if (!hasPlatformEmailProvider()) {
    console.log(`\n======================================================`)
    console.log(`[PASSWORD RESET] To: ${toEmail}`)
    console.log(`[PASSWORD RESET] Brand: ${brandName}`)
    console.log(`[PASSWORD RESET] Link: ${resetUrl}`)
    console.log(`[PASSWORD RESET] Set RESEND_API_KEY or SMTP_HOST to send real email.`)
    console.log(`======================================================\n`)
    return true
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #000; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">${brandName}</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hello,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">We received a request to reset the password for your <strong>${brandName}</strong> account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background: #059669; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a>
        </p>
        <p style="font-size: 14px; color: #666; line-height: 1.5;">This link expires in one hour. If you did not request a reset, you can ignore this email.</p>
      </div>
      <div style="background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
        &copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.
      </div>
    </div>
  `

  const text = `Reset your ${brandName} password: ${resetUrl}`

  return sendEmail(toEmail, `${brandName} — Password reset`, html, text)
}
