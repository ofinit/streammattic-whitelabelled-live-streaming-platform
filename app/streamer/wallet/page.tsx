"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletCard } from "@/components/wallet/wallet-card"
import { TransactionList } from "@/components/wallet/transaction-list"
import { WalletRechargeCheckout } from "@/components/wallet/wallet-recharge-checkout"
import { mockTransactions, mockStreamerWalletSummary } from "@/lib/mock-data"
import { CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function StreamerWalletPage() {
  const [topUpOpen, setTopUpOpen] = useState(false)

  // Filter transactions for this streamer
  const streamerTransactions = mockTransactions.filter((t) => t.userId === "streamer-1")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
        <p className="text-muted-foreground">Manage your wallet and view transaction history</p>
      </div>

      {/* Low Balance Alert */}
      {mockStreamerWalletSummary.balance < 50000 && (
        <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Low Balance</AlertTitle>
          <AlertDescription className="text-yellow-500/80">
            Your wallet balance is low. Top up to continue purchasing packages or events.
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <WalletCard summary={mockStreamerWalletSummary} showTopUp onTopUp={() => setTopUpOpen(true)} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits</CardTitle>
            <CreditCard className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">18</p>
            <p className="text-sm text-muted-foreground">Across all stream types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Purchases</CardTitle>
            <CreditCard className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="topups">Top Ups</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={streamerTransactions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={streamerTransactions.filter((t) => t.category === "credit_purchase" || t.category === "service_charge")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topups">
          <Card>
            <CardHeader>
              <CardTitle>Top Ups</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList
                transactions={streamerTransactions.filter((t) => t.category === "top_up" || t.category === "order_refund")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WalletRechargeCheckout open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  )
}
