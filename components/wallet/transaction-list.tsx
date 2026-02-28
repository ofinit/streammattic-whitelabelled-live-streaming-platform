"use client"

import type React from "react"

import { format } from "date-fns"
import type { WalletTransaction } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Wallet, Package } from "lucide-react"

interface TransactionListProps {
  transactions: WalletTransaction[]
  showUser?: boolean
}

const categoryLabels: Record<string, string> = {
  top_up: "Top Up",
  package_purchase: "Package Purchase",
  cascade_debit: "Platform Debit",
  platform_debit: "Platform Debit",
  order_refund: "Refund",
  adjustment: "Adjustment",
  commission: "Commission",
}

const categoryIcons: Record<string, React.ElementType> = {
  top_up: Wallet,
  package_purchase: Package,
  cascade_debit: ArrowUpRight,
  platform_debit: ArrowUpRight,
  order_refund: RefreshCw,
  adjustment: RefreshCw,
  commission: ArrowDownLeft,
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
                <p className="font-medium text-foreground truncate">{txn.description}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[txn.category] || txn.category}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(txn.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className={cn("font-semibold tabular-nums", isCredit ? "text-emerald-500" : "text-red-500")}>
                {isCredit ? "+" : "-"}₹{(txn.amount / 100).toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">Bal: ₹{(txn.balanceAfter / 100).toLocaleString("en-IN")}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
