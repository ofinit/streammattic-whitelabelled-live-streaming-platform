import { getDb } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { verifyRazorpayPayment, processSuccessfulPayment } from "@/lib/payment-service"

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = body

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
    return jsonError("All Razorpay verification fields are required")
  }

  // Verify signature
  const isValid = await verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature })
  if (!isValid) {
    const sql = getDb()
    await sql`UPDATE orders SET status = 'failed' WHERE id = ${orderId}`
    return jsonError("Payment verification failed - invalid signature", 400)
  }

  // Get order amount and process payment
  const sql = getDb()
  const orderRows = await sql`SELECT amount FROM orders WHERE id = ${orderId}`
  const amount = orderRows.length > 0 ? (orderRows[0] as Record<string, unknown>).amount as number : 0

  await processSuccessfulPayment({
    orderId,
    userId: user.id as string,
    gateway: "razorpay",
    gatewayPaymentId: razorpayPaymentId,
    gatewayOrderId: razorpayOrderId,
    amount,
  })

  return jsonOk({ success: true, message: "Payment verified successfully" })
})
