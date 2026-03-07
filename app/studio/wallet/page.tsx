"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletCard } from "@/components/wallet/wallet-card"
import { TransactionList } from "@/components/wallet/transaction-list"
import { TopUpDialog } from "@/components/wallet/top-up-dialog"
import { mockTransactions, mockStudioWalletSummary } from "@/lib/mock-data"
import { TrendingUp, ArrowUpRight, Clock } from "lucide-react"

export default function StudioWalletPage() {
  const [topUpOpen, setTopUpOpen] = useState(false)

  // Filter transactions for this studio
  const studioTransactions = mockTransactions.filter((t) => t.userId === "studio-1")

  const handleTopUp = (amount: number, gateway: string) => {
    // In real app, this would redirect to payment gateway
    console.log(`Initiating payment of ${amount} via ${gateway}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="text-muted-foreground">Manage your wallet balance and view transactions</p>
      </div>

      {/* Wallet Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <WalletCard summary={mockStudioWalletSummary} showTopUp onTopUp={() => setTopUpOpen(true)} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">+₹12,500</p>
            <p className="text-sm text-muted-foreground">Total credits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Usage</CardTitle>
            <ArrowUpRight className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">-₹4,800</p>
            <p className="text-sm text-muted-foreground">Streaming costs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="debits">Debits</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={studioTransactions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={studioTransactions.filter((t) => t.type === "credit")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debits">
          <Card>
            <CardHeader>
              <CardTitle>Debits</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={studioTransactions.filter((t) => t.type === "debit")} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Understanding Platform Debits</p>
            <p className="text-sm text-muted-foreground mt-1">
              When events are created or streaming services are used, your wallet is automatically debited for the
              platform cost. Top up your wallet regularly to ensure uninterrupted event creation.
            </p>
          </div>
        </CardContent>
      </Card>

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} onConfirm={handleTopUp} />
    </div>
  )
}
