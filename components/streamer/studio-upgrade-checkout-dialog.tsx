"use client"

import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
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
import { calculatePriceBreakdown } from "@/lib/gst-service"
import type { GSTConfiguration } from "@/lib/types"
import { loadRazorpayScript, type RazorpayConstructor } from "@/lib/razorpay-checkout"
import { CreditCard, Loader2, Receipt, Wallet } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

type GstConfigResponse = {
  gstEnabled?: boolean
  gstPercentage?: number
  gstConfig?: GSTConfiguration | null
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

export type StudioUpgradeCheckoutDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-tax subscription amount in paise (must match server `studio_annual_subscription`) */
  pricePaisa: number
  walletBalancePaise: number
  onPaidSuccess?: () => void
}

export function StudioUpgradeCheckoutDialog({
  open,
  onOpenChange,
  pricePaisa,
  walletBalancePaise,
  onPaidSuccess,
}: StudioUpgradeCheckoutDialogProps) {
  const [busy, setBusy] = useState(false)
  const [gateway, setGateway] = useState<"wallet" | "razorpay" | "instamojo">("wallet")

  const { data: gstData, error: gstError, isLoading: gstLoading } = useSWR(open ? "/api/gst/config" : null, fetcher)
  const gstConfig = gstData?.gstConfig ?? null

  const breakdown = useMemo(() => {
    const baseRupees = pricePaisa > 0 ? pricePaisa / 100 : 0
    if (baseRupees <= 0) {
      return {
        gstEnabled: false,
        gstPercentage: 0,
        baseAmount: 0,
        gstAmount: 0,
        totalPayable: 0,
      }
    }
    const b = calculatePriceBreakdown(baseRupees, gstConfig)
    return {
      gstEnabled: b.gstEnabled,
      gstPercentage: b.gstPercentage,
      baseAmount: b.baseAmount,
      gstAmount: b.gstAmount,
      totalPayable: b.totalPayable,
    }
  }, [pricePaisa, gstConfig])

  const totalPaise = Math.round(breakdown.totalPayable * 100)
  const walletShortfall = Math.max(0, totalPaise - walletBalancePaise)
  const walletCoversTotal = walletBalancePaise >= totalPaise && totalPaise > 0

  const payWithWallet = useCallback(async () => {
    if (!walletCoversTotal || totalPaise <= 0) return
    setBusy(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderType: "studio_upgrade",
          gateway: "wallet",
          description: "Studio annual subscription — upgrade to white-label",
        }),
      })
      const data = (await res.json()) as { success?: boolean; error?: string }
      if (!res.ok) {
        toast.error(data.error || "Could not process wallet payment")
        return
      }
      toast.success("Upgrade successful! Welcome to Studio.")
      onOpenChange(false)
      onPaidSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setBusy(false)
    }
  }, [walletCoversTotal, totalPaise, onOpenChange, onPaidSuccess])

  const startGatewayCheckout = useCallback(async () => {
    if (totalPaise <= 0) return
    setBusy(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderType: "studio_upgrade",
          gateway,
          description: "Studio annual subscription — upgrade to white-label",
        }),
      })
      const payload = (await res.json().catch(() => ({}))) as CreatePaymentResponse & { error?: string }
      if (!res.ok) {
        toast.error(payload.error || "Could not start payment")
        return
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
          return
        }
        await new Promise<void>((resolve) => {
          const options: Record<string, unknown> = {
            key: payload.razorpayKeyId,
            amount: payload.amount,
            currency: payload.currency || "INR",
            name: "Studio upgrade",
            description: "Annual studio subscription",
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
                const verifyBody = (await verifyRes.json().catch(() => ({}))) as { error?: string; invoiceId?: string }
                if (!verifyRes.ok) {
                  toast.error(verifyBody.error || "Payment verification failed")
                  resolve()
                  return
                }
                toast.success("Upgrade successful! Welcome to Studio.")
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
            modal: { ondismiss: () => resolve() },
          }
          const rzp = new Razorpay(options)
          rzp.open()
        })
        return
      }

      toast.error("Unexpected payment response")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setBusy(false)
    }
  }, [gateway, totalPaise, onOpenChange, onPaidSuccess])

  const handlePrimaryPay = () => {
    if (gateway === "wallet") void payWithWallet()
    else void startGatewayCheckout()
  }

  const walletDisabled = !walletCoversTotal || totalPaise <= 0
  const primaryDisabled =
    busy ||
    totalPaise <= 0 ||
    gstLoading ||
    (gateway === "wallet" && walletDisabled)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upgrade to Studio</DialogTitle>
          <DialogDescription>
            Pay for your annual studio subscription. You get a Studio dashboard, custom domain setup, and white-label
            branding. Tax is calculated from platform settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {gstLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tax settings…
            </div>
          )}
          {gstError && (
            <p className="text-sm text-destructive">Could not load tax settings. Refresh and try again.</p>
          )}

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Receipt className="h-4 w-4" />
              Price breakdown
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subscription (excl. GST)</span>
              <span className="tabular-nums">{formatPaisa(pricePaisa)}</span>
            </div>
            {breakdown.gstEnabled && breakdown.gstAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({breakdown.gstPercentage}%)</span>
                <span className="tabular-nums">
                  {formatPaisa(Math.round(breakdown.gstAmount * 100))}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span>Total due</span>
              <span className="text-primary tabular-nums">{formatPaisa(totalPaise)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <RadioGroup
              value={gateway}
              onValueChange={(v) => setGateway(v as "wallet" | "razorpay" | "instamojo")}
              className="grid gap-2"
            >
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  gateway === "wallet" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="wallet" id="su-wallet" />
                <Wallet className="h-5 w-5 text-emerald-500" />
                <div className="flex-1 text-left">
                  <p className="font-medium">Wallet</p>
                  <p className="text-xs text-muted-foreground">Balance: {formatPaisa(walletBalancePaise)}</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  gateway === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="razorpay" id="su-rzp" />
                <CreditCard className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Razorpay</p>
                  <p className="text-xs text-muted-foreground">Cards, UPI, netbanking</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  gateway === "instamojo" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="instamojo" id="su-im" />
                <CreditCard className="h-5 w-5 text-violet-500" />
                <div>
                  <p className="font-medium">Instamojo</p>
                  <p className="text-xs text-muted-foreground">Redirect to complete payment</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          {gateway === "wallet" && walletShortfall > 0 && (
            <p className="text-xs text-destructive">
              Add {formatPaisa(walletShortfall)} to your wallet to pay the total, or choose Razorpay / Instamojo.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="bg-transparent">
            Cancel
          </Button>
          {gateway === "wallet" && walletShortfall > 0 ? (
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/streamer/wallet">
                <Wallet className="mr-2 h-4 w-4" />
                Recharge wallet
              </Link>
            </Button>
          ) : (
            <Button type="button" onClick={() => void handlePrimaryPay()} disabled={primaryDisabled} className="min-w-[120px]">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : gateway === "wallet" ? (
                "Pay via Wallet"
              ) : (
                "Continue to pay"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
