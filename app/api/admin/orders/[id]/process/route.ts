import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { verifyInstamojoPayment, processSuccessfulPayment } from "@/lib/payment-service"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(["admin"])

    const { id: orderId } = await params
    if (!orderId) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 })
    }

    let force = false
    let bodyGatewayPaymentId: string | undefined
    try {
      const body = await req.json() as { force?: boolean; gatewayPaymentId?: string }
      force = body.force === true
      bodyGatewayPaymentId = body.gatewayPaymentId || undefined
    } catch {
      // no body is fine — defaults to non-force
    }

    const sql = getDb()

    const rows = await sql`
      SELECT o.*, u.id AS u_id, u.name AS u_name, u.email AS u_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ${orderId}
      LIMIT 1
    ` as Record<string, unknown>[]

    if (rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = rows[0]

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Order is already ${order.status} — only pending orders can be processed` },
        { status: 409 },
      )
    }

    const gateway = (order.payment_gateway ?? order.gateway) as string | null
    if (!gateway || !["instamojo", "razorpay"].includes(gateway)) {
      return NextResponse.json(
        { error: `Cannot auto-process gateway '${gateway ?? "unknown"}'. Only instamojo and razorpay orders are supported.` },
        { status: 422 },
      )
    }

    const gatewayOrderId = (order.gateway_order_id as string | null) ?? ""
    const userId = order.user_id as string
    const orderType = order.order_type as string
    const totalPaise = Number(order.total_price ?? 0)

    let gatewayPaymentId: string

    if (force) {
      // Admin has confirmed payment externally — bypass Instamojo verification.
      gatewayPaymentId = bodyGatewayPaymentId || `ADMIN-FORCED-${orderId.slice(0, 8).toUpperCase()}`
    } else {
      if (!gatewayOrderId) {
        return NextResponse.json(
          { error: "Order has no gateway_order_id — use Force Process to bypass verification, or check your Instamojo dashboard." },
          { status: 422 },
        )
      }

      if (gateway === "instamojo") {
        let result: Record<string, unknown>
        try {
          result = await verifyInstamojoPayment(gatewayOrderId)
        } catch (err) {
          console.error("Instamojo re-verify error:", err)
          return NextResponse.json(
            { error: "Failed to reach Instamojo to verify payment. Check API credentials, or use Force Process." },
            { status: 502 },
          )
        }

        const payments =
          (result.payment_request as Record<string, unknown>)?.payments ??
          (result.payments as unknown[]) ??
          []
        const successful = (payments as Record<string, unknown>[]).find(
          (p) => p.status === "Credit",
        )
        if (!successful) {
          return NextResponse.json(
            { error: "Instamojo does not show a successful (Credit) payment for this request. Check your Instamojo dashboard and use Force Process if the payment was received.", forceAvailable: true },
            { status: 422 },
          )
        }
        gatewayPaymentId = (successful.payment_id ?? successful.id ?? gatewayOrderId) as string
      } else {
        gatewayPaymentId = gatewayOrderId
      }
    }

    const { invoiceId } = await processSuccessfulPayment({
      orderId,
      userId,
      gateway: gateway as "instamojo" | "razorpay",
      gatewayPaymentId,
      gatewayOrderId: gatewayOrderId || gatewayPaymentId,
      amount: totalPaise,
    })

    // Cancel any remaining pending orders of the same type for the same user
    // so they don't clutter the admin panel.
    await sql`
      UPDATE orders
      SET status = 'cancelled', updated_at = NOW()
      WHERE user_id = ${userId}
        AND order_type = ${orderType}
        AND status = 'pending'
        AND id != ${orderId}
    `

    return NextResponse.json({
      success: true,
      message: force
        ? "Order force-processed by admin. Account upgraded."
        : "Order processed successfully",
      invoiceId,
      user: { id: userId, name: order.u_name, email: order.u_email },
    })
  } catch (error: unknown) {
    console.error("Admin process order error:", error)
    const msg = error instanceof Error ? error.message : "Internal server error"
    if (msg === "Forbidden" || msg === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
