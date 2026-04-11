import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { processSuccessfulPayment } from "@/lib/payment-service"
import crypto from "crypto"

export async function POST(req: Request) {
    const body = await req.text()
    const signature = req.headers.get("x-razorpay-signature")

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET

    if (!webhookSecret || !signature) {
        return NextResponse.json({ error: "Missing secret or signature" }, { status: 400 })
    }

    // Verify the webhook signature
    const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex")

    if (expectedSignature !== signature) {
        console.error("Invalid webhook signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const payload = JSON.parse(body)
    const event = payload.event

    if (event === "payment.captured" || event === "order.paid") {
        try {
            const paymentEntity = payload.payload.payment.entity
            const razorpayOrderId = paymentEntity.order_id
            const razorpayPaymentId = paymentEntity.id
            const amount = paymentEntity.amount

            if (!razorpayOrderId) {
                return NextResponse.json({ error: "No order ID in payload" }, { status: 400 })
            }

            const sql = getDb()

            // Find the order id based on razorpay order id stored possibly
            // Our application does not store gateway_order_id ahead of time in `orders` but we should probably look it up in `orders` table
            // Wait, how do we link Razorpay order ID to our internal order ID in the webhook?
            // Typically the internal orderId is stored in Razorpay notes
            const notes = paymentEntity.notes || {}
            const internalOrderId = notes.orderId

            if (!internalOrderId) {
                console.error("No internal orderId found in Razorpay notes")
                return NextResponse.json({ error: "No internal order id" }, { status: 400 })
            }

            // Check if order exists and user
            const orders = await sql`SELECT user_id, total_price FROM orders WHERE id = ${internalOrderId}`
            if (orders.length === 0) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 })
            }

            const orderUserId = (orders[0] as any).user_id

            await processSuccessfulPayment({
                orderId: internalOrderId,
                userId: orderUserId,
                gateway: "razorpay",
                gatewayPaymentId: razorpayPaymentId,
                gatewayOrderId: razorpayOrderId,
                amount: amount,
            })

            return NextResponse.json({ status: "ok" })
        } catch (e) {
            console.error("Failed processing razorpay webhook", e)
            return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
        }
    }

    return NextResponse.json({ status: "ignored" })
}
