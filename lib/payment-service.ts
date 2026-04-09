import { getDb } from "./db"
import { splitGST } from "@/lib/gst-service"
import { getPlatformGSTSettings } from "@/lib/platform-gst"

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

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY || ""
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN || ""
const INSTAMOJO_BASE_URL = process.env.INSTAMOJO_BASE_URL || "https://api.instamojo.com/v2"

function instamojoHeaders() {
  return {
    "Content-Type": "application/json",
    "X-Api-Key": INSTAMOJO_API_KEY,
    "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
  }
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
  const res = await fetch(`${INSTAMOJO_BASE_URL}/payment_requests/`, {
    method: "POST",
    headers: instamojoHeaders(),
    body: JSON.stringify({
      amount: params.amount.toFixed(2),
      purpose: params.purpose,
      buyer_name: params.buyerName,
      email: params.email,
      phone: params.phone || "",
      redirect_url: params.redirectUrl,
      webhook: params.webhookUrl,
      send_email: false,
      allow_repeated_payments: false,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Instamojo payment creation failed: ${err}`)
  }

  return res.json()
}

export async function verifyInstamojoPayment(paymentRequestId: string) {
  const res = await fetch(`${INSTAMOJO_BASE_URL}/payment_requests/${paymentRequestId}/`, {
    headers: instamojoHeaders(),
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

function invoiceNumberFromOrderId(orderId: string): string {
  return `INV-${orderId.replace(/-/g, "").slice(0, 20).toUpperCase()}`
}

export async function processSuccessfulPayment(params: {
  orderId: string
  userId: string
  gateway: "razorpay" | "instamojo"
  gatewayPaymentId: string
  gatewayOrderId?: string
  /** Total charged in paise; should match orders.amount */
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
  const totalPaise = Number(order.amount ?? params.amount)
  const meta = parseWalletOrderMetadata(order.metadata)

  const paymentRows = await sql`
    INSERT INTO payments (order_id, user_id, gateway, gateway_payment_id, gateway_order_id, amount, status)
    VALUES (${params.orderId}, ${params.userId}, ${params.gateway}, ${params.gatewayPaymentId}, ${params.gatewayOrderId || null}, ${totalPaise}, 'completed')
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
      const invNum = invoiceNumberFromOrderId(params.orderId)

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
          'tax_invoice',
          'platform',
          ${platform.businessName},
          ${platform.gstNumber || null},
          ${issuerAddr || null},
          ${params.userId},
          ${u.role},
          ${u.name},
          ${u.email},
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
    await sql`UPDATE users SET role = 'studio', updated_at = NOW() WHERE id = ${params.userId}`
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
      const invNum = invoiceNumberFromOrderId(params.orderId)

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
          'tax_invoice',
          'platform',
          ${platform.businessName},
          ${platform.gstNumber || null},
          ${issuerAddr || null},
          ${params.userId},
          ${u.role},
          ${u.name},
          ${u.email},
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
      ? "Welcome to Studio! Complete setup under Studio → Setup Wizard to configure branding and your domain."
      : orderType === "wallet_recharge"
        ? `₹${(walletCreditPaise / 100).toFixed(2)} has been added to your wallet.`
        : `Your payment of Rs ${(totalPaise / 100).toFixed(2)} has been processed successfully.`

  await sql`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (${params.userId}, 'payment', 'Payment Successful', ${notifMessage})
  `

  return { invoiceId }
}
