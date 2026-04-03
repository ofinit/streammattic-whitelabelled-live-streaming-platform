"use client"

import { useCallback, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { formatPaisa } from "@/lib/cascade-wallet-service"
import { CreditCard, Loader2, Wallet } from "lucide-react"
import { toast } from "sonner"

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

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("No window"))
      return
    }
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
      resolve()
      return
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Razorpay script failed")), { once: true })
      return
    }
    const s = document.createElement("script")
    s.src = "https://checkout.razorpay.com/v1/checkout.js"
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Failed to load Razorpay"))
    document.body.appendChild(s)
  })
}

type RazorpayConstructor = new (options: Record<string, unknown>) => { open: () => void }

export type StudioUpgradeCheckoutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Subscription price in paise (must match server setting) */
  pricePaisa: number
  /** After Razorpay verify succeeds */
  onPaidSuccess?: () => void
}

export function StudioUpgradeCheckoutDialog({
  open,
  onOpenChange,
  pricePaisa,
  onPaidSuccess,
}: StudioUpgradeCheckoutDialogProps) {
  const [gateway, setGateway] = useState<"razorpay" | "instamojo">("razorpay")
  const [busy, setBusy] = useState(false)

  const startCheckout = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderType: "studio_upgrade",
          amount: pricePaisa / 100,
          gateway,
          description: "Studio annual subscription — upgrade to white-label",
        }),
      })
      const data = (await res.json()) as CreatePaymentResponse & { error?: string }
      if (!res.ok) {
        toast.error(data.error || "Could not start payment")
        return
      }

      if (gateway === "instamojo" && data.paymentUrl) {
        window.location.href = data.paymentUrl
        return
      }

      if (gateway === "razorpay" && data.razorpayOrderId && data.razorpayKeyId && data.order?.id) {
        await loadRazorpayScript()
        const Razorpay = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay
        if (!Razorpay) {
          toast.error("Razorpay failed to load")
          return
        }

        const options: Record<string, unknown> = {
          key: data.razorpayKeyId,
          amount: data.amount,
          currency: data.currency || "INR",
          name: "Studio upgrade",
          description: "Annual studio subscription",
          order_id: data.razorpayOrderId,
          prefill: data.prefill,
          handler: async (response: {
            razorpay_payment_id: string
            razorpay_order_id: string
            razorpay_signature: string
          }) => {
            try {
              const verifyRes = await fetch("/api/payments/verify/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  orderId: data.order!.id,
                }),
              })
              const verifyBody = (await verifyRes.json().catch(() => ({}))) as { error?: string }
              if (!verifyRes.ok) {
                toast.error(verifyBody.error || "Payment verification failed")
                return
              }
              onOpenChange(false)
              onPaidSuccess?.()
            } catch {
              toast.error("Verification request failed")
            }
          },
          modal: {
            ondismiss: () => {
              setBusy(false)
            },
          },
        }

        const rzp = new Razorpay(options)
        rzp.open()
        return
      }

      toast.error("Unexpected payment response")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setBusy(false)
    }
  }, [gateway, onOpenChange, onPaidSuccess, pricePaisa])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Studio</DialogTitle>
          <DialogDescription>
            Pay {formatPaisa(pricePaisa)} for your annual studio subscription. You will get a Studio dashboard, custom
            domain setup, and white-label branding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">Total due</span>
            <p className="text-lg font-semibold text-foreground">{formatPaisa(pricePaisa)}</p>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <RadioGroup
              value={gateway}
              onValueChange={(v) => setGateway(v as "razorpay" | "instamojo")}
              className="grid gap-2"
            >
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  gateway === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="razorpay" id="su-razorpay" />
                <CreditCard className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Razorpay</p>
                  <p className="text-xs text-muted-foreground">Cards, UPI, NetBanking</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  gateway === "instamojo" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="instamojo" id="su-instamojo" />
                <Wallet className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Instamojo</p>
                  <p className="text-xs text-muted-foreground">Redirect to complete payment</p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void startCheckout()} disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Working…
              </>
            ) : (
              "Pay now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
