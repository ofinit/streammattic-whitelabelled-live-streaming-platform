"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PlusCircle, Wallet, TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/refund-service"
import type { WalletAdjustment, User } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminWalletAdjustmentsPage() {
  const { data: adjData, mutate: mutateAdj, isLoading: isLoadingAdj, error: errorAdj } = useSWR("/api/admin/wallets/adjust", fetcher)
  const { data: usersData, isLoading: isLoadingUsers } = useSWR("/api/admin/users?role=all", fetcher)

  const adjustments = useMemo(() => adjData?.data || [], [adjData])
  const allUsers = useMemo(() => usersData?.users || [], [usersData])

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [targetUserId, setTargetUserId] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"credit" | "debit">("credit")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<WalletAdjustment["category"]>("manual_adjustment")
  const [reason, setReason] = useState("")
  const [notes, setNotes] = useState("")

  const handleOpenAddDialog = () => {
    setShowAddDialog(true)
  }

  const handleSubmitForm = () => {
    if (!targetUserId || !amount || !reason.trim()) {
      return
    }
    setShowAddDialog(false)
    setShowConfirmDialog(true)
  }

  const confirmAdjustment = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin/wallets/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          type: adjustmentType,
          amount: Number(amount),
          category,
          reason,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create adjustment")
      }

      mutateAdj()
      setShowConfirmDialog(false)
      resetForm()
    } catch (err) {
      console.error("Failed to create wallet adjustment:", err)
      alert(err instanceof Error ? err.message : "Adjustment failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTargetUserId("")
    setAdjustmentType("credit")
    setAmount("")
    setCategory("manual_adjustment")
    setReason("")
    setNotes("")
  }

  const selectedUser = allUsers.find((u: User) => u.id === targetUserId)
  const currentBalance = selectedUser?.walletBalance || 0
  const newBalance =
    adjustmentType === "credit" ? currentBalance + Number(amount || 0) : currentBalance - Number(amount || 0)

  if (errorAdj) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-muted-foreground">Failed to load adjustments</p>
          <Button onClick={() => mutateAdj()}>Retry</Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallet Adjustments</h1>
            <p className="text-muted-foreground">Manually add or deduct funds from streamer/studio wallets</p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Adjustment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Credits Added</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(adjustments.filter((a: any) => a.type === "credit").reduce((sum: number, a: any) => sum + Number(a.amount), 0))}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Debits</CardDescription>
              <CardTitle className="text-3xl">
                {formatCurrency(adjustments.filter((a: any) => a.type === "debit").reduce((sum: number, a: any) => sum + Number(a.amount), 0))}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Adjustments Count</CardDescription>
              <CardTitle className="text-3xl">
                {adjustments.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Adjustments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Adjustments</CardTitle>
            <CardDescription>Manual wallet adjustments performed by admins</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAdj ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {adjustments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No adjustments yet</p>
                    <p className="text-sm text-muted-foreground">Manual adjustments will appear here</p>
                  </div>
                ) : (
                  adjustments.map((adjustment: any) => (
                    <div
                      key={adjustment.id}
                      className="flex items-start gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div
                        className={`p-2 rounded-lg ${adjustment.type === "credit" ? "bg-primary/10" : "bg-destructive/10"}`}
                      >
                        {adjustment.type === "credit" ? (
                          <TrendingUp
                            className={`h-5 w-5 ${adjustment.type === "credit" ? "text-primary" : "text-destructive"}`}
                          />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{adjustment.targetUserName || "Unknown User"}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {adjustment.category.replace(/_/g, " ")} ({adjustment.targetUserRole})
                            </p>
                          </div>
                          <p
                            className={`text-lg font-bold ${adjustment.type === "credit" ? "text-primary" : "text-destructive"}`}
                          >
                            {adjustment.type === "credit" ? "+" : "-"}
                            {formatCurrency(adjustment.amount)}
                          </p>
                        </div>
                        <p className="text-sm">{adjustment.reason}</p>
                        {adjustment.notes && <p className="text-xs text-muted-foreground italic">{adjustment.notes}</p>}
                        <p className="text-xs text-muted-foreground">
                          {new Date(adjustment.createdAt).toLocaleString()} by {adjustment.initiatorName || "Admin"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Adjustment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Wallet Adjustment</DialogTitle>
            <DialogDescription>
              Manually credit or debit a streamer or studio's wallet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="user">Target User *</Label>
                <Select value={targetUserId} onValueChange={setTargetUserId}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select user"} />
                  </SelectTrigger>
                  <SelectContent>
                    {allUsers.map((user: User) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                        <span className="ml-2 text-xs text-muted-foreground">{formatCurrency(user.walletBalance)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Add Funds)</SelectItem>
                    <SelectItem value="debit">Debit (Deduct Funds)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goodwill">Goodwill</SelectItem>
                    <SelectItem value="compensation">Compensation</SelectItem>
                    <SelectItem value="correction">Correction</SelectItem>
                    <SelectItem value="manual_top_up">Manual Top-up</SelectItem>
                    <SelectItem value="manual_debit">Manual Debit</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="penalty">Penalty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for this adjustment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Optional additional details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForm} disabled={!targetUserId || !amount || !reason}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Wallet Adjustment</DialogTitle>
            <DialogDescription>Please review the adjustment details before confirming.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Target User</Label>
              <p className="font-medium">{selectedUser?.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Current Balance</Label>
                <p className="text-lg font-bold">{formatCurrency(currentBalance)}</p>
              </div>
              <div>
                <Label>Adjustment</Label>
                <p className={`text-lg font-bold ${adjustmentType === "credit" ? "text-primary" : "text-destructive"}`}>
                  {adjustmentType === "credit" ? "+" : "-"}
                  {formatCurrency(Number(amount))}
                </p>
              </div>
            </div>
            <div>
              <Label>New Balance</Label>
              <p className="text-2xl font-bold">{formatCurrency(newBalance)}</p>
            </div>
            <div>
              <Label>Category</Label>
              <p className="capitalize">{category.replace(/_/g, " ")}</p>
            </div>
            <div>
              <Label>Reason</Label>
              <p className="text-sm">{reason}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={confirmAdjustment} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm & {adjustmentType === "credit" ? "Add" : "Deduct"} Funds</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
