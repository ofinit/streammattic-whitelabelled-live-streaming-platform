import nodemailer from "nodemailer"

// Create reusable transporter object using the default SMTP transport
export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Sends a generic email using Nodemailer
 */
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`\n======================================================`)
    console.log(`[SMTP MOCK] Email to: ${to}`)
    console.log(`[SMTP MOCK] Subject: ${subject}`)
    console.log(`[SMTP MOCK] Ensure SMTP_HOST is set in .env to send real emails!`)
    console.log(`======================================================\n`)
    return true // Assume success for local development if SMTP is missing
  }

  const from = process.env.SMTP_FROM || '"StreamLivee" <noreply@streamlivee.com>'
  
  try {
    const info = await mailer.sendMail({
      from,
      to,
      subject,
      text: text || "Please enable HTML to view this message.",
      html,
    })
    console.log("Message sent: %s", info.messageId)
    return true
  } catch (err) {
    console.error("Nodemailer Email Error:", err)
    return false
  }
}

/**
 * Specialized function for sending the 6-digit OTP code securely
 */
export async function sendVerificationOTP(toEmail: string, otpCode: string) {
  if (!process.env.SMTP_HOST) {
    console.log(`\n======================================================`)
    console.log(`[EMAIL VERIFICATION OTP] To: ${toEmail}`)
    console.log(`[EMAIL VERIFICATION OTP] Code: ${otpCode}`)
    console.log(`[EMAIL VERIFICATION OTP] Ensure SMTP_HOST is set to send via Nodemailer.`)
    console.log(`======================================================\n`)
    return true
  }

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #000; color: #fff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">StreamLivee</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333; margin-top: 0;">Hello,</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">You recently requested to update the email address associated with your StreamLivee account.</p>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">Your 6-digit verification code is:</p>
        
        <div style="margin: 32px 0; padding: 16px; background-color: #f4f4f5; text-align: center; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #000;">${otpCode}</span>
        </div>
        
        <p style="font-size: 14px; color: #666; line-height: 1.5;">This code will expire in 10 minutes. If you did not request this change, please ignore this email.</p>
      </div>
      <div style="background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #9ca3af;">
        &copy; ${new Date().getFullYear()} StreamLivee. All rights reserved.
      </div>
    </div>
  `

  return sendEmail(
    toEmail, 
    "Your StreamLivee Verification Code", 
    htmlTemplate, 
    `Your StreamLivee email change verification code is: ${otpCode}`
  )
}
