import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { processSuccessfulPayment } from "@/lib/payment-service"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const paymentId = formData.get("payment_id") as string
    const paymentRequestId = formData.get("payment_request_id") as string
    const status = formData.get("status") as string

    if (!paymentRequestId) {
      return NextResponse.json({ error: "Missing payment_request_id" }, { status: 400 })
    }

    const sql = getDb()

    // Find the order by gateway order ID
    const orderRows = await sql`SELECT * FROM orders WHERE gateway_order_id = ${paymentRequestId}`
    if (orderRows.length === 0) {
      console.error("Instamojo webhook: Order not found for payment request", paymentRequestId)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orderRows[0] as Record<string, unknown>

    if (status === "Credit") {
      // Payment successful
      await processSuccessfulPayment({
        orderId: order.id as string,
        userId: order.user_id as string,
        gateway: "instamojo",
        gatewayPaymentId: paymentId || paymentRequestId,
        gatewayOrderId: paymentRequestId,
        amount: order.amount as number,
      })
    } else {
      // Payment failed
      await sql`UPDATE orders SET status = 'failed', updated_at = NOW() WHERE id = ${order.id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Instamojo webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
