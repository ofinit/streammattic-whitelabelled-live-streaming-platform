import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { createRazorpayOrder, createInstamojoPayment } from "@/lib/payment-service"
import { getPlatformSetting } from "@/lib/db-queries"
import { parseStudioAnnualSubscription } from "@/lib/studio-subscription-public"
import { calculatePriceBreakdown } from "@/lib/gst-service"
import { getPlatformGSTSettings, toGSTCalculationConfig } from "@/lib/platform-gst"

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { orderType, amount, gateway, description } = body

  if (!orderType || !gateway) {
    return jsonError("orderType and gateway are required")
  }

  if (!["razorpay", "instamojo"].includes(gateway)) {
    return jsonError("Gateway must be 'razorpay' or 'instamojo'")
  }

  const role = user.role as string
  const sql = getDb()
  const userId = user.id as string

  let amountInPaise: number
  let orderMetadata: Record<string, unknown> = {}

  if (orderType === "studio_upgrade") {
    if (role !== "streamer") {
      return jsonError("Studio upgrade is only available for streamer accounts", 403)
    }
    const rawSub = await getPlatformSetting("studio_annual_subscription")
    const sub = parseStudioAnnualSubscription(rawSub)
    if (!sub || !sub.enabled || sub.pricePaisa <= 0) {
      return jsonError("Studio annual subscription is not available for purchase right now", 400)
    }
    amountInPaise = Math.round(sub.pricePaisa)
  } else if (orderType === "wallet_recharge") {
    if (role !== "streamer" && role !== "studio") {
      return jsonError("Wallet recharge is only available for streamer or studio accounts", 403)
    }
    const baseRupees = Number(body.walletCreditRupees ?? body.amount)
    if (!Number.isFinite(baseRupees) || baseRupees <= 0) {
      return jsonError("walletCreditRupees must be a positive number (amount to credit, excluding GST)", 400)
    }
    const gstSettings = await getPlatformGSTSettings()
    if (baseRupees < gstSettings.minRechargeRupees) {
      return jsonError(`Minimum wallet recharge is ₹${gstSettings.minRechargeRupees}`, 400)
    }
    const gstConfig = toGSTCalculationConfig(gstSettings)
    const breakdown = calculatePriceBreakdown(baseRupees, gstConfig)
    const walletCreditPaise = Math.round(breakdown.walletCreditAmount * 100)
    const gstAmountPaise = Math.round(breakdown.gstAmount * 100)
    const totalPaise = walletCreditPaise + gstAmountPaise
    amountInPaise = totalPaise
    orderMetadata = {
      walletCreditPaise,
      gstAmountPaise,
      gstPercentage: breakdown.gstPercentage,
      gstEnabled: breakdown.gstEnabled,
      walletBaseRupees: baseRupees,
    }
  } else {
    if (amount === undefined || amount === null) {
      return jsonError("amount is required for this order type")
    }
    amountInPaise = Math.round(Number(amount) * 100)
  }

  const metaJson = JSON.stringify(orderMetadata)

  // Create order in DB (metadata holds wallet credit vs GST for wallet_recharge)
  const orderRows = await sql`
    INSERT INTO orders (user_id, order_type, amount, description, gateway, status, metadata)
    VALUES (${userId}, ${orderType}, ${amountInPaise}, ${description || `${orderType} payment`}, ${gateway}, 'pending', ${metaJson}::jsonb)
    RETURNING *
  `
  const order = toCamel(orderRows[0] as Record<string, unknown>)

  const amountRupeesForInstamojo = amountInPaise / 100

  try {
    if (gateway === "razorpay") {
      const rzpOrder = await createRazorpayOrder({
        amount: amountInPaise,
        receipt: order.id as string,
        notes: {
          orderId: order.id as string,
          userId,
          orderType,
        },
      })

      await sql`UPDATE orders SET gateway_order_id = ${rzpOrder.id} WHERE id = ${order.id}`

      return jsonOk({
        order,
        gateway: "razorpay",
        razorpayOrderId: rzpOrder.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: amountInPaise,
        currency: "INR",
        prefill: {
          name: user.name,
          email: user.email,
        },
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "https://www.streamlivee.com"
    const flowParam =
      orderType === "studio_upgrade"
        ? "&flow=studio_upgrade"
        : orderType === "wallet_recharge"
          ? "&flow=wallet_recharge"
          : ""
    const imPayment = await createInstamojoPayment({
      amount: amountRupeesForInstamojo,
      purpose: description || `${orderType} payment`,
      buyerName: user.name as string,
      email: user.email as string,
      redirectUrl: `${baseUrl}/payment/callback?gateway=instamojo&orderId=${order.id}${flowParam}`,
      webhookUrl: `${baseUrl}/api/webhooks/instamojo`,
    })

    await sql`UPDATE orders SET gateway_order_id = ${imPayment.payment_request?.id || imPayment.id} WHERE id = ${order.id}`

    return jsonOk({
      order,
      gateway: "instamojo",
      paymentUrl: imPayment.payment_request?.longurl || imPayment.longurl,
      paymentRequestId: imPayment.payment_request?.id || imPayment.id,
    })
  } catch (error) {
    console.error("Payment creation error:", error)
    await sql`UPDATE orders SET status = 'failed' WHERE id = ${order.id}`
    return jsonError(`Payment creation failed: ${(error as Error).message}`, 500)
  }
})
