import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { createRazorpayOrder, createInstamojoPayment } from "@/lib/payment-service"

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { orderType, amount, gateway, description } = body

  if (!orderType || !amount || !gateway) {
    return jsonError("orderType, amount, and gateway are required")
  }

  if (!["razorpay", "instamojo"].includes(gateway)) {
    return jsonError("Gateway must be 'razorpay' or 'instamojo'")
  }

  const sql = getDb()
  const userId = user.id as string
  const amountInPaise = Math.round(amount * 100)

  // Create order in DB
  const orderRows = await sql`
    INSERT INTO orders (user_id, order_type, amount, description, gateway, status)
    VALUES (${userId}, ${orderType}, ${amountInPaise}, ${description || `${orderType} payment`}, ${gateway}, 'pending')
    RETURNING *
  `
  const order = toCamel(orderRows[0] as Record<string, unknown>)

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

      // Store gateway order ID
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

    // Instamojo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "http://localhost:3000"
    const imPayment = await createInstamojoPayment({
      amount,
      purpose: description || `${orderType} payment`,
      buyerName: user.name as string,
      email: user.email as string,
      redirectUrl: `${baseUrl}/payment/callback?gateway=instamojo&orderId=${order.id}`,
      webhookUrl: `${baseUrl}/api/payments/webhook/instamojo`,
    })

    // Store gateway payment request ID
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
