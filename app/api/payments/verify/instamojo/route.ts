import { getDb } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { verifyInstamojoPayment, processSuccessfulPayment } from "@/lib/payment-service"

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { paymentRequestId, paymentId, orderId } = body

  if (!paymentRequestId || !orderId) {
    return jsonError("paymentRequestId and orderId are required")
  }

  try {
    // Verify with Instamojo API
    const result = await verifyInstamojoPayment(paymentRequestId)
    const payments = result.payment_request?.payments || result.payments || []
    const successfulPayment = payments.find((p: Record<string, unknown>) => p.status === "Credit")

    if (!successfulPayment) {
      const sql = getDb()
      await sql`UPDATE orders SET status = 'failed' WHERE id = ${orderId}`
      return jsonError("Payment not found or not successful", 400)
    }

    const sql = getDb()
    const orderRows = await sql`SELECT amount FROM orders WHERE id = ${orderId}`
    const amount = orderRows.length > 0 ? (orderRows[0] as Record<string, unknown>).amount as number : 0

    const { invoiceId } = await processSuccessfulPayment({
      orderId,
      userId: user.id as string,
      gateway: "instamojo",
      gatewayPaymentId: paymentId || successfulPayment.payment_id,
      gatewayOrderId: paymentRequestId,
      amount,
    })

    return jsonOk({ success: true, message: "Payment verified successfully", invoiceId })
  } catch (error) {
    console.error("Instamojo verification error:", error)
    return jsonError("Verification failed", 500)
  }
})
