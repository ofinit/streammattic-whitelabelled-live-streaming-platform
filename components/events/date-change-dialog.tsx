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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertTriangle, Info } from "lucide-react"
import { formatCurrency } from "@/lib/cascade-wallet-service"

interface DateChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventTitle: string
  currentDate: Date
  eventStatus: "draft" | "scheduled" | "live" | "completed"
  walletBalance: number
  onDateChange: (newDate: Date, reason: string, price: number) => void
}

// Date change pricing based on timing
const getDateChangePrice = (status: string, currentDate: Date, newDate: Date): number => {
  const now = new Date()
  const hoursUntilEvent = (currentDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (status === "live") {
    return 1000 // Already live - highest cost
  }

  if (status === "scheduled") {
    if (hoursUntilEvent < 24) {
      return 500 // Less than 24 hours - medium-high cost
    } else if (hoursUntilEvent < 72) {
      return 300 // Less than 3 days - medium cost
    } else {
      return 200 // More than 3 days - lower cost
    }
  }

  return 0 // Draft - free to change
}

export function DateChangeDialog({
  open,
  onOpenChange,
  eventTitle,
  currentDate,
  eventStatus,
  walletBalance,
  onDateChange,
}: DateChangeDialogProps) {
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [reason, setReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const parsedNewDate = newDate && newTime ? new Date(`${newDate}T${newTime}`) : null
  const price = parsedNewDate ? getDateChangePrice(eventStatus, currentDate, parsedNewDate) : 0
  const canAfford = walletBalance >= price
  const isFree = price === 0

  const handleDateChange = async () => {
    if (!parsedNewDate) return

    setIsProcessing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onDateChange(parsedNewDate, reason, price)
    setIsProcessing(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Change Event Date
          </DialogTitle>
          <DialogDescription>Reschedule "{eventTitle}" to a new date and time</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Date */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Current Date</span>
            </div>
            <div className="text-right">
              <span className="font-medium">{currentDate.toLocaleDateString()}</span>
              <span className="text-muted-foreground ml-2">
                {currentDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          {/* Event Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Event Status</span>
            <Badge
              variant={eventStatus === "live" ? "destructive" : eventStatus === "scheduled" ? "default" : "secondary"}
            >
              {eventStatus.charAt(0).toUpperCase() + eventStatus.slice(1)}
            </Badge>
          </div>

          {/* New Date/Time Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="newDate">New Date</Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newTime">New Time</Label>
              <Input id="newTime" type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to change the date..."
              rows={2}
            />
          </div>

          {/* Pricing Info */}
          {parsedNewDate && (
            <>
              {isFree ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Free Change</AlertTitle>
                  <AlertDescription>Date changes are free for draft events.</AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span>Date Change Fee</span>
                    </div>
                    <span className="font-semibold text-amber-500">{formatCurrency(price)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your Wallet Balance</span>
                    <span className={canAfford ? "text-green-500" : "text-destructive"}>
                      {formatCurrency(walletBalance)}
                    </span>
                  </div>

                  {!canAfford && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>Insufficient wallet balance. Please top up your wallet first.</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDateChange} disabled={!parsedNewDate || (!isFree && !canAfford) || isProcessing}>
            {isProcessing
              ? "Processing..."
              : isFree
                ? "Change Date"
                : parsedNewDate
                  ? `Pay ${formatCurrency(price)}`
                  : "Select Date"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
