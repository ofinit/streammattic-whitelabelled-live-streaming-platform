"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR from "swr"
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

export type StudioUpgradePayGateway = "wallet" | "razorpay" | "instamojo"

export type StudioUpgradePaymentPanelProps = {
  pricePaisa: number
  walletBalancePaise: number
  onPaidSuccess?: () => void
  /** Sync selection to parent (e.g. setup wizard validation) */
  selectedGateway: StudioUpgradePayGateway | ""
  onSelectedGatewayChange: (g: StudioUpgradePayGateway) => void
  /** If false, still show radios but omit primary pay / recharge actions */
  showActions?: boolean
  /** Outline cancel (e.g. dialog close) — rendered before pay actions */
  onCancel?: () => void
}

export function StudioUpgradePaymentPanel({
  pricePaisa,
  walletBalancePaise,
  onPaidSuccess,
  selectedGateway,
  onSelectedGatewayChange,
  showActions = true,
  onCancel,
}: StudioUpgradePaymentPanelProps) {
  const [busy, setBusy] = useState(false)
  const gateway = (selectedGateway || "wallet") as StudioUpgradePayGateway
  const setGateway = onSelectedGatewayChange
  const autoGatewayAppliedRef = useRef(false)

  const { data: gstData, error: gstError, isLoading: gstLoading } = useSWR("/api/gst/config", fetcher)
  const gstConfig = gstData?.gstConfig ?? null

  const gatewayBreakdown = useMemo(() => {
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

  const walletTotalPaise = pricePaisa
  const gatewayTotalPaise = Math.round(gatewayBreakdown.totalPayable * 100)
  const chargedTotalPaise = gateway === "wallet" ? walletTotalPaise : gatewayTotalPaise

  const walletShortfallWalletMode = Math.max(0, walletTotalPaise - walletBalancePaise)
  const walletCoversWalletMode = walletBalancePaise >= walletTotalPaise && walletTotalPaise > 0

  useEffect(() => {
    if (gstLoading || walletTotalPaise <= 0 || autoGatewayAppliedRef.current) return
    if (walletBalancePaise < walletTotalPaise) {
      setGateway("razorpay")
      autoGatewayAppliedRef.current = true
    }
  }, [gstLoading, walletTotalPaise, walletBalancePaise, setGateway])

  const payWithWallet = useCallback(async () => {
    if (!walletCoversWalletMode || walletTotalPaise <= 0) return
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
      onPaidSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payment failed")
    } finally {
      setBusy(false)
    }
  }, [walletCoversWalletMode, walletTotalPaise, onPaidSuccess])

  const startGatewayCheckout = useCallback(async () => {
    if (gatewayTotalPaise <= 0) return
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
  }, [gateway, gatewayTotalPaise, onPaidSuccess])

  const handlePrimaryPay = () => {
    if (gateway === "wallet") void payWithWallet()
    else void startGatewayCheckout()
  }

  const walletDisabled = !walletCoversWalletMode || walletTotalPaise <= 0
  const primaryDisabled =
    busy ||
    chargedTotalPaise <= 0 ||
    gstLoading ||
    (gateway === "wallet" && walletDisabled)

  return (
    <div className="space-y-4">
      {gstLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading tax settings…
        </div>
      )}
      {gstError && <p className="text-sm text-destructive">Could not load tax settings. Refresh and try again.</p>}

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Receipt className="h-4 w-4" />
          Price breakdown
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Studio subscription (catalog price)</span>
          <span className="tabular-nums">{formatPaisa(pricePaisa)}</span>
        </div>
        {gateway === "wallet" ? (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST</span>
            <span className="tabular-nums text-muted-foreground">Not charged (wallet)</span>
          </div>
        ) : (
          <>
            {gatewayBreakdown.gstEnabled && gatewayBreakdown.gstAmount > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({gatewayBreakdown.gstPercentage}%)</span>
                <span className="tabular-nums">{formatPaisa(Math.round(gatewayBreakdown.gstAmount * 100))}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST</span>
                <span className="tabular-nums text-muted-foreground">—</span>
              </div>
            )}
          </>
        )}
        <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
          <span>Total due</span>
          <span className="text-primary tabular-nums">{formatPaisa(chargedTotalPaise)}</span>
        </div>
        {gateway !== "wallet" && (
          <p className="text-xs text-muted-foreground">
            Razorpay and Instamojo are charged by the platform including GST where configured.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Pay with</Label>
        <RadioGroup
          value={gateway}
          onValueChange={(v) => setGateway(v as StudioUpgradePayGateway)}
          className="grid gap-2"
        >
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              gateway === "wallet" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
            }`}
          >
            <RadioGroupItem value="wallet" id="sup-wallet" />
            <Wallet className="h-5 w-5 text-emerald-500" />
            <div className="flex-1 text-left">
              <p className="font-medium">Wallet</p>
              <p className="text-xs text-muted-foreground">Balance: {formatPaisa(walletBalancePaise)} · no GST on this charge</p>
            </div>
          </label>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              gateway === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
            }`}
          >
            <RadioGroupItem value="razorpay" id="sup-rzp" />
            <CreditCard className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">Razorpay</p>
              <p className="text-xs text-muted-foreground">Cards, UPI, netbanking (platform gateway + GST if enabled)</p>
            </div>
          </label>
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              gateway === "instamojo" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
            }`}
          >
            <RadioGroupItem value="instamojo" id="sup-im" />
            <CreditCard className="h-5 w-5 text-violet-500" />
            <div>
              <p className="font-medium">Instamojo</p>
              <p className="text-xs text-muted-foreground">Redirect checkout (platform gateway + GST if enabled)</p>
            </div>
          </label>
        </RadioGroup>
      </div>

      {gateway === "wallet" && walletShortfallWalletMode > 0 && (
        <p className="text-xs text-destructive">
          Add {formatPaisa(walletShortfallWalletMode)} to your wallet for the subscription amount, or choose Razorpay /
          Instamojo.
        </p>
      )}

      {showActions && (
        <div className="flex flex-wrap items-center gap-2 justify-end">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="bg-transparent">
              Cancel
            </Button>
          ) : null}
          {gateway === "wallet" && walletShortfallWalletMode > 0 ? (
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/streamer/wallet">
                <Wallet className="mr-2 h-4 w-4" />
                Recharge wallet
              </Link>
            </Button>
          ) : (
            <Button type="button" onClick={() => void handlePrimaryPay()} disabled={primaryDisabled} className="min-w-[160px]">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : gateway === "wallet" ? (
                "Pay via wallet & activate Studio"
              ) : (
                "Continue to pay"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
