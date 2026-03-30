"use client"

import useSWR from "swr"
import { TopUpDialog } from "@/components/wallet/top-up-dialog"
import { loadRazorpayScript, type RazorpayConstructor } from "@/lib/razorpay-checkout"
import { toast } from "sonner"

type GstConfigResponse = {
  gstEnabled?: boolean
  gstPercentage?: number
  minRechargeRupees?: number
  gstConfig?: import("@/lib/types").GSTConfiguration | null
}

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" })
  if (!r.ok) throw new Error("Failed to load settings")
  return r.json() as Promise<GstConfigResponse>
}

type CreatePaymentResponse = {
  order?: { id: string }
  gateway?: string
  razorpayOrderId?: string
  razorpayKeyId?: string
  amount?: number
  currency?: string
  prefill?: { name?: string; email?: string }
  paymentUrl?: string
  error?: string
}

export function WalletRechargeCheckout({
  open,
  onOpenChange,
  onPaidSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaidSuccess?: () => void
}) {
  const { data, error, isLoading } = useSWR(open ? "/api/gst/config" : null, fetcher)
  const gstConfig = data?.gstConfig ?? null
  const minRecharge = data?.minRechargeRupees ?? 500

  const handleConfirm = async (walletCreditPaise: number, gateway: string) => {
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        orderType: "wallet_recharge",
        walletCreditRupees: walletCreditPaise / 100,
        gateway,
        description: "Wallet recharge",
      }),
    })

    const payload = (await res.json().catch(() => ({}))) as CreatePaymentResponse & { error?: string }
    if (!res.ok) {
      toast.error(payload.error || "Could not start payment")
      throw new Error("create failed")
    }

    if (gateway === "instamojo" && payload.paymentUrl) {
      window.location.href = payload.paymentUrl
      return
    }

    if (gateway === "razorpay" && payload.razorpayOrderId && payload.razorpayKeyId && payload.order?.id) {
      await loadRazorpayScript()
      const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay
      if (!Razorpay) {
        toast.error("Razorpay failed to load")
        throw new Error("no rzp")
      }

      await new Promise<void>((resolve) => {
        const options: Record<string, unknown> = {
          key: payload.razorpayKeyId,
          amount: payload.amount,
          currency: payload.currency || "INR",
          name: "Wallet recharge",
          description: "Add funds to your wallet",
          order_id: payload.razorpayOrderId,
          prefill: payload.prefill,
          handler: async (response: {
            razorpay_payment_id: string
            razorpay_order_id: string
            razorpay_signature: string
          }) => {
            try {
              const verifyRes = await fetch("/api/payments/verify/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: payload.order!.id,
                }),
              })
              const verifyBody = (await verifyRes.json().catch(() => ({}))) as {
                error?: string
                invoiceId?: string | null
              }
              if (!verifyRes.ok) {
                toast.error(verifyBody.error || "Payment verification failed")
                resolve()
                return
              }
              toast.success("Payment successful — your wallet has been credited.")
              if (verifyBody.invoiceId) {
                window.open(`/api/invoices/${verifyBody.invoiceId}/pdf`, "_blank", "noopener,noreferrer")
              }
              onOpenChange(false)
              onPaidSuccess?.()
            } catch {
              toast.error("Verification request failed")
            } finally {
              resolve()
            }
          },
          modal: {
            ondismiss: () => resolve(),
          },
        }

        const rzp = new Razorpay(options)
        rzp.open()
      })
      return
    }

    toast.error("Unexpected payment response")
    throw new Error("bad response")
  }

  return (
    <TopUpDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={handleConfirm}
      gstConfig={gstConfig}
      minRechargeRupees={minRecharge}
      configLoading={isLoading}
      configError={error ? "Could not load tax settings. Refresh and try again." : undefined}
    />
  )
}
