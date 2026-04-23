import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { verifyInstamojoPayment, processSuccessfulPayment } from "@/lib/payment-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { paymentRequestId, paymentId, orderId } = body as {
      paymentRequestId?: string
      paymentId?: string
      orderId?: string
    }

    if (!paymentRequestId || !orderId) {
      return NextResponse.json({ error: "paymentRequestId and orderId are required" }, { status: 400 })
    }

    const sql = getDb()

    // Look up the order to get the owner's userId — we do NOT require a session cookie here because
    // the Instamojo cross-site redirect can drop SameSite cookies on some browsers/configurations.
    // Security: orderId is a private UUID only present in our redirect URL, and we still verify
    // with the Instamojo API that a real payment was made.
    const orderRows = await sql`
      SELECT o.id, o.user_id, o.total_price, o.status, o.payment_gateway, o.order_type, u.role AS user_role
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ${orderId} LIMIT 1
    ` as Record<string, unknown>[]

    if (orderRows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orderRows[0]
    const userId = order.user_id as string

    const userRole = order.user_role as string | undefined
    const walletPath = userRole === "studio" ? "/studio/wallet" : "/streamer/wallet"

    if (order.status === "completed") {
      // Already processed (e.g., by webhook) — return success so the callback page redirects properly
      return NextResponse.json({ success: true, message: "Payment already verified successfully", walletPath })
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order status is '${order.status}' — only pending orders can be verified` },
        { status: 409 },
      )
    }

    // Verify with Instamojo API
    const result = await verifyInstamojoPayment(paymentRequestId)
    const payments = (result.payment_request?.payments || result.payments || []) as Record<string, unknown>[]
    const successfulPayment = payments.find((p) => p.status === "Credit")

    if (!successfulPayment) {
      await sql`UPDATE orders SET status = 'failed', updated_at = NOW() WHERE id = ${orderId} AND status = 'pending'`
      return NextResponse.json({ error: "Payment not found or not successful" }, { status: 400 })
    }

    const amount = Number(order.total_price ?? 0)

    const { invoiceId } = await processSuccessfulPayment({
      orderId,
      userId,
      gateway: "instamojo",
      gatewayPaymentId: (paymentId || successfulPayment.payment_id || successfulPayment.id) as string,
      gatewayOrderId: paymentRequestId,
      amount,
    })

    return NextResponse.json({ success: true, message: "Payment verified successfully", invoiceId, walletPath })
  } catch (error) {
    console.error("Instamojo verification error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
