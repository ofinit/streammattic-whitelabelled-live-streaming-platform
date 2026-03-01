/**
 * Refund Service
 *
 * Handles refund requests, cascade reversals, and manual wallet adjustments
 * Key principles:
 * - Admin has NO wallet (not part of cascade)
 * - ALL refunds require manual admin approval (no automatic refunds)
 * - Cascade reversal credits back studios/users (in reverse order)
 * - Each level loses their profit/margin on refund
 */

import type {
  RefundRequest,
  EventCancellation,
  CascadeReversal,
  CascadeReversalTransaction,
  WalletTransaction,
  UserRole,
  WalletAdjustment,
  RefundAuditLog,
  TransactionCategory,
} from "./types"
import { mockEvents, mockWalletTransactions } from "./mock-data"

// Check refund eligibility based on event status and timing
export function checkRefundEligibility(eventId: string): {
  eligible: boolean
  percentage: number
  reason: string
} {
  const event = mockEvents.find((e) => e.id === eventId)
  if (!event) {
    return { eligible: false, percentage: 0, reason: "Event not found" }
  }

  if (event.status === "completed") {
    return { eligible: false, percentage: 0, reason: "Event already completed" }
  }

  if (event.status === "cancelled") {
    return { eligible: true, percentage: 100, reason: "Event was cancelled" }
  }

  const now = new Date()
  const scheduledDate = event.scheduledAt ? new Date(event.scheduledAt) : null

  if (!scheduledDate) {
    return { eligible: true, percentage: 100, reason: "No scheduled date set" }
  }

  const hoursUntilEvent = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilEvent > 24) {
    return { eligible: true, percentage: 100, reason: "More than 24 hours before event" }
  } else if (hoursUntilEvent > 0) {
    return { eligible: true, percentage: 50, reason: "Less than 24 hours before event" }
  } else {
    return { eligible: false, percentage: 0, reason: "Event time has passed" }
  }
}

// Create refund request (initiated by user/studio)
export function createRefundRequest(
  eventId: string,
  requestedBy: string,
  requestedByRole: UserRole,
  reason: string,
  reasonCategory: EventCancellation["reasonCategory"],
): RefundRequest {
  const event = mockEvents.find((e) => e.id === eventId)
  if (!event) {
    throw new Error("Event not found")
  }

  // Find original cascade transactions for this event
  const cascadeTransactions = mockWalletTransactions.filter(
    (t) => t.referenceId === eventId && t.category === "cascade_debit",
  )

  // Calculate refund amount (from user's transaction)
  const userTransaction = cascadeTransactions.find((t) => t.userId === requestedBy)
  const originalAmount = userTransaction?.amount || 0

  const eligibility = checkRefundEligibility(eventId)
  const refundPercentage = eligibility.percentage
  const refundAmount = Math.floor((originalAmount * refundPercentage) / 100)
  const gstAmount = Math.floor((refundAmount * 18) / 100)
  const totalRefundAmount = refundAmount + gstAmount

  const refundRequest: RefundRequest = {
    id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: "event_cancellation",
    eventId,
    originalAmount,
    refundAmount,
    gstAmount,
    totalRefundAmount,
    cascadeTransactionIds: cascadeTransactions.map((t) => t.id),
    status: "pending",
    requestedBy,
    requestedByRole,
    requestedAt: new Date(),
    refundMethod: "wallet", // Default to wallet refund
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Create audit log
  createRefundAuditLog(refundRequest.id, "created", requestedBy, requestedByRole, {
    reason,
    reasonCategory,
    refundPercentage,
  })

  return refundRequest
}

// Admin approves refund
export function approveRefund(refundId: string, adminId: string): RefundRequest {
  // In real app, fetch from database
  const refund = { id: refundId, status: "pending" } as RefundRequest

  if (refund.status !== "pending") {
    throw new Error("Refund is not in pending status")
  }

  refund.status = "approved"
  refund.approvedBy = adminId
  refund.approvedAt = new Date()
  refund.updatedAt = new Date()

  createRefundAuditLog(refundId, "approved", adminId, "admin", {
    approvedAt: refund.approvedAt,
  })

  return refund
}

// Admin rejects refund
export function rejectRefund(refundId: string, adminId: string, reason: string): RefundRequest {
  const refund = { id: refundId, status: "pending" } as RefundRequest

  if (refund.status !== "pending") {
    throw new Error("Refund is not in pending status")
  }

  refund.status = "rejected"
  refund.rejectedBy = adminId
  refund.rejectedAt = new Date()
  refund.rejectionReason = reason
  refund.updatedAt = new Date()

  createRefundAuditLog(refundId, "rejected", adminId, "admin", {
    reason,
    rejectedAt: refund.rejectedAt,
  })

  return refund
}

// Execute cascade reversal (credit back wallets)
export function executeCascadeReversal(refundId: string, adminId: string): CascadeReversal {
  // Fetch refund request
  const refund = { id: refundId, status: "approved" } as RefundRequest

  if (refund.status !== "approved") {
    throw new Error("Refund must be approved before processing")
  }

  // Fetch original cascade transactions
  const originalTransactions = mockWalletTransactions.filter((t) => refund.cascadeTransactionIds.includes(t.id))

  // Build reversal transactions (reverse order: studio first, then user)
  const reversalTransactions: CascadeReversalTransaction[] = []

  // Sort by cascade level (descending) to credit studio first
  const sortedTransactions = originalTransactions.sort((a, b) => (b.cascadeLevel || 0) - (a.cascadeLevel || 0))

  for (const originalTx of sortedTransactions) {
    // Skip admin (admin has no wallet)
    if (originalTx.userId === "admin-1") continue

    const reversalTx: CascadeReversalTransaction = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cascadeReversalId: `cascade_rev_${refundId}`,
      level: originalTx.cascadeLevel || 0,
      entityId: originalTx.userId,
      entityType: originalTx.cascadeLevel === 0 ? "user" : "studio",
      originalDebitAmount: originalTx.amount,
      creditAmount: originalTx.amount, // Credit back exact amount debited
      originalProfit: 0, // Calculate from cascade
      status: "pending",
      createdAt: new Date(),
    }

    reversalTransactions.push(reversalTx)
  }

  const cascadeReversal: CascadeReversal = {
    id: `cascade_rev_${refundId}`,
    refundRequestId: refundId,
    originalCascadeTransactionIds: refund.cascadeTransactionIds,
    reversalTransactions,
    status: "in_progress",
    startedAt: new Date(),
    createdAt: new Date(),
  }

  // Execute each reversal transaction
  for (const reversalTx of reversalTransactions) {
    try {
      // Credit wallet
      const walletTransaction = creditWallet(
        reversalTx.entityId,
        reversalTx.creditAmount,
        "refund_reversal",
        `Refund reversal - Event cancellation`,
        {
          performedBy: adminId,
          performedByRole: "admin",
          relatedRefundId: refundId,
          relatedEventId: refund.eventId,
        },
      )

      reversalTx.transactionId = walletTransaction.id
      reversalTx.status = "completed"
    } catch (error) {
      reversalTx.status = "failed"
      cascadeReversal.status = "failed"
      cascadeReversal.failureReason = error instanceof Error ? error.message : "Unknown error"
      break
    }
  }

  if (cascadeReversal.status !== "failed") {
    cascadeReversal.status = "completed"
    cascadeReversal.completedAt = new Date()

    // Update refund status
    refund.status = "completed"
    refund.completedAt = new Date()

    createRefundAuditLog(refundId, "completed", adminId, "admin", {
      cascadeReversalId: cascadeReversal.id,
      completedAt: cascadeReversal.completedAt,
    })
  }

  return cascadeReversal
}

// Manual wallet adjustment by admin
export function createWalletAdjustment(
  targetUserId: string,
  targetUserType: UserRole,
  type: "credit" | "debit",
  amount: number,
  category: WalletAdjustment["category"],
  reason: string,
  adminId: string,
  options?: {
    notes?: string
    supportTicketId?: string
    paymentGatewayId?: string
    paymentGateway?: WalletAdjustment["paymentGateway"]
  },
): WalletAdjustment {
  const adjustment: WalletAdjustment = {
    id: `adj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    targetUserId,
    targetUserType,
    type,
    amount,
    reason,
    category,
    initiatedBy: adminId,
    initiatedAt: new Date(),
    approvalRequired: amount > 10000, // Require approval for large amounts
    notes: options?.notes,
    supportTicketId: options?.supportTicketId,
    paymentGatewayId: options?.paymentGatewayId,
    paymentGateway: options?.paymentGateway,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // If no approval required, execute immediately
  if (!adjustment.approvalRequired) {
    executeWalletAdjustment(adjustment.id, adminId)
  }

  return adjustment
}

// Execute wallet adjustment
export function executeWalletAdjustment(adjustmentId: string, adminId: string): WalletAdjustment {
  // Fetch adjustment
  const adjustment = { id: adjustmentId } as WalletAdjustment

  const transactionCategory: TransactionCategory =
    adjustment.category === "payment_recovery"
      ? "payment_recovery"
      : adjustment.category === "compensation"
        ? "compensation"
        : adjustment.category === "correction"
          ? "correction"
          : adjustment.category === "goodwill"
            ? "goodwill"
            : "manual_adjustment"

  // Credit or debit wallet
  if (adjustment.type === "credit") {
    const transaction = creditWallet(
      adjustment.targetUserId,
      adjustment.amount,
      transactionCategory,
      `Manual adjustment: ${adjustment.reason}`,
      {
        performedBy: adminId,
        performedByRole: "admin",
        reason: adjustment.reason,
        notes: adjustment.notes,
        supportTicketId: adjustment.supportTicketId,
        relatedPaymentId: adjustment.paymentGatewayId,
        paymentGateway: adjustment.paymentGateway,
      },
    )

    adjustment.transactionId = transaction.id
  } else {
    // Debit logic (for corrections)
    const transaction = debitWallet(
      adjustment.targetUserId,
      adjustment.amount,
      transactionCategory,
      `Manual adjustment: ${adjustment.reason}`,
      {
        performedBy: adminId,
        performedByRole: "admin",
        reason: adjustment.reason,
        notes: adjustment.notes,
      },
    )

    adjustment.transactionId = transaction.id
  }

  adjustment.approvedBy = adminId
  adjustment.approvedAt = new Date()
  adjustment.updatedAt = new Date()

  return adjustment
}

// Helper: Credit wallet
function creditWallet(
  userId: string,
  amount: number,
  category: TransactionCategory,
  description: string,
  metadata?: {
    performedBy?: string
    performedByRole?: UserRole
    reason?: string
    notes?: string
    relatedRefundId?: string
    relatedEventId?: string
    relatedPaymentId?: string
    paymentGateway?: string
    supportTicketId?: string
  },
): WalletTransaction {
  // In real app, this would update database
  const currentBalance = 5000 // Mock current balance

  const transaction: WalletTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    walletId: `wallet_${userId}`,
    userId,
    type: "credit",
    category,
    amount,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance + amount,
    description,
    performedBy: metadata?.performedBy,
    performedByRole: metadata?.performedByRole,
    reason: metadata?.reason,
    notes: metadata?.notes,
    relatedRefundId: metadata?.relatedRefundId,
    relatedEventId: metadata?.relatedEventId,
    relatedPaymentId: metadata?.relatedPaymentId,
    paymentGateway: metadata?.paymentGateway as any,
    supportTicketId: metadata?.supportTicketId,
    createdAt: new Date(),
  }

  return transaction
}

// Helper: Debit wallet
function debitWallet(
  userId: string,
  amount: number,
  category: TransactionCategory,
  description: string,
  metadata?: {
    performedBy?: string
    performedByRole?: UserRole
    reason?: string
    notes?: string
  },
): WalletTransaction {
  const currentBalance = 5000

  const transaction: WalletTransaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    walletId: `wallet_${userId}`,
    userId,
    type: "debit",
    category,
    amount,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance - amount,
    description,
    performedBy: metadata?.performedBy,
    performedByRole: metadata?.performedByRole,
    reason: metadata?.reason,
    notes: metadata?.notes,
    createdAt: new Date(),
  }

  return transaction
}

// Create refund audit log
function createRefundAuditLog(
  refundRequestId: string,
  action: RefundAuditLog["action"],
  performedBy: string,
  performedByRole: UserRole,
  details: Record<string, any>,
): RefundAuditLog {
  const log: RefundAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    refundRequestId,
    action,
    performedBy,
    performedByRole,
    timestamp: new Date(),
    details,
  }

  return log
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount)
}
