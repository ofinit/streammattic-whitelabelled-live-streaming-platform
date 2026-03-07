"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TrendingUp, TrendingDown } from "lucide-react"

interface AdjustWalletDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount: number, type: "credit" | "debit", reason: string) => void
  targetUser: { id: string; name: string; balance: number }
}

export function AdjustWalletDialog({ open, onOpenChange, onConfirm, targetUser }: AdjustWalletDialogProps) {
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<"credit" | "debit">("credit")
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    const numAmount = Number.parseInt(amount) * 100
    if (numAmount > 0 && reason.trim()) {
      onConfirm(numAmount, type, reason)
      setAmount("")
      setReason("")
      setType("credit")
      onOpenChange(false)
    }
  }

  const newBalance =
    type === "credit"
      ? targetUser.balance + (Number.parseInt(amount) || 0) * 100
      : targetUser.balance - (Number.parseInt(amount) || 0) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Wallet Balance</DialogTitle>
          <DialogDescription>Manually adjust {targetUser.name}&apos;s wallet balance</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Balance */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-xl font-bold">₹{(targetUser.balance / 100).toLocaleString("en-IN")}</p>
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as "credit" | "debit")}
              className="grid grid-cols-2 gap-2"
            >
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                  type === "credit" ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="credit" id="credit" className="sr-only" />
                <TrendingUp className={`h-5 w-5 ${type === "credit" ? "text-emerald-500" : "text-muted-foreground"}`} />
                <span className={type === "credit" ? "text-emerald-500 font-medium" : ""}>Credit</span>
              </label>
              <label
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border p-3 transition-colors ${
                  type === "debit" ? "border-red-500 bg-red-500/10" : "border-border hover:bg-accent"
                }`}
              >
                <RadioGroupItem value="debit" id="debit" className="sr-only" />
                <TrendingDown className={`h-5 w-5 ${type === "debit" ? "text-red-500" : "text-muted-foreground"}`} />
                <span className={type === "debit" ? "text-red-500 font-medium" : ""}>Debit</span>
              </label>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="adjust-amount">Amount (₹)</Label>
            <Input
              id="adjust-amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* New Balance Preview */}
          {amount && (
            <div className="rounded-lg border border-dashed p-3">
              <p className="text-sm text-muted-foreground">New Balance</p>
              <p className={`text-xl font-bold ${newBalance < 0 ? "text-red-500" : "text-foreground"}`}>
                ₹{(newBalance / 100).toLocaleString("en-IN")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!amount || Number.parseInt(amount) <= 0 || !reason.trim() || (type === "debit" && newBalance < 0)}
            variant={type === "debit" ? "destructive" : "default"}
          >
            {type === "credit" ? "Add Funds" : "Deduct Funds"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
