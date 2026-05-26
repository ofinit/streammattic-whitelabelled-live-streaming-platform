"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, CheckCircle, Clock, XCircle } from "lucide-react"
import type { Payment } from "@/lib/types"
import { formatDateTime } from "@/lib/utils"

interface PaymentHistoryProps {
  payments: Payment[]
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const getStatusBadge = (status: Payment["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-500/10 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
    }
  }

  const getGatewayName = (gateway: Payment["gateway"]) => {
    const names: Record<string, string> = {
      razorpay: "Razorpay",
      instamojo: "Instamojo",
      cashfree: "Cashfree",
      manual: "Manual",
    }
    return names[gateway] || gateway
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No payment history</p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{payment.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {getGatewayName(payment.gateway)} -{" "}
                      {formatDateTime(payment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">Rs. {(payment.totalAmount / 100).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    (Rs. {(payment.amount / 100).toLocaleString()} + Rs. {(payment.gstAmount / 100).toLocaleString()}{" "}
                    GST)
                  </p>
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
