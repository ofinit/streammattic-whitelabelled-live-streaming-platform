"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"

type PaymentStatus = "processing" | "success" | "failed" | "cancelled"

function PaymentCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<PaymentStatus>("processing")
  const [message, setMessage] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [amount, setAmount] = useState(0)

  useEffect(() => {
    // Get params from payment gateway redirect
    const paymentId = searchParams.get("payment_id") || searchParams.get("razorpay_payment_id")
    const paymentStatus = searchParams.get("status") || searchParams.get("razorpay_payment_link_status")
    const orderId = searchParams.get("order_id") || searchParams.get("razorpay_order_id")
    const amountParam = searchParams.get("amount")

    if (amountParam) {
      setAmount(Number.parseInt(amountParam) / 100) // Convert from paise
    }

    if (paymentId) {
      setTransactionId(paymentId)
    }

    const verifyPayment = async () => {
      const gateway = searchParams.get("gateway")
      const flow = searchParams.get("flow")

      try {
        if (gateway === "instamojo") {
          const paymentRequestId = searchParams.get("payment_request_id")
          if (!paymentRequestId || !orderId) {
            setStatus("failed")
            setMessage("Missing payment information.")
            return
          }
          const res = await fetch("/api/payments/verify/instamojo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentRequestId, paymentId, orderId }),
          })
          if (res.ok) {
            if (flow === "studio_upgrade") {
              router.replace("/upgrade/studio/success?upgraded=1")
              return
            }
            setStatus("success")
            setMessage("Your wallet has been topped up successfully!")
          } else {
            setStatus("failed")
            setMessage("Payment verification failed. Please contact support.")
          }
        } else if (paymentStatus === "paid" || paymentStatus === "success" || paymentStatus === "captured") {
          setStatus("success")
          setMessage("Your wallet has been topped up successfully!")
        } else if (paymentStatus === "cancelled" || paymentStatus === "canceled") {
          setStatus("cancelled")
          setMessage("Payment was cancelled. No amount has been deducted.")
        } else if (paymentStatus === "failed" || paymentStatus === "error") {
          setStatus("failed")
          setMessage("Payment failed. Please try again or contact support.")
        } else {
          setStatus("success")
          setMessage("Your payment has been processed successfully!")
        }
      } catch {
        setStatus("failed")
        setMessage("Failed to verify payment. Please contact support.")
      }
    }

    verifyPayment()
  }, [searchParams, router])

  const statusConfig = {
    processing: {
      icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
      title: "Processing Payment",
      description: "Please wait while we verify your payment...",
      color: "text-primary",
    },
    success: {
      icon: <CheckCircle className="h-16 w-16 text-green-500" />,
      title: "Payment Successful!",
      description: message,
      color: "text-green-500",
    },
    failed: {
      icon: <XCircle className="h-16 w-16 text-red-500" />,
      title: "Payment Failed",
      description: message,
      color: "text-red-500",
    },
    cancelled: {
      icon: <AlertTriangle className="h-16 w-16 text-yellow-500" />,
      title: "Payment Cancelled",
      description: message,
      color: "text-yellow-500",
    },
  }

  const config = statusConfig[status]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          <div className="flex justify-center">{config.icon}</div>

          <div className="space-y-2">
            <h1 className={`text-2xl font-bold ${config.color}`}>{config.title}</h1>
            <p className="text-muted-foreground">{config.description}</p>
          </div>

          {status === "success" && amount > 0 && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Credited</span>
                <span className="font-semibold text-foreground">₹{amount.toLocaleString("en-IN")}</span>
              </div>
              {transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs text-foreground">{transactionId}</span>
                </div>
              )}
            </div>
          )}

          {status !== "processing" && (
            <div className="flex flex-col gap-3">
              <Button asChild>
                <Link href="/streamer/wallet">Go to Wallet</Link>
              </Button>
              {(status === "failed" || status === "cancelled") && (
                <Button variant="outline" asChild>
                  <Link href="/streamer/wallet">Try Again</Link>
                </Button>
              )}
            </div>
          )}

          {status === "success" && (
            <p className="text-xs text-muted-foreground">
              A confirmation email has been sent to your registered email address.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  )
}
