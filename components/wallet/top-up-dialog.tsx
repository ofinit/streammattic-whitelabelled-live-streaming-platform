"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CreditCard, Wallet, Receipt, Loader2 } from "lucide-react"
import { calculatePriceBreakdown } from "@/lib/gst-service"
import type { GSTConfiguration } from "@/lib/types"
import { toast } from "sonner"

interface TopUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number, gateway: string) => void | Promise<void>
  isAdmin?: boolean
  targetUser?: { id: string; name: string }
  gstConfig?: GSTConfiguration | null
  /** Minimum amount (₹) credited to wallet; enforced for non-admin recharge */
  minRechargeRupees?: number
  configLoading?: boolean
  configError?: string
}

const quickAmounts = [500, 1000, 2000, 5000, 10000]

export function TopUpDialog({
  open,
  onOpenChange,
  onConfirm,
  isAdmin = false,
  targetUser,
  gstConfig = null,
  minRechargeRupees = 500,
  configLoading = false,
  configError,
}: TopUpDialogProps) {
  const [amount, setAmount] = useState("")
  const [gateway, setGateway] = useState("razorpay")
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!open) {
      setAmount("")
      setPaying(false)
    }
  }, [open])

  const priceBreakdown = useMemo(() => {
    const numAmount = Number.parseFloat(amount) || 0
    if (numAmount <= 0) {
      return {
        desiredWalletAmount: 0,
        gstEnabled: false,
        gstPercentage: 0,
        baseAmount: 0,
        gstAmount: 0,
        totalPayable: 0,
        walletCreditAmount: 0,
      }
    }
    return calculatePriceBreakdown(numAmount, gstConfig)
  }, [amount, gstConfig])

  const handleConfirm = async () => {
    const numRupees = Number.parseFloat(amount) || 0
    if (!isAdmin && numRupees < minRechargeRupees) {
      toast.error(`Minimum deposit is ₹${minRechargeRupees.toLocaleString("en-IN")}`)
      return
    }
    const baseAmountInPaise = Math.round(priceBreakdown.baseAmount * 100)
    if (baseAmountInPaise <= 0) return

    if (isAdmin) {
      await Promise.resolve(onConfirm(baseAmountInPaise, gateway))
      setAmount("")
      onOpenChange(false)
      return
    }

    setPaying(true)
    try {
      await Promise.resolve(onConfirm(baseAmountInPaise, gateway))
      // Checkout (e.g. Razorpay) closes the dialog after successful verification; Instamojo redirects away.
    } catch {
      // Checkout surfaces errors
    } finally {
      setPaying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAdmin && targetUser ? `Recharge ${targetUser.name}'s wallet` : "Recharge wallet"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin ? "Add funds directly to the user's wallet" : "Add funds to your wallet using a payment gateway"}
          </DialogDescription>
          {!isAdmin && (
            <p className="text-sm text-muted-foreground pt-1">
              Minimum deposit ₹{minRechargeRupees.toLocaleString("en-IN")}/-
            </p>
          )}
          {configError && <p className="text-sm text-destructive pt-1">{configError}</p>}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quick Amount Buttons */}
          <div>
            <Label className="text-sm text-muted-foreground">Quick Select</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === String(amt) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(String(amt))}
                >
                  ₹{amt.toLocaleString("en-IN")}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount you want in wallet"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />
            <p className="text-xs text-muted-foreground">Enter the amount you want credited to your wallet</p>
          </div>

          {!isAdmin && amount && Number.parseFloat(amount) > 0 && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Receipt className="h-4 w-4" />
                Price Breakdown
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Wallet Credit</span>
                <span className="text-foreground">
                  ₹{priceBreakdown.baseAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {priceBreakdown.gstEnabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST ({priceBreakdown.gstPercentage}%)</span>
                  <span className="text-foreground">
                    ₹{priceBreakdown.gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2 flex justify-between text-sm font-semibold">
                <span className="text-foreground">Total Payable</span>
                <span className="text-primary">
                  ₹{priceBreakdown.totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-start gap-2 mt-3 p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-emerald-600 text-xs mt-0.5">✓</div>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  You will receive ₹
                  {priceBreakdown.walletCreditAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} in your
                  wallet after payment
                </p>
              </div>
            </div>
          )}

          {/* Payment Gateway Selection */}
          {!isAdmin && (
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup value={gateway} onValueChange={setGateway} className="grid grid-cols-1 gap-2">
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    gateway === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
                  }`}
                >
                  <RadioGroupItem value="razorpay" id="razorpay" />
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
                  <RadioGroupItem value="instamojo" id="instamojo" />
                  <Wallet className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Instamojo</p>
                    <p className="text-xs text-muted-foreground">Cards, UPI, Wallets</p>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {isAdmin && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
              This will directly credit the wallet without any payment processing.
            </div>
          )}

          {!isAdmin && (
            <p className="text-xs text-muted-foreground">* All deposits are non-refundable.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={paying}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={
              paying ||
              configLoading ||
              !!configError ||
              !amount ||
              Number.parseFloat(amount) <= 0 ||
              (!isAdmin && (Number.parseFloat(amount) || 0) < minRechargeRupees)
            }
          >
            {paying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : isAdmin ? (
              "Add Funds"
            ) : (
              `Pay ₹${priceBreakdown.totalPayable ? priceBreakdown.totalPayable.toLocaleString("en-IN") : 0}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
