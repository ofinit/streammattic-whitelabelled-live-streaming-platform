"use client"

import { useState } from "react"
import type { StreamTypeKey } from "@/lib/types"
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

const streamTypeLabels: Record<StreamTypeKey, string> = {
  rtmp: "RTMP Server",
  youtube_api: "YouTube API",
  youtube_embed: "YouTube Embed",
  third_party: "Third Party",
}

interface CreditPurchaseItem {
  id: string
  streamType: StreamTypeKey
  pricePerCredit: number
  minQty: number
  maxQty: number
}

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: CreditPurchaseItem | null
  walletBalance: number
  onConfirm: (streamType: StreamTypeKey, quantity: number) => void
}

export function PurchaseDialog({
  open,
  onOpenChange,
  item,
  walletBalance,
  onConfirm,
}: PurchaseDialogProps) {
  const [quantity, setQuantity] = useState(1)

  if (!item) return null

  const total = item.pricePerCredit * quantity
  const hasInsufficientBalance = walletBalance < total

  const handleConfirm = () => {
    if (!hasInsufficientBalance) {
      onConfirm(item.streamType, quantity)
      onOpenChange(false)
      setQuantity(1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase {streamTypeLabels[item.streamType]} Credits</DialogTitle>
          <DialogDescription>Select the quantity and confirm your purchase.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <div className="font-medium">{streamTypeLabels[item.streamType]}</div>
              <div className="text-sm text-muted-foreground">
                {"₹"}{(item.pricePerCredit / 100).toFixed(2)} / credit
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.max(item.minQty, quantity - 1))}
                disabled={quantity <= item.minQty}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (val >= item.minQty && val <= item.maxQty) setQuantity(val)
                }}
                className="w-16 text-center"
                min={item.minQty}
                max={item.maxQty}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.min(item.maxQty, quantity + 1))}
                disabled={quantity >= item.maxQty}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Unit Price</span>
              <span>{"₹"}{(item.pricePerCredit / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantity</span>
              <span>x{quantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{"₹"}{(total / 100).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Wallet Balance</span>
            </div>
            <span className="font-medium">{"₹"}{(walletBalance / 100).toLocaleString("en-IN")}</span>
          </div>

          {hasInsufficientBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient wallet balance. Please top up {"₹"}{((total - walletBalance) / 100).toLocaleString("en-IN")} to complete this purchase.
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
