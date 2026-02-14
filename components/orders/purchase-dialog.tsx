"use client"

import { useState } from "react"
import type { Package } from "@/lib/types"
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
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Wallet, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg: Package | null
  effectivePrice?: number
  walletBalance: number
  onConfirm: (packageId: string, quantity: number) => void
}

export function PurchaseDialog({
  open,
  onOpenChange,
  pkg,
  effectivePrice,
  walletBalance,
  onConfirm,
}: PurchaseDialogProps) {
  const [quantity, setQuantity] = useState(1)

  if (!pkg) return null

  const price = effectivePrice ?? pkg.price
  const total = price * quantity
  const hasInsufficientBalance = walletBalance < total
  const minQty = pkg.minQty || 1
  const maxQty = pkg.maxQty || 100

  const handleConfirm = () => {
    if (!hasInsufficientBalance) {
      onConfirm(pkg.id, quantity)
      onOpenChange(false)
      setQuantity(1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase {pkg.name}</DialogTitle>
          <DialogDescription>Select the quantity and confirm your purchase.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="font-medium">{pkg.name}</div>
              <div className="text-sm text-muted-foreground">₹{price.toLocaleString()} / unit</div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.max(minQty, quantity - 1))}
                disabled={quantity <= minQty}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (val >= minQty && val <= maxQty) setQuantity(val)
                }}
                className="w-16 text-center"
                min={minQty}
                max={maxQty}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                disabled={quantity >= maxQty}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Unit Price</span>
              <span>₹{price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity</span>
              <span>×{quantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Wallet Balance</span>
            </div>
            <span className="font-medium">₹{walletBalance.toLocaleString()}</span>
          </div>

          {hasInsufficientBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient wallet balance. Please top up ₹{(total - walletBalance).toLocaleString()} to complete this
                purchase.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={hasInsufficientBalance}>
            Confirm Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
