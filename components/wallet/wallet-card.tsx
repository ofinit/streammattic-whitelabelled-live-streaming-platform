"use client"

import type { WalletSummary } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, TrendingDown, Plus } from "lucide-react"

interface WalletCardProps {
  summary: WalletSummary
  showTopUp?: boolean
  onTopUp?: () => void
}

export function WalletCard({ summary, showTopUp = false, onTopUp }: WalletCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
        <Wallet className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">₹{(summary.balance / 100).toLocaleString("en-IN")}</p>
          </div>
          {showTopUp && (
            <Button onClick={onTopUp} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Recharge wallet
            </Button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Credits</p>
              <p className="font-semibold text-emerald-500">+₹{(summary.totalCredits / 100).toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Debits</p>
              <p className="font-semibold text-red-500">-₹{(summary.totalDebits / 100).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
