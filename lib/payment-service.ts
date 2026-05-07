import { getDb } from "./db"
import { emitCreditPurchasedFunnel } from "@/lib/analytics-funnel"
import { splitGST } from "@/lib/gst-service"
import { getNextInvoiceNumber } from "@/lib/invoice-numbering"
import { getPlatformGSTSettings } from "@/lib/platform-gst"
import { applyStudioUpgradeOrRenewal } from "@/lib/studio-subscription"

type Sql = ReturnType<typeof getDb>

async function getRecipientBillingForInvoice(sql: Sql, userId: string) {
  const gstRows = await sql`
    SELECT gst_number, business_address, city, state, pincode
    FROM gst_configurations WHERE user_id = ${userId} LIMIT 1
  `
  const g = gstRows[0] as Record<string, unknown> | undefined
  const gstRaw =
    typeof g?.gst_number === "string" ? g.gst_number.trim().toUpperCase() : ""
  const invoiceType = gstRaw.length > 0 ? "b2b" : "b2c"
  const parts = [g?.business_address, g?.city, g?.state, g?.pincode].filter(
    (x) => x != null && String(x).trim() !== "",
  ) as string[]
  const recipientAddress = parts.length > 0 ? parts.join(", ") : null
  return {
    recipientGstNumber: gstRaw || null,
    invoiceType,
    recipientAddress,
  }
}

// ============================================================
// RAZORPAY - Server-side order creation & verification
// ============================================================

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || ""
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || ""
const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1"

function razorpayHeaders() {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  }
}

export async function createRazorpayOrder(params: {
  amount: number // in paise
  currency?: string
  receipt: string
  notes?: Record<string, string>
}) {
  const res = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
    method: "POST",
    headers: razorpayHeaders(),
    body: JSON.stringify({
      amount: params.amount,
      currency: params.currency || "INR",
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Razorpay order creation failed: ${err}`)
  }

  return res.json()
}

export async function verifyRazorpayPayment(params: {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}) {
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(RAZORPAY_KEY_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body))
  const expectedSignature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("")
  return expectedSignature === params.razorpaySignature
}

export async function fetchRazorpayPayment(paymentId: string) {
  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/${paymentId}`, {
    headers: razorpayHeaders(),
  })
  if (!res.ok) throw new Error("Failed to fetch Razorpay payment")
  return res.json()
}

export async function initiateRazorpayRefund(paymentId: string, amount: number) {
  const res = await fetch(`${RAZORPAY_BASE_URL}/payments/${paymentId}/refund`, {
    method: "POST",
    headers: razorpayHeaders(),
    body: JSON.stringify({ amount }),
  })
  if (!res.ok) throw new Error("Razorpay refund failed")
  return res.json()
}

// ============================================================
// INSTAMOJO - Payment request creation & verification
// ============================================================
// Two supported integrations (do not mix credentials):
// 1) API v2 — OAuth2 client_credentials + Bearer on /v2/payment_requests/
//    https://docs.instamojo.com/reference/create-a-payment-request
// 2) API v1.1 (legacy) — X-Api-Key + X-Auth-Token on /api/1.1/payment-requests/
//    https://docs.instamojo.com/v1.1/reference/create-a-request
//
// "Private API Key" + "Private Auth Token" from the dashboard are v1.1 — not OAuth client_id/secret.
// INSTAMOJO_AUTH_MODE: auto (default) | oauth | legacy
// auto: OAuth if INSTAMOJO_CLIENT_ID and INSTAMOJO_CLIENT_SECRET are set; else legacy keys.

type InstamojoTokenCache = { accessToken: string; expiresAtMs: number }
let instamojoTokenCache: InstamojoTokenCache | null = null

function instamojoAuthMode(): "oauth" | "legacy" {
  const m = (process.env.INSTAMOJO_AUTH_MODE || "auto").trim().toLowerCase()
  if (m === "oauth") return "oauth"
  if (m === "legacy") return "legacy"
  const cid = (process.env.INSTAMOJO_CLIENT_ID || "").trim()
  const csec = (process.env.INSTAMOJO_CLIENT_SECRET || "").trim()
  if (cid && csec) return "oauth"
  return "legacy"
}

function instamojoV2Roots(): { v2Base: string; apiRoot: string } {
  const raw = (process.env.INSTAMOJO_BASE_URL || "https://api.instamojo.com/v2").replace(/\/$/, "")
  const v2Base = raw.includes("/v2") ? raw : `${raw}/v2`
  const apiRoot = raw.replace(/\/v2$/, "") || "https://api.instamojo.com"
  return { v2Base, apiRoot }
}

/** API v1.1 base (Private API Key auth). Sandbox: https://test.instamojo.com/api/1.1 */
function instamojoLegacyApiBase(): string {
  return (process.env.INSTAMOJO_LEGACY_BASE_URL || "https://www.instamojo.com/api/1.1").replace(/\/$/, "")
}

function instamojoLegacyHeaders(): Record<string, string> {
  const apiKey = (process.env.INSTAMOJO_API_KEY || "").trim()
  const authToken = (process.env.INSTAMOJO_AUTH_TOKEN || "").trim()
  if (!apiKey || !authToken) {
    throw new Error(
      "Instamojo legacy: set INSTAMOJO_API_KEY and INSTAMOJO_AUTH_TOKEN (Private API Key + Private Auth Token). For OAuth2 v2 instead, set INSTAMOJO_CLIENT_ID, INSTAMOJO_CLIENT_SECRET, and INSTAMOJO_AUTH_MODE=oauth.",
    )
  }
  return {
    "X-Api-Key": apiKey,
    "X-Auth-Token": authToken,
  }
}

function buildInstamojoPaymentRequestForm(params: {
  amount: number
  purpose: string
  buyerName: string
  email: string
  phone?: string
  redirectUrl: string
  webhookUrl?: string
}): URLSearchParams {
  const form = new URLSearchParams({
    amount: params.amount.toFixed(2),
    purpose: params.purpose,
    buyer_name: params.buyerName,
    email: params.email,
    phone: params.phone || "",
    redirect_url: params.redirectUrl,
    send_email: "false",
    send_sms: "false",
    allow_repeated_payments: "false",
  })
  if (params.webhookUrl) {
    form.set("webhook", params.webhookUrl)
  }
  return form
}

async function getInstamojoAccessToken(): Promise<string> {
  const clientId = (process.env.INSTAMOJO_CLIENT_ID || "").trim()
  const clientSecret = (process.env.INSTAMOJO_CLIENT_SECRET || "").trim()
  if (!clientId || !clientSecret) {
    throw new Error(
      "Instamojo OAuth: set INSTAMOJO_CLIENT_ID and INSTAMOJO_CLIENT_SECRET (not the Private API Key — those are for v1.1 / legacy mode).",
    )
  }

  const now = Date.now()
  const skewMs = 120_000
  if (instamojoTokenCache && instamojoTokenCache.expiresAtMs > now + skewMs) {
    return instamojoTokenCache.accessToken
  }

  const { apiRoot } = instamojoV2Roots()
  const tokenUrl = `${apiRoot.replace(/\/$/, "")}/oauth2/token/`
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Instamojo OAuth token failed: ${text}`)
  }

  const data = JSON.parse(text) as { access_token?: string; expires_in?: number }
  if (!data.access_token) {
    throw new Error(`Instamojo OAuth: missing access_token in response: ${text}`)
  }

  const expiresInSec = typeof data.expires_in === "number" ? data.expires_in : 3600
  instamojoTokenCache = {
    accessToken: data.access_token,
    expiresAtMs: now + expiresInSec * 1000,
  }
  return instamojoTokenCache.accessToken
}

async function instamojoBearerHeaders(): Promise<Record<string, string>> {
  const token = await getInstamojoAccessToken()
  return { Authorization: `Bearer ${token}` }
}

export async function createInstamojoPayment(params: {
  amount: number // in rupees (not paise)
  purpose: string
  buyerName: string
  email: string
  phone?: string
  redirectUrl: string
  webhookUrl?: string
}) {
  const mode = instamojoAuthMode()
  const form = buildInstamojoPaymentRequestForm(params)

  if (mode === "legacy") {
    const base = instamojoLegacyApiBase()
    const res = await fetch(`${base}/payment-requests/`, {
      method: "POST",
      headers: {
        ...instamojoLegacyHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    })
    const text = await res.text()
    let data: unknown
    try {
      data = JSON.parse(text) as Record<string, unknown>
    } catch {
      throw new Error(`Instamojo payment creation failed: ${text}`)
    }
    const o = data as { success?: boolean; message?: unknown }
    if (o.success === false) {
      throw new Error(`Instamojo payment creation failed: ${JSON.stringify(o.message ?? data)}`)
    }
    if (!res.ok) {
      throw new Error(`Instamojo payment creation failed: ${text}`)
    }
    return data
  }

  const { v2Base } = instamojoV2Roots()
  const auth = await instamojoBearerHeaders()
  const res = await fetch(`${v2Base}/payment_requests/`, {
    method: "POST",
    headers: {
      ...auth,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Instamojo payment creation failed: ${err}`)
  }

  return res.json()
}

export async function verifyInstamojoPayment(paymentRequestId: string) {
  const mode = instamojoAuthMode()
  if (mode === "legacy") {
    const base = instamojoLegacyApiBase()
    const res = await fetch(`${base}/payment-requests/${paymentRequestId}/`, {
      headers: {
        ...instamojoLegacyHeaders(),
        Accept: "application/json",
      },
    })
    if (!res.ok) throw new Error("Failed to fetch Instamojo payment status")
    return res.json()
  }

  const { v2Base } = instamojoV2Roots()
  const auth = await instamojoBearerHeaders()
  const res = await fetch(`${v2Base}/payment_requests/${paymentRequestId}/`, {
    headers: {
      ...auth,
      Accept: "application/json",
    },
  })
  if (!res.ok) throw new Error("Failed to fetch Instamojo payment status")
  return res.json()
}

// ============================================================
// COMMON: Process successful payment in DB
// ============================================================

type WalletOrderMetadata = {
  walletCreditPaise?: number
  studioBasePaise?: number
  gstAmountPaise?: number
  gstPercentage?: number
  gstEnabled?: boolean
}

function parseWalletOrderMetadata(raw: unknown): WalletOrderMetadata {
  if (!raw || typeof raw !== "object") return {}
  const o = raw as Record<string, unknown>
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined)
  return {
    walletCreditPaise: n(o.walletCreditPaise),
    studioBasePaise: n(o.studioBasePaise),
    gstAmountPaise: n(o.gstAmountPaise),
    gstPercentage: n(o.gstPercentage),
    gstEnabled: typeof o.gstEnabled === "boolean" ? o.gstEnabled : undefined,
  }
}

export async function processSuccessfulPayment(params: {
  orderId: string
  userId: string
  gateway: "razorpay" | "instamojo"
  gatewayPaymentId: string
  gatewayOrderId?: string
  /** Total charged in paise; should match orders.total_price */
  amount: number
}): Promise<{ invoiceId: string | null }> {
  const sql = getDb()

  const updatedOrders = await sql`
    UPDATE orders 
    SET status = 'completed', updated_at = NOW() 
    WHERE id = ${params.orderId} AND status = 'pending'
    RETURNING *
  `

  if (updatedOrders.length === 0) {
    console.log(`Order ${params.orderId} already processed or not found.`)
    return { invoiceId: null }
  }

  const order = updatedOrders[0] as Record<string, unknown>
  const orderType =
    (typeof order.order_type === "string" ? order.order_type : null) ??
    (typeof order.orderType === "string" ? order.orderType : null) ??
    ""
  const totalPaise = Number(
    order.total_price ?? order.totalPrice ?? order.amount ?? params.amount,
  )
  const meta = parseWalletOrderMetadata(order.metadata)

  const paymentRows = await sql`
    INSERT INTO payments (order_id, user_id, gateway, gateway_payment_id, gateway_order_id, amount, total_amount, status, paid_at)
    VALUES (${params.orderId}, ${params.userId}, ${params.gateway}, ${params.gatewayPaymentId}, ${params.gatewayOrderId || null}, ${totalPaise}, ${totalPaise}, 'completed', NOW())
    RETURNING id
  `
  const paymentId = (paymentRows[0] as Record<string, unknown>).id as string

  let walletCreditPaise = totalPaise
  let gstAmountPaise = 0
  let gstPercentage = 0
  let studioBasePaise = 0
  if (orderType === "wallet_recharge") {
    walletCreditPaise = meta.walletCreditPaise ?? totalPaise
    gstAmountPaise = meta.gstAmountPaise ?? Math.max(0, totalPaise - walletCreditPaise)
    gstPercentage = meta.gstPercentage ?? 0
  } else if (orderType === "studio_upgrade") {
    studioBasePaise = meta.studioBasePaise ?? Math.max(0, totalPaise - (meta.gstAmountPaise ?? 0))
    gstAmountPaise = meta.gstAmountPaise ?? Math.max(0, totalPaise - studioBasePaise)
    gstPercentage = meta.gstPercentage ?? 0
  }

  let invoiceId: string | null = null

  if (orderType === "wallet_recharge") {
    const updatedWallets = await sql`
      UPDATE wallets 
      SET balance = balance + ${walletCreditPaise}, updated_at = NOW() 
      WHERE user_id = ${params.userId}
      RETURNING id, balance as new_balance, balance - ${walletCreditPaise} as old_balance
    `

    if (updatedWallets.length > 0) {
      const wallet = updatedWallets[0] as Record<string, unknown>
      const newBalance = wallet.new_balance as number
      const oldBalance = wallet.old_balance as number

      await sql`
        INSERT INTO wallet_transactions (
          wallet_id, user_id, type, category, amount, balance_before, balance_after,
          description, reference_id, reference_type,
          base_amount, gst_amount, gst_percentage, total_amount
        )
        VALUES (
          ${wallet.id},
          ${params.userId},
          'credit',
          'top_up',
          ${walletCreditPaise},
          ${oldBalance},
          ${newBalance},
          ${`Wallet recharge via ${params.gateway} (credited excl. GST)`},
          ${params.orderId},
          'order',
          ${walletCreditPaise},
          ${gstAmountPaise},
          ${gstPercentage},
          ${totalPaise}
        )
      `
    }

    if (gstAmountPaise > 0) {
      const platform = await getPlatformGSTSettings()
      const userRows = await sql`SELECT name, email, role FROM users WHERE id = ${params.userId} LIMIT 1`
      const u =
        userRows.length > 0
          ? (userRows[0] as { name: string; email: string; role: string })
          : { name: "User", email: "", role: "streamer" }
      const { cgstAmount, sgstAmount, igstAmount } = splitGST(gstAmountPaise, false)
      const issuerAddr = [platform.businessAddress, platform.city, platform.state, platform.pincode]
        .filter(Boolean)
        .join(", ")
      const invNum = await getNextInvoiceNumber(sql)
      const bill = await getRecipientBillingForInvoice(sql, params.userId)

      const invRows = await sql`
        INSERT INTO invoices (
          invoice_number,
          invoice_type,
          issuer_type,
          issuer_business_name,
          issuer_gst_number,
          issuer_address,
          recipient_id,
          recipient_type,
          recipient_name,
          recipient_email,
          recipient_gst_number,
          recipient_address,
          base_amount,
          gst_percentage,
          cgst_amount,
          sgst_amount,
          igst_amount,
          total_gst_amount,
          total_amount,
          payment_id,
          payment_method,
          payment_date,
          status
        )
        VALUES (
          ${invNum},
          ${bill.invoiceType},
          'platform',
          ${platform.businessName},
          ${platform.gstNumber || null},
          ${issuerAddr || null},
          ${params.userId},
          ${u.role},
          ${u.name},
          ${u.email},
          ${bill.recipientGstNumber},
          ${bill.recipientAddress},
          ${walletCreditPaise},
          ${gstPercentage},
          ${cgstAmount},
          ${sgstAmount},
          ${igstAmount},
          ${gstAmountPaise},
          ${totalPaise},
          ${paymentId},
          ${params.gateway},
          NOW(),
          'paid'
        )
        RETURNING id
      `
      invoiceId = (invRows[0] as Record<string, unknown>).id as string
    }
  }

  if (orderType === "studio_upgrade") {
    await applyStudioUpgradeOrRenewal(params.userId)
    await sql`
      INSERT INTO studio_branding (user_id, platform_name)
      VALUES (${params.userId}, 'My Studio')
      ON CONFLICT (user_id) DO NOTHING
    `

    if (gstAmountPaise > 0 && studioBasePaise > 0) {
      const platform = await getPlatformGSTSettings()
      const userRows = await sql`SELECT name, email, role FROM users WHERE id = ${params.userId} LIMIT 1`
      const u =
        userRows.length > 0
          ? (userRows[0] as { name: string; email: string; role: string })
          : { name: "User", email: "", role: "streamer" }
      const { cgstAmount, sgstAmount, igstAmount } = splitGST(gstAmountPaise, false)
      const issuerAddr = [platform.businessAddress, platform.city, platform.state, platform.pincode]
        .filter(Boolean)
        .join(", ")
      const invNum = await getNextInvoiceNumber(sql)
      const bill = await getRecipientBillingForInvoice(sql, params.userId)

      const invRows = await sql`
        INSERT INTO invoices (
          invoice_number,
          invoice_type,
          issuer_type,
          issuer_business_name,
          issuer_gst_number,
          issuer_address,
          recipient_id,
          recipient_type,
          recipient_name,
          recipient_email,
          recipient_gst_number,
          recipient_address,
          base_amount,
          gst_percentage,
          cgst_amount,
          sgst_amount,
          igst_amount,
          total_gst_amount,
          total_amount,
          payment_id,
          payment_method,
          payment_date,
          status
        )
        VALUES (
          ${invNum},
          ${bill.invoiceType},
          'platform',
          ${platform.businessName},
          ${platform.gstNumber || null},
          ${issuerAddr || null},
          ${params.userId},
          ${u.role},
          ${u.name},
          ${u.email},
          ${bill.recipientGstNumber},
          ${bill.recipientAddress},
          ${studioBasePaise},
          ${gstPercentage},
          ${cgstAmount},
          ${sgstAmount},
          ${igstAmount},
          ${gstAmountPaise},
          ${totalPaise},
          ${paymentId},
          ${params.gateway},
          NOW(),
          'paid'
        )
        RETURNING id
      `
      invoiceId = (invRows[0] as Record<string, unknown>).id as string
    }
  }

  const notifMessage =
    orderType === "studio_upgrade"
      ? "Your Studio annual subscription is extended by one year. Finish or update setup anytime under Studio."
      : orderType === "wallet_recharge"
        ? `₹${(walletCreditPaise / 100).toFixed(2)} has been added to your wallet.`
        : `Your payment of Rs ${(totalPaise / 100).toFixed(2)} has been processed successfully.`

  await sql`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (${params.userId}, 'payment', 'Payment Successful', ${notifMessage})
  `

  if (orderType === "wallet_recharge" || orderType === "studio_upgrade") {
    await emitCreditPurchasedFunnel(params.userId, params.orderId, orderType, totalPaise)
  }

  return { invoiceId }
}
