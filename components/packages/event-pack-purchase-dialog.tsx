"use client"

import { useState } from "react"
import type { EventPack, ValidityTier, ValidityStreamKey } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Wallet, AlertCircle, Clock, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type React from "react"

interface StreamTypeInfo {
  key: ValidityStreamKey
  label: string
  icon: React.ElementType
  userPrice: number
  resellerPrice?: number
  enabled: boolean
}

interface EventPackPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pack: EventPack | null
  validityTiers: ValidityTier[]
  streamTypes: StreamTypeInfo[]
  walletBalance: number
  isReseller?: boolean
  onConfirm: (packId: string, validityDays: number) => void
}

export function EventPackPurchaseDialog({
  open,
  onOpenChange,
  pack,
  validityTiers,
  streamTypes,
  walletBalance,
  isReseller = false,
  onConfirm,
}: EventPackPurchaseDialogProps) {
  const [selectedValidity, setSelectedValidity] = useState(30)

  if (!pack) return null

  const packBasePrice = isReseller ? pack.resellerPrice : pack.userPrice
  const perEvent = packBasePrice / pack.eventCount

  // Calculate surcharge based on selected validity (use average across enabled stream types for packs)
  const enabledStreamTypes = streamTypes.filter((s) => s.enabled)
  let validitySurchargePerEvent = 0
  if (selectedValidity > 30) {
    const tier = validityTiers.find((t) => t.days === selectedValidity)
    if (tier) {
      const surcharges = enabledStreamTypes.map((st) =>
        isReseller ? tier.surcharges[st.key].resellerSurcharge : tier.surcharges[st.key].userSurcharge
      )
      validitySurchargePerEvent = surcharges.length > 0
        ? Math.round(surcharges.reduce((sum, s) => sum + s, 0) / surcharges.length)
        : 0
    }
  }

  const totalSurcharge = validitySurchargePerEvent * pack.eventCount
  const totalPrice = packBasePrice + totalSurcharge
  const hasInsufficientBalance = walletBalance * 100 < totalPrice

  const handleConfirm = () => {
    if (!hasInsufficientBalance) {
      onConfirm(pack.id, selectedValidity)
      onOpenChange(false)
      setSelectedValidity(30)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelectedValidity(30); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Purchase {pack.name}</DialogTitle>
          <DialogDescription>{pack.eventCount} events -- select event validity to complete your purchase.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Pack summary */}
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{pack.name}</p>
                <p className="text-xs text-muted-foreground">{pack.eventCount} events included</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{"₹"}{(packBasePrice / 100).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">{"₹"}{(perEvent / 100).toFixed(2)} per event</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Validity selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Event Validity</Label>
            </div>

            <RadioGroup
              value={selectedValidity.toString()}
              onValueChange={(v) => setSelectedValidity(Number(v))}
              className="space-y-2"
            >
              {/* 30 days -- free */}
              <label
                htmlFor="validity-30"
                className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                  selectedValidity === 30 ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="30" id="validity-30" />
                  <div>
                    <p className="text-sm font-medium">30 days</p>
                    <p className="text-[10px] text-muted-foreground">Default validity</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Included</Badge>
              </label>

              {/* Extended tiers */}
              {validityTiers.filter((t) => t.enabled).map((tier) => {
                const avgSurcharge = enabledStreamTypes.length > 0
                  ? enabledStreamTypes.reduce((sum, st) => sum + (isReseller ? tier.surcharges[st.key].resellerSurcharge : tier.surcharges[st.key].userSurcharge), 0) / enabledStreamTypes.length
                  : 0
                const tierTotalSurcharge = Math.round(avgSurcharge) * pack.eventCount

                return (
                  <label
                    key={tier.days}
                    htmlFor={`validity-${tier.days}`}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedValidity === tier.days ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={tier.days.toString()} id={`validity-${tier.days}`} />
                      <div>
                        <p className="text-sm font-medium">{tier.days} days</p>
                        <p className="text-[10px] text-muted-foreground">
                          +{"₹"}{(Math.round(avgSurcharge) / 100).toFixed(2)} avg per event
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">+{"₹"}{(tierTotalSurcharge / 100).toFixed(2)}</span>
                  </label>
                )
              })}
            </RadioGroup>
          </div>

          <Separator />

          {/* Price breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pack Price ({pack.eventCount} events)</span>
              <span>{"₹"}{(packBasePrice / 100).toFixed(2)}</span>
            </div>
            {totalSurcharge > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validity Surcharge ({selectedValidity} days)</span>
                <span>+{"₹"}{(totalSurcharge / 100).toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{"₹"}{(totalPrice / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Wallet */}
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Wallet Balance</span>
            </div>
            <span className="font-medium">{"₹"}{walletBalance.toLocaleString()}</span>
          </div>

          {hasInsufficientBalance && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Insufficient wallet balance. Please top up {"₹"}{((totalPrice / 100) - walletBalance).toFixed(2)} to complete this purchase.
              </AlertDescription>
            </Alert>
          )}

          {/* What's included */}
          <div className="rounded-lg bg-secondary/30 p-3 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">What you get:</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-primary" />
              <span>{pack.eventCount} events usable with any stream type</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-primary" />
              <span>{selectedValidity} days validity per event</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={hasInsufficientBalance}>
            Confirm Purchase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
