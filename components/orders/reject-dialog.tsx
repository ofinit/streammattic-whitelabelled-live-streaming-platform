"use client"

import { useState } from "react"
import type { Order } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface RejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onConfirm: (orderId: string, reason: string) => void
}

export function RejectDialog({ open, onOpenChange, order, onConfirm }: RejectDialogProps) {
  const [reason, setReason] = useState("")

  if (!order) return null

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(order.id, reason.trim())
      onOpenChange(false)
      setReason("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Order</DialogTitle>
          <DialogDescription>Please provide a reason for rejecting order {order.orderNumber}.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>
            Reject Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
