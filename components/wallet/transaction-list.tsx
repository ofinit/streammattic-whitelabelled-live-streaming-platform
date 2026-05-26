"use client"

import type React from "react"

import type { WalletTransaction } from "@/lib/types"
import { cn, formatDateTime } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet, CreditCard, Wand2, Globe, Server } from "lucide-react"
import { formatWalletTransactionCategory } from "@/lib/wallet-category-labels"
import {
  getWalletTransactionPrimaryLabel,
  getWalletTransactionReasonLine,
  isAdminManualWalletTransaction,
} from "@/lib/wallet-transaction-display"

interface TransactionListProps {
  transactions: WalletTransaction[]
  showUser?: boolean
}

const categoryIcons: Record<string, React.ElementType> = {
  top_up: Wallet,
  credit_purchase: CreditCard,
  service_charge: Server,
  order_refund: RefreshCw,
  adjustment: RefreshCw,
  manual_adjustment: RefreshCw,
  ai_image_generation: Wand2,
  whitelabel_hosting: Globe,
  domain_registration: Globe,
  goodwill: ArrowDownLeft,
}

export function TransactionList({ transactions, showUser = false }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Wallet className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((txn) => {
        const Icon = categoryIcons[txn.category] || Wallet
        const isCredit = txn.type === "credit"
        const primary = getWalletTransactionPrimaryLabel(txn)
        const reasonLine = getWalletTransactionReasonLine(txn)
        const badgeLabel = isAdminManualWalletTransaction(txn)
          ? "Admin"
          : formatWalletTransactionCategory(txn.category)

        return (
          <div
            key={txn.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isCredit ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500",
              )}
            >
              {isCredit ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">{primary}</p>
              </div>
              {reasonLine && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  <span className="font-medium text-foreground/80">Reason: </span>
                  {reasonLine}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {badgeLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(txn.createdAt)}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={cn("font-semibold tabular-nums", isCredit ? "text-emerald-500" : "text-red-500")}>
                {isCredit ? "+" : "-"}₹{(txn.amount / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">
                Bal: ₹{((txn.balanceAfter ?? 0) / 100).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
