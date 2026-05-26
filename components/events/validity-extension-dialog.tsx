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
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Clock, AlertTriangle, Check } from "lucide-react"
import { formatCurrency } from "@/lib/cascade-wallet-service"
import { formatDate } from "@/lib/utils"

interface ValidityExtensionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  currentExpiry: Date
  walletBalance: number
  onExtend: (days: number, price: number) => void
}

const extensionOptions = [
  { days: 7, price: 299, label: "7 Days" },
  { days: 15, price: 499, label: "15 Days" },
  { days: 30, price: 799, label: "30 Days" },
  { days: 60, price: 1299, label: "60 Days" },
  { days: 90, price: 1699, label: "90 Days" },
]

export function ValidityExtensionDialog({
  open,
  onOpenChange,
  eventTitle,
  currentExpiry,
  walletBalance,
  onExtend,
}: ValidityExtensionDialogProps) {
  const [selectedOption, setSelectedOption] = useState<(typeof extensionOptions)[0] | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleExtend = async () => {
    if (!selectedOption) return

    setIsProcessing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onExtend(selectedOption.days, selectedOption.price)
    setIsProcessing(false)
    onOpenChange(false)
  }

  const canAfford = selectedOption ? walletBalance >= selectedOption.price : true
  const newExpiry = selectedOption
    ? new Date(currentExpiry.getTime() + selectedOption.days * 24 * 60 * 60 * 1000)
    : currentExpiry

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Extend Event Validity
          </DialogTitle>
          <DialogDescription>Extend the validity period for "{eventTitle}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Current Expiry</span>
            </div>
            <span className="font-medium">{formatDate(currentExpiry)}</span>
          </div>

          {/* Extension Options */}
          <div className="grid grid-cols-3 gap-2">
            {extensionOptions.map((option) => (
              <Card
                key={option.days}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedOption?.days === option.days ? "ring-2 ring-primary border-primary" : ""
                }`}
                onClick={() => setSelectedOption(option)}
              >
                <CardContent className="p-3 text-center">
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-primary font-medium">{formatCurrency(option.price)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* New Expiry Preview */}
          {selectedOption && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-primary" />
                <span>New Expiry</span>
              </div>
              <span className="font-medium text-primary">{formatDate(newExpiry)}</span>
            </div>
          )}

          {/* Wallet Balance */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Wallet Balance</span>
            <span className={canAfford ? "text-green-500" : "text-destructive"}>{formatCurrency(walletBalance)}</span>
          </div>

          {/* Insufficient Balance Warning */}
          {selectedOption && !canAfford && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Insufficient wallet balance. Please top up your wallet first.</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExtend} disabled={!selectedOption || !canAfford || isProcessing}>
            {isProcessing ? "Processing..." : selectedOption ? `Pay ${formatCurrency(selectedOption.price)}` : "Select"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
