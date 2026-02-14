"use client"

import type { Order } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { formatDistanceToNow } from "date-fns"
import { Package, Calendar, CheckCircle, XCircle, User } from "lucide-react"

interface OrderCardProps {
  order: Order
  onApprove?: (order: Order) => void
  onReject?: (order: Order) => void
  onCancel?: (order: Order) => void
  showUser?: boolean
  showActions?: boolean
}

export function OrderCard({
  order,
  onApprove,
  onReject,
  onCancel,
  showUser = false,
  showActions = true,
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

        {order.status === "rejected" && order.rejectionReason && (
          <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            Rejected: {order.rejectionReason}
          </div>
        )}

        {order.status === "approved" && order.approvedAt && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Approved {formatDistanceToNow(new Date(order.approvedAt), { addSuffix: true })}</span>
          </div>
        )}

        {showActions && order.status === "pending" && (
          <div className="flex gap-2 pt-2">
            {onApprove && (
              <Button size="sm" onClick={() => onApprove(order)} className="flex-1">
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve
              </Button>
            )}
            {onReject && (
              <Button size="sm" variant="destructive" onClick={() => onReject(order)} className="flex-1">
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            )}
            {onCancel && (
              <Button size="sm" variant="outline" onClick={() => onCancel(order)}>
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
