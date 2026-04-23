"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Search,
  Calendar,
  DollarSign,
  RefreshCw,
  ExternalLink,
} from "lucide-react"

import { formatPaisa, formatDate } from "@/lib/utils"

export default function AdminPaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [gatewayFilter, setGatewayFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedTab, setSelectedTab] = useState("all")

  const [payments, setPayments] = useState<any[]>([])
  const [unmatchedPayments, setUnmatchedPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/transactions")
      .then(res => res.json())
      .then(data => {
        if (data.transactions) setPayments(data.transactions)
        if (data.unmatched) setUnmatchedPayments(data.unmatched)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter payment transactions
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const matchesSearch =
        payment.paymentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.userName?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesGateway = gatewayFilter === "all" || payment.gateway === gatewayFilter
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter

      return matchesSearch && matchesGateway && matchesStatus
    })
  }, [payments, searchTerm, gatewayFilter, statusFilter])

  // Statistics
  const stats = useMemo(() => {
    const total = payments.length
    const success = payments.filter((p) => p.status === "success").length
    const failed = payments.filter((p) => p.status === "failed").length
    const pending = payments.filter((p) => p.status === "pending").length
    const unmatched = unmatchedPayments.length

    const totalAmount = payments
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    return { total, success, failed, pending, unmatched, totalAmount }
  }, [payments, unmatchedPayments])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        )
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getGatewayBadge = (gateway: string) => {
    const colors = {
      razorpay: "bg-blue-500",
      instamojo: "bg-purple-500",
      cashfree: "bg-orange-500",
    }
    return (
      <Badge variant="outline" className={colors[gateway as keyof typeof colors]}>
        {gateway.charAt(0).toUpperCase() + gateway.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Payment Gateway Transactions</h1>
        <p className="text-muted-foreground">Monitor payment gateway activity and reconcile unmatched transactions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.success}</div>
            <p className="text-xs text-muted-foreground">{formatPaisa(stats.totalAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <RefreshCw className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.unmatched}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="unmatched" className="relative">
            Unmatched Payments
            {stats.unmatched > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
                {stats.unmatched}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Transactions Tab */}
        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Transactions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by payment ID, user email, or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gateways</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                    <SelectItem value="instamojo">Instamojo</SelectItem>
                    <SelectItem value="cashfree">Cashfree</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payment List */}
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm font-medium">{payment.paymentId}</span>
                        {getStatusBadge(payment.status)}
                        {getGatewayBadge(payment.gateway)}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">User:</span>{" "}
                          <span className="font-medium">{payment.userName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          <span className="font-medium">{payment.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatDate(payment.createdAt)}</span>
                        </div>
                      </div>

                      {payment.walletTransactionId && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Wallet credited: {payment.walletTransactionId}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold">{formatPaisa(payment.amount)}</div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPayments.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Unmatched Payments Tab */}
        <TabsContent value="unmatched" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Unmatched Payments Requiring Action
              </CardTitle>
              <CardDescription>
                These payments succeeded on the gateway but no wallet transaction was found. Verify and manually add
                funds to user wallets.
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {unmatchedPayments.map((payment) => (
              <Card key={payment.id} className="border-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-mono text-sm font-medium">{payment.paymentId}</span>
                        <Badge variant="default" className="bg-orange-500">
                          UNMATCHED
                        </Badge>
                        {getGatewayBadge(payment.gateway)}
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">User:</span>{" "}
                          <span className="font-medium">{payment.userName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          <span className="font-medium">{payment.userEmail}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">{formatDate(payment.detectedAt)}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-md">
                        <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                          Issue: {payment.issue}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Reason: {payment.reason}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold">{formatPaisa(payment.amount)}</div>
                      <div className="space-y-2">
                        <Button size="sm" className="w-full">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Add Funds Manually
                        </Button>
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Gateway
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {unmatchedPayments.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-lg font-medium">All Clear!</p>
                  <p className="text-muted-foreground">No unmatched payments found. All transactions are reconciled.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
