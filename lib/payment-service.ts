import { getDb, toCamel } from "./db"

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

export async function processSuccessfulPayment(params: {
  orderId: string
  userId: string
  gateway: "razorpay" | "instamojo"
  gatewayPaymentId: string
  gatewayOrderId?: string
  amount: number // in paise
}) {
  const sql = getDb()

  // Ensure we don't process the same order twice by relying on atomic status update
  const updatedOrders = await sql`
    UPDATE orders 
    SET status = 'completed', updated_at = NOW() 
    WHERE id = ${params.orderId} AND status = 'pending'
    RETURNING *
  `

  if (updatedOrders.length === 0) {
    console.log(`Order ${params.orderId} already processed or not found.`);
    return;
  }

  const order = updatedOrders[0] as Record<string, unknown>
  const orderType = order.order_type as string

  // Create payment record
  await sql`
    INSERT INTO payments (order_id, user_id, gateway, gateway_payment_id, gateway_order_id, amount, status)
    VALUES (${params.orderId}, ${params.userId}, ${params.gateway}, ${params.gatewayPaymentId}, ${params.gatewayOrderId || null}, ${params.amount}, 'completed')
  `

  // Credit wallet for wallet recharges atomically
  if (orderType === "wallet_recharge") {
    // Atomic update, returning the old and new balance
    const updatedWallets = await sql`
      UPDATE wallets 
      SET balance = balance + ${params.amount}, updated_at = NOW() 
      WHERE user_id = ${params.userId}
      RETURNING id, balance as new_balance, balance - ${params.amount} as old_balance
    `

    if (updatedWallets.length > 0) {
      const wallet = updatedWallets[0] as Record<string, unknown>
      const newBalance = wallet.new_balance as number
      const oldBalance = wallet.old_balance as number

      await sql`
        INSERT INTO wallet_transactions (wallet_id, user_id, type, category, amount, balance_before, balance_after, description, reference_id, reference_type)
        VALUES (${wallet.id}, ${params.userId}, 'credit', 'top_up', ${params.amount}, ${oldBalance}, ${newBalance}, 'Wallet recharge via ${params.gateway}', ${params.orderId}, 'order')
      `
    }
  }

  // Handle studio upgrade
  if (orderType === "studio_upgrade") {
    await sql`UPDATE users SET role = 'studio', updated_at = NOW() WHERE id = ${params.userId}`
  }

  // Note: credit_purchases do not flow through processSuccessfulPayment 
  // because they are paid for using wallet balance directly (see /api/credits/purchase).
  // Other internal charges like validity_extension follow a similar wallet-based pattern.

  // Create notification
  await sql`
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (${params.userId}, 'payment', 'Payment Successful', ${'Your payment of Rs ' + (params.amount / 100).toFixed(2) + ' has been processed successfully.'})
  `
}
