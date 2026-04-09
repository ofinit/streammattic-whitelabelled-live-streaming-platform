import { getDb, toCamel } from "@/lib/db"
import { jsonOk, jsonError, withAuth } from "@/lib/api-helpers"
import { createRazorpayOrder, createInstamojoPayment } from "@/lib/payment-service"
import { getPlatformSetting } from "@/lib/db-queries"
import { parseStudioAnnualSubscription } from "@/lib/studio-subscription-public"
import { calculatePriceBreakdown } from "@/lib/gst-service"
import { getPlatformGSTSettings, toGSTCalculationConfig } from "@/lib/platform-gst"
import { applyStudioUpgradeOrRenewalSql } from "@/lib/studio-subscription"

export const POST = withAuth(async (user, request) => {
  const body = await request.json()
  const { orderType, amount, gateway, description } = body

  if (!orderType || !gateway) {
    return jsonError("orderType and gateway are required")
  }

  if (!["razorpay", "instamojo", "wallet"].includes(gateway)) {
    return jsonError("Gateway must be 'razorpay', 'instamojo', or 'wallet'")
  }

  const role = user.role as string
  const sql = getDb()
  const userId = user.id as string

  let amountInPaise: number
  let orderMetadata: Record<string, unknown> = {}

  if (orderType === "studio_upgrade") {
    if (role !== "streamer" && role !== "studio") {
      return jsonError("Studio subscription payment is only available for streamer or studio accounts", 403)
    }
    const rawSub = await getPlatformSetting("studio_annual_subscription")
    const sub = parseStudioAnnualSubscription(rawSub)
    if (!sub || !sub.enabled || sub.pricePaisa <= 0) {
      return jsonError("Studio annual subscription is not available for purchase right now", 400)
    }
    const studioBasePaise = Math.round(sub.pricePaisa)
    const baseRupees = studioBasePaise / 100
    const gstSettings = await getPlatformGSTSettings()
    const gstConfig = toGSTCalculationConfig(gstSettings)
    const breakdown = calculatePriceBreakdown(baseRupees, gstConfig)
    const gatewayTotalPaise = Math.round(breakdown.totalPayable * 100)
    const gatewayGstPaise = Math.round(breakdown.gstAmount * 100)
    // Wallet pays catalog subscription only (no GST). Card/Instamojo pays platform total incl. GST.
    if (gateway === "wallet") {
      amountInPaise = studioBasePaise
      orderMetadata = {
        studioBasePaise,
        gstAmountPaise: 0,
        gstPercentage: 0,
        gstEnabled: false,
        studioUpgradeTaxMode: "wallet_exempt",
      }
    } else {
      amountInPaise = gatewayTotalPaise
      orderMetadata = {
        studioBasePaise,
        gstAmountPaise: gatewayGstPaise,
        gstPercentage: breakdown.gstPercentage,
        gstEnabled: breakdown.gstEnabled,
        studioUpgradeTaxMode: "gateway_includes_gst",
      }
    }
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
    if (gateway === "wallet") {
      // 1. Verify balance
      const walletRows = await sql`SELECT balance FROM wallets WHERE user_id = ${userId}`
      if (walletRows.length === 0) return jsonError("Wallet not found", 404)
      const currentBalance = (walletRows[0] as Record<string, unknown>).balance as number
      
      if (currentBalance < amountInPaise) {
        return jsonError(`Insufficient wallet balance. Total due: ₹${(amountInPaise/100).toFixed(2)}, Balance: ₹${(currentBalance/100).toFixed(2)}`, 400)
      }

      // 2. Atomic update: Deduct, Create Order (completed), Create Payment, Create Transaction, Upgrade User
      const { withTransaction } = await import("@/lib/db")
      await withTransaction(async (tx) => {
        // A. Insert order (completed)
        const orderRows = await tx.query(`
          INSERT INTO orders (user_id, order_type, amount, description, gateway, status, metadata, completed_at)
          VALUES ($1, $2, $3, $4, 'wallet', 'completed', $5::jsonb, NOW())
          RETURNING id
        `, [userId, orderType, amountInPaise, description || `${orderType} payment`, metaJson])
        const orderId = (orderRows.rows[0] as Record<string, unknown>).id as string

        // B. Insert payment (completed)
        await tx.query(`
          INSERT INTO payments (order_id, user_id, gateway, amount, status, paid_at)
          VALUES ($1, $2, 'wallet', $3, 'completed', NOW())
        `, [orderId, userId, amountInPaise])

        // C. Deduct balance
        const updatedWallets = await tx.query(`
          UPDATE wallets 
          SET balance = balance - $1, updated_at = NOW() 
          WHERE user_id = $2
          RETURNING id, balance as new_balance
        `, [amountInPaise, userId])
        const wallet = updatedWallets.rows[0] as Record<string, unknown>
        
        // D. Insert wallet transaction
        await tx.query(`
          INSERT INTO wallet_transactions (
            wallet_id, user_id, type, category, amount, balance_before, balance_after,
            description, reference_id, reference_type, total_amount
          )
          VALUES (
            $1, $2, 'debit', 'whitelabel_hosting', $3, $4, $5,
            $6, $7, 'order', $8
          )
        `, [
          wallet.id,
          userId,
          'debit',
          amountInPaise,
          currentBalance,
          wallet.new_balance,
          description || "Studio annual subscription upgrade",
          orderId,
          amountInPaise
        ])

        // E. Studio upgrade or annual renewal (+1 year, streamer→studio role when applicable)
        if (orderType === "studio_upgrade") {
          await tx.query(applyStudioUpgradeOrRenewalSql(), [userId])

          await tx.query(`
            INSERT INTO studio_branding (user_id, platform_name)
            VALUES ($1, 'My Studio')
            ON CONFLICT (user_id) DO NOTHING
          `, [userId])

          await tx.query(`
            INSERT INTO notifications (user_id, type, title, message)
            VALUES ($1, 'payment', 'Studio subscription', 'Your Studio plan has been extended for one year. Thank you for staying with us!')
          `, [userId])
        }
      })

      return jsonOk({ success: true, message: "Upgrade successful! Welcome to Studio." })
    }

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
