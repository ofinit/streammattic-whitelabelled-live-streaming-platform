"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, X, AlertTriangle, Video, Youtube, Play, Globe, Facebook, Radio } from "lucide-react"
import type { StreamTypeKey, StreamTypeCredits } from "@/lib/types"
import { calculateEventCost, hasEnoughCredits, formatCurrency, getSimulcastPrice, getPricingDisplay } from "@/lib/cascade-wallet-service"

interface EventPricingSummaryProps {
  streamType: StreamTypeKey
  simulcastDestinations: ("youtube" | "facebook" | "custom_rtmp")[]
  userCredits: StreamTypeCredits
  userWalletBalance: number
  onValidationChange?: (isValid: boolean) => void
}

const streamTypeIcons: Record<StreamTypeKey, typeof Video> = {
  rtmp: Video,
  youtube_api: Youtube,
  youtube_embed: Play,
  third_party: Globe,
}

const simulcastLabels: Record<string, { name: string; icon: typeof Youtube }> = {
  youtube: { name: "YouTube Live", icon: Youtube },
  facebook: { name: "Facebook Live", icon: Facebook },
  custom_rtmp: { name: "Custom RTMP", icon: Radio },
}

export function EventPricingSummary({
  streamType,
  simulcastDestinations,
  userCredits,
  userWalletBalance,
  onValidationChange,
}: EventPricingSummaryProps) {
  const cost = useMemo(() => {
    return calculateEventCost(streamType, simulcastDestinations)
  }, [streamType, simulcastDestinations])

  const isValid = useMemo(() => {
    const creditCheck = hasEnoughCredits(userCredits, streamType, cost.creditsRequired)
    const walletCheck = userWalletBalance >= cost.simulcastWalletCost
    const valid = creditCheck && walletCheck
    onValidationChange?.(valid)
    return valid
  }, [userCredits, streamType, cost, userWalletBalance, onValidationChange])

  const StreamIcon = streamTypeIcons[streamType] || Video
  const pricingInfo = getPricingDisplay(streamType)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Event Cost Summary
          {isValid ? (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              Insufficient Resources
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Credits and wallet cost breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stream Type Credit */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StreamIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{pricingInfo.name}</span>
          </div>
          <div className="text-right">
            <span className="font-medium">{cost.creditsRequired} credit</span>
            <p className="text-[10px] text-muted-foreground">
              You have: {userCredits[streamType]}
            </p>
          </div>
        </div>

        {/* Simulcast Destinations */}
        {simulcastDestinations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase">Simulcast Add-ons (wallet charge)</span>
              {simulcastDestinations.map((dest) => {
                const label = simulcastLabels[dest]
                const Icon = label?.icon || Radio
                const price = getSimulcastPrice(dest)

                return (
                  <div key={dest} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{label?.name}</span>
                    </div>
                    <span className="text-sm">{formatCurrency(price / 100)}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Totals */}
        <Separator />
        <div className="space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span>Credits Required</span>
            <span className="text-primary">{cost.creditsRequired}</span>
          </div>
          {cost.simulcastWalletCost > 0 && (
            <div className="flex items-center justify-between font-semibold">
              <span>Wallet Charge</span>
              <span className="text-primary">{formatCurrency(cost.simulcastWalletCost / 100)}</span>
            </div>
          )}
        </div>

        {/* Validation */}
        {!isValid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cannot Create Event</AlertTitle>
            <AlertDescription>
              {!hasEnoughCredits(userCredits, streamType, cost.creditsRequired)
                ? `You need ${cost.creditsRequired} ${streamType.replace("_", " ")} credit(s) but have ${userCredits[streamType]}.`
                : `Insufficient wallet balance for simulcast charges.`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
