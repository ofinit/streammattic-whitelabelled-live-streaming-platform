import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { processSuccessfulPayment } from "@/lib/payment-service"
import crypto from "crypto"

export async function POST(req: Request) {
    const formData = await req.formData()
    const payload: Record<string, string> = {}

    formData.forEach((value, key) => {
        payload[key] = value.toString()
    })

    // Validate the MAC if salt is configured
    const macKey = process.env.INSTAMOJO_MAC_SALT || ""
    if (macKey && payload.mac) {
        const data = Object.keys(payload)
            .filter(k => k !== "mac")
            .sort()
            .map(k => payload[k])
            .join("|")

        const expectedMac = crypto
            .createHmac("sha1", macKey)
            .update(data)
            .digest("hex")

        if (expectedMac !== payload.mac) {
            console.error("Invalid Instamojo webhook signature")
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
        }
    }

    if (payload.status === "Credit") {
        try {
            const sql = getDb()
            const paymentRequestId = payload.payment_request_id

            const orders = await sql`SELECT id, user_id, amount FROM orders WHERE gateway_order_id = ${paymentRequestId}`

            if (orders.length > 0) {
                const order = orders[0] as any
                await processSuccessfulPayment({
                    orderId: order.id,
                    userId: order.user_id,
                    gateway: "instamojo",
                    gatewayPaymentId: payload.payment_id,
                    gatewayOrderId: paymentRequestId,
                    amount: order.amount
                })
                return NextResponse.json({ status: "ok" })
            } else {
                return NextResponse.json({ error: "Order not found" }, { status: 404 })
            }
        } catch (e) {
            console.error("Failed processing instamojo webhook", e)
            return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
        }
    }

    return NextResponse.json({ status: "ignored" })
}
