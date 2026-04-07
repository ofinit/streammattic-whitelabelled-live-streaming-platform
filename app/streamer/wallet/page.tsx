"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletCard } from "@/components/wallet/wallet-card"
import { TransactionList } from "@/components/wallet/transaction-list"
import { WalletRechargeCheckout } from "@/components/wallet/wallet-recharge-checkout"
import { CreditCard, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GstInvoicesClient } from "@/components/invoices/gst-invoices-client"

export default function StreamerWalletPage() {
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/wallet")
      .then(res => res.json())
      .then(data => {
        if (data.wallet) setWallet(data.wallet)
        if (data.transactions) setTransactions(data.transactions)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm">Loading wallet details…</p>
      </div>
    )
  }

  const walletSummary = {
    balance: wallet?.balance || 0,
    currency: wallet?.currency || "INR",
    lastUpdated: wallet?.updatedAt
  }

  const lowBalance = (wallet?.balance || 0) < 50000

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Wallet</h1>
        <p className="text-muted-foreground">Manage your wallet, transactions, and tax invoices</p>
      </div>

      {lowBalance && (
        <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Low Balance</AlertTitle>
          <AlertDescription className="text-yellow-500/80">
            Your wallet balance is below ₹500. Top up to ensure you have enough for event creations and validities.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <WalletCard summary={walletSummary} showTopUp onTopUp={() => setTopUpOpen(true)} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Transactions</CardTitle>
            <CreditCard className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transactions.length}</p>
            <p className="text-sm text-muted-foreground">Total records found</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
            <CreditCard className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Live</p>
            <p className="text-sm text-muted-foreground">Connected to database</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="topups">Top Ups</TabsTrigger>
          <TabsTrigger value="invoices">GST Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions.filter((t: any) => t.category === "credit_purchase" || t.category === "service_charge" || t.type === "debit")} />
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
                transactions={transactions.filter((t: any) => t.category === "top_up" || t.category === "order_refund" || t.type === "credit")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="m-0 pt-2">
           <GstInvoicesClient mode="self" title="" description="" />
        </TabsContent>
      </Tabs>

      <WalletRechargeCheckout open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  )
}
