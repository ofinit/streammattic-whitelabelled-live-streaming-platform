"use client"

import type { Order } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatDistanceToNow } from "date-fns"
import { Package, Calendar, User, AlertTriangle, CheckCircle } from "lucide-react"

interface OrderCardProps {
  order: Order
  showUser?: boolean
}

export function OrderCard({
  order,
  showUser = false,
}: OrderCardProps) {
  const packageName = order.items?.[0]?.package?.name || "Package"

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <h4 className="font-semibold">
              {order.orderType === "validity"
                ? `Validity Extension - ${order.validityDays} days`
                : `${order.quantity}x ${packageName}`}
            </h4>
            {showUser && order.user && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{order.user.name}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">₹{order.totalPrice.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              ₹{order.unitPrice} × {order.quantity}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span className="capitalize">{order.orderType}</span>
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
      </CardContent>
    </Card>
  )
}
