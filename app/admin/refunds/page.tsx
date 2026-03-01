"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Search, Filter, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { mockRefundRequests, mockEvents, mockStreamers } from "@/lib/mock-data"
import { formatCurrency } from "@/lib/refund-service"
import type { RefundRequest } from "@/lib/types"

export default function AdminRefundsPage() {
  const [refunds] = useState<RefundRequest[]>(mockRefundRequests)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // Filter refunds
  const filteredRefunds = refunds.filter((refund) => {
    const event = mockEvents.find((e) => e.id === refund.eventId)
    const user = mockStreamers.find((u) => u.id === refund.requestedBy)

    const matchesSearch =
      event?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      refund.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || refund.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: RefundRequest["status"]) => {
    const variants: Record<RefundRequest["status"], { variant: any; icon: any }> = {
      pending: { variant: "outline", icon: Clock },
      approved: { variant: "secondary", icon: CheckCircle2 },
      rejected: { variant: "destructive", icon: XCircle },
      processing: { variant: "default", icon: RefreshCw },
      completed: { variant: "default", icon: CheckCircle2 },
      failed: { variant: "destructive", icon: AlertCircle },
    }

    const { variant, icon: Icon } = variants[status]
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleApprove = (refund: RefundRequest) => {
    setSelectedRefund(refund)
    setShowApproveDialog(true)
  }

  const handleReject = (refund: RefundRequest) => {
    setSelectedRefund(refund)
    setShowRejectDialog(true)
  }

  const confirmApprove = () => {
    if (selectedRefund) {
      // In real app: call API to approve refund
      console.log("[v0] Approving refund:", selectedRefund.id)
    }
    setShowApproveDialog(false)
    setSelectedRefund(null)
  }

  const confirmReject = () => {
    if (selectedRefund && rejectionReason.trim()) {
      // In real app: call API to reject refund
      console.log("[v0] Rejecting refund:", selectedRefund.id, "Reason:", rejectionReason)
    }
    setShowRejectDialog(false)
    setSelectedRefund(null)
    setRejectionReason("")
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Refund Management</h1>
          <p className="text-muted-foreground">Review and process refund requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Requests</CardDescription>
              <CardTitle className="text-3xl">{refunds.filter((r) => r.status === "pending").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Approved Today</CardDescription>
              <CardTitle className="text-3xl">{refunds.filter((r) => r.status === "approved").length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Refunded</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(
                  refunds.filter((r) => r.status === "completed").reduce((sum, r) => sum + r.totalRefundAmount, 0),
                )}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rejected</CardDescription>
              <CardTitle className="text-3xl">{refunds.filter((r) => r.status === "rejected").length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by event, user, or refund ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Requests */}
        <div className="space-y-4">
          {filteredRefunds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No refund requests found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </CardContent>
            </Card>
          ) : (
            filteredRefunds.map((refund) => {
              const event = mockEvents.find((e) => e.id === refund.eventId)
              const user = mockStreamers.find((u) => u.id === refund.requestedBy)

              return (
                <Card key={refund.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{event?.title || "Unknown Event"}</CardTitle>
                          {getStatusBadge(refund.status)}
                        </div>
                        <CardDescription>
                          Requested by {user?.name} on {new Date(refund.requestedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{formatCurrency(refund.totalRefundAmount)}</div>
                        <div className="text-sm text-muted-foreground">Refund Amount</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <Label className="text-muted-foreground">Original Amount</Label>
                        <p className="font-medium">{formatCurrency(refund.originalAmount)}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Refund Method</Label>
                        <p className="font-medium capitalize">{refund.refundMethod}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Request ID</Label>
                        <p className="font-medium font-mono text-sm">{refund.id}</p>
                      </div>
                    </div>

                    {refund.status === "pending" && (
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => handleApprove(refund)} className="flex-1">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Approve Refund
                        </Button>
                        <Button onClick={() => handleReject(refund)} variant="destructive" className="flex-1">
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {refund.status === "approved" && (
                      <Button className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Process Refund
                      </Button>
                    )}

                    {refund.status === "rejected" && refund.rejectionReason && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                        <Label className="text-destructive">Rejection Reason</Label>
                        <p className="text-sm mt-1">{refund.rejectionReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Refund Request</DialogTitle>
            <DialogDescription>
              Confirm that you want to approve this refund. Once approved, you can process the cascade reversal.
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Refund Amount</Label>
                <p className="text-2xl font-bold">{formatCurrency(selectedRefund.totalRefundAmount)}</p>
              </div>
              <div>
                <Label>Event</Label>
                <p>{mockEvents.find((e) => e.id === selectedRefund.eventId)?.title}</p>
              </div>
              <div>
                <Label>Requested By</Label>
                <p>{mockStreamers.find((u) => u.id === selectedRefund.requestedBy)?.name}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmApprove}>Approve Refund</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectionReason.trim()}>
              Reject Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
