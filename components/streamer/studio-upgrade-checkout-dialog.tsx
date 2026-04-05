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
import Link from "next/link"

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
  /** User's current wallet balance in paise */
  walletBalancePaise: number
  /** After successful upgrade */
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
  const isInsufficient = walletBalancePaise < pricePaisa

  const startCheckout = useCallback(async () => {
    if (isInsufficient) return

    setBusy(true)
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
  }, [isInsufficient, onOpenChange, onPaidSuccess])

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
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-4">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Plan Cost</span>
            <p className="text-2xl font-bold text-foreground">{formatPaisa(pricePaisa)}</p>
          </div>

          <div className={`rounded-lg border p-4 space-y-2 ${isInsufficient ? "border-red-500/50 bg-red-500/5" : "border-emerald-500/50 bg-emerald-500/5"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">Your Wallet Balance</span>
              <span className={`text-sm font-mono font-bold ${isInsufficient ? "text-red-500" : "text-emerald-500"}`}>
                {formatPaisa(walletBalancePaise)}
              </span>
            </div>
            
            {isInsufficient && (
              <p className="text-xs text-red-500/80 leading-relaxed border-t border-red-500/10 pt-2">
                You need an additional <strong>{formatPaisa(pricePaisa - walletBalancePaise)}</strong> to upgrade. 
                Please recharge your wallet first.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy} className="bg-transparent">
            Cancel
          </Button>
          
          {isInsufficient ? (
            <Button className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/streamer/wallet">
                <Wallet className="mr-2 h-4 w-4" />
                Recharge wallet
              </Link>
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={() => void startCheckout()} 
              disabled={busy}
              className="bg-primary hover:bg-primary/90 min-w-[120px]"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                "Pay via Wallet"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
