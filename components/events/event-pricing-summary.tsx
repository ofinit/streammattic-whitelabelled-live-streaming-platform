"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, X, AlertTriangle, Video, Youtube, Play, Globe, Facebook, Radio } from "lucide-react"
import type { StreamTypeKey } from "@/lib/types"
import { calculateEventPrice, validateCascade, formatCurrency, type AncestorInfo } from "@/lib/cascade-wallet-service"

interface EventPricingSummaryProps {
  streamType: StreamTypeKey
  simulcastDestinations: ("youtube" | "facebook" | "custom_rtmp")[]
  userBalance: number
  ancestorChain: AncestorInfo[]
  onValidationChange?: (isValid: boolean) => void
}

const streamTypeLabels: Record<StreamTypeKey, { name: string; icon: typeof Video }> = {
  rtmp: { name: "RTMP Server", icon: Video },
  youtube_api: { name: "YouTube API", icon: Youtube },
  youtube_embed: { name: "YouTube Embed", icon: Play },
  third_party: { name: "Third Party", icon: Globe },
}

const simulcastLabels: Record<string, { name: string; icon: typeof Youtube }> = {
  youtube: { name: "YouTube Live", icon: Youtube },
  facebook: { name: "Facebook Live", icon: Facebook },
  custom_rtmp: { name: "Custom RTMP", icon: Radio },
}

export function EventPricingSummary({
  streamType,
  simulcastDestinations,
  userBalance,
  ancestorChain,
  onValidationChange,
}: EventPricingSummaryProps) {
  // Calculate user-level pricing
  const userPricing = useMemo(() => {
    return calculateEventPrice(streamType, simulcastDestinations, "user")
  }, [streamType, simulcastDestinations])

  // Validate cascade
  const validation = useMemo(() => {
    const result = validateCascade(ancestorChain, streamType, simulcastDestinations)
    onValidationChange?.(result.isValid)
    return result
  }, [ancestorChain, streamType, simulcastDestinations, onValidationChange])

  const StreamIcon = streamTypeLabels[streamType]?.icon || Video

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Event Cost Summary
          {validation.isValid ? (
            <Badge variant="default" className="bg-green-500">
              <Check className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              Insufficient Funds
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Pay-per-event pricing breakdown</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stream Type */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StreamIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{streamTypeLabels[streamType]?.name}</span>
          </div>
          <span className="font-medium">{formatCurrency(userPricing.streamPrice)}</span>
        </div>

        {/* Simulcast Destinations */}
        {simulcastDestinations.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground uppercase">Simulcast Add-ons</span>
              {simulcastDestinations.map((dest) => {
                const label = simulcastLabels[dest]
                const Icon = label?.icon || Radio
                const price =
                  dest === "youtube"
                    ? userPricing.simulcastPrice / simulcastDestinations.length
                    : dest === "facebook"
                      ? userPricing.simulcastPrice / simulcastDestinations.length
                      : userPricing.simulcastPrice / simulcastDestinations.length

                return (
                  <div key={dest} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{label?.name}</span>
                    </div>
                    <span className="text-sm">{formatCurrency(price)}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Total */}
        <Separator />
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(userPricing.total)}</span>
        </div>

        {/* Wallet Balance */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your Wallet Balance</span>
          <span className={userBalance >= userPricing.total ? "text-green-500" : "text-destructive"}>
            {formatCurrency(userBalance)}
          </span>
        </div>

        {/* Validation Status */}
        {!validation.isValid && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cannot Create Event</AlertTitle>
            <AlertDescription>{validation.failureReason}</AlertDescription>
          </Alert>
        )}

        {/* Cascade Breakdown (collapsed by default, can be expanded) */}
        {validation.isValid && validation.levels.length > 1 && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              View cascade breakdown
            </summary>
            <div className="mt-2 space-y-2 text-xs">
              {validation.levels.map((level, idx) => (
                <div key={level.entityId} className="flex items-center justify-between py-1 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${level.hasEnough ? "bg-green-500" : "bg-destructive"}`} />
                    <span>{level.entityName}</span>
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {level.entityType}
                    </Badge>
                  </div>
                  <div className="text-right">
                    {level.entityType !== "admin" && (
                      <>
                        <div className="text-muted-foreground">Pays: {formatCurrency(level.requiredAmount)}</div>
                        {level.profitAmount > 0 && (
                          <div className="text-green-500">Profit: {formatCurrency(level.profitAmount)}</div>
                        )}
                      </>
                    )}
                    {level.entityType === "admin" && (
                      <div className="text-primary">
                        Receives: {formatCurrency(validation.levels[idx - 1]?.requiredAmount || 0)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  )
}
