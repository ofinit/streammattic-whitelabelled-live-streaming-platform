"use client"

import { useState } from "react"
import type { Order } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatDistanceToNow } from "date-fns"
import { CreditCard, Calendar, User, AlertTriangle, CheckCircle, Wallet, Wand2, Clock, Building2, RefreshCw, Zap } from "lucide-react"

const orderTypeLabels: Record<string, string> = {
  credit_purchase: "Credit Purchase",
  validity_extension: "Validity Extension",
  wallet_recharge: "Wallet Recharge",
  service_charge: "Service Charge",
  studio_upgrade: "Studio Upgrade",
  annual_subscription: "Annual Subscription",
}

const orderTypeIcons: Record<string, typeof CreditCard> = {
  credit_purchase: CreditCard,
  validity_extension: Clock,
  wallet_recharge: Wallet,
  service_charge: Wand2,
  studio_upgrade: Building2,
  annual_subscription: Calendar,
}

const streamTypeLabels: Record<string, string> = {
  rtmp: "RTMP",
  youtube_api: "YouTube API",
  youtube_embed: "YouTube Embed",
  third_party: "Third Party",
}

interface OrderCardProps {
  order: Order
  showUser?: boolean
  onProcess?: (orderId: string, force?: boolean) => Promise<void>
}

export function OrderCard({ order, showUser = false, onProcess }: OrderCardProps) {
  const [processing, setProcessing] = useState(false)
  const [forceProcessing, setForceProcessing] = useState(false)
  const [processResult, setProcessResult] = useState<{ ok: boolean; message: string; forceAvailable?: boolean } | null>(null)

  const handleProcess = async (force = false) => {
    if (!onProcess) return
    if (force) setForceProcessing(true)
    else setProcessing(true)
    setProcessResult(null)
    try {
      await onProcess(order.id as string, force)
      setProcessResult({ ok: true, message: force ? "Force-processed — account upgraded." : "Order processed — account upgraded." })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Processing failed."
      const forceAvailable = msg.includes("Force Process") || msg.includes("Instamojo does not show")
      setProcessResult({ ok: false, message: msg, forceAvailable })
    } finally {
      setProcessing(false)
      setForceProcessing(false)
    }
  }

  const TypeIcon = orderTypeIcons[order.orderType] || CreditCard

  const getTitle = () => {
    switch (order.orderType) {
      case "credit_purchase":
        return `${order.quantity}x ${streamTypeLabels[order.streamType || ""] || "Credits"}`
      case "validity_extension":
        return `Validity Extension - ${order.validityDays} days`
      case "wallet_recharge":
        return `Wallet Recharge`
      case "studio_upgrade":
        return "Studio upgrade"
      case "annual_subscription":
        return "Annual subscription"
      case "service_charge":
        return order.serviceType === "ai_image"
          ? `AI Image Generation (${order.quantity}x)`
          : order.serviceType === "whitelabel_hosting"
            ? "Whitelabel & Hosting"
            : order.serviceType === "domain_registration"
              ? "Domain Registration"
              : "Domain Renewal"
      default:
        return "Order"
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <h4 className="font-semibold">{getTitle()}</h4>
            {order.discountTierLabel && (
              <Badge variant="secondary" className="text-[10px]">
                {order.discountTierLabel}
              </Badge>
            )}
            {showUser && order.user && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{order.user.name}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            {order.orderType === "validity_extension" && order.creditsCost ? (
              <div>
                <div className="text-lg font-bold">{order.creditsCost} credits</div>
                <div className="text-xs text-muted-foreground">
                  {streamTypeLabels[order.streamType || ""] || ""}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-bold">
                  {"₹"}
                  {(Number(order.totalPrice) / 100).toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </div>
                {order.quantity > 1 && Number.isFinite(Number(order.unitPrice)) && (
                  <div className="text-xs text-muted-foreground">
                    {"₹"}
                    {(Number(order.unitPrice) / 100).toFixed(2)} x {order.quantity}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <TypeIcon className="h-4 w-4" />
            <span>{orderTypeLabels[order.orderType] || order.orderType}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}</span>
          </div>
          {order.paymentGateway && (
            <Badge variant="outline" className="capitalize">
              {order.paymentGateway}
            </Badge>
          )}
        </div>

        {order.status === "completed" && order.completedAt && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Completed {formatDistanceToNow(new Date(order.completedAt), { addSuffix: true })}</span>
          </div>
        )}

        {order.status === "failed" && order.failureReason && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              <span>{order.failureReason}</span>
            </div>
          </div>
        )}

        {/* Gateway reference ID — helps admin cross-check with Instamojo dashboard */}
        {order.gatewayOrderId && order.status === "pending" && (
          <p className="text-[10px] font-mono text-muted-foreground break-all">
            Ref: {order.gatewayOrderId}
          </p>
        )}

        {onProcess && order.status === "pending" && order.paymentGateway && (
          <div className="pt-1 space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => handleProcess(false)}
              disabled={processing || forceProcessing}
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 ${processing ? "animate-spin" : ""}`} />
              {processing ? "Verifying with Instamojo…" : "Process Order"}
            </Button>

            {/* Show Force Process if Instamojo verification fails or always as secondary option */}
            {(processResult?.forceAvailable || processResult?.ok === false) && (
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => handleProcess(true)}
                disabled={processing || forceProcessing}
                title="Bypasses Instamojo verification. Only use after confirming payment in your Instamojo dashboard."
              >
                <Zap className={`mr-2 h-3.5 w-3.5 ${forceProcessing ? "animate-pulse" : ""}`} />
                {forceProcessing ? "Force-processing…" : "Force Process (skip Instamojo check)"}
              </Button>
            )}

            {processResult && (
              <p className={`text-xs text-center ${processResult.ok ? "text-green-600" : "text-destructive"}`}>
                {processResult.message}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
