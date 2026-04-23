"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WalletCard } from "@/components/wallet/wallet-card"
import { TransactionList } from "@/components/wallet/transaction-list"
import { WalletRechargeCheckout } from "@/components/wallet/wallet-recharge-checkout"
import { TrendingUp, ArrowUpRight, Clock, Loader2 } from "lucide-react"
import { GstInvoicesClient } from "@/components/invoices/gst-invoices-client"
import { toast } from "sonner"

export default function StudioWalletPage() {
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("recharged") === "1") {
      toast.success("Wallet recharged successfully! Your balance has been updated.")
      const url = new URL(window.location.href)
      url.searchParams.delete("recharged")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  useEffect(() => {
    fetch("/api/wallet")
      .then(res => res.json())
      .then(data => {
        if (data.wallet) setWallet(data.wallet)
        if (data.summary) setSummary(data.summary)
        if (data.transactions) setTransactions(data.transactions)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm">Loading billing details…</p>
      </div>
    )
  }

  const walletSummary = {
    balance: wallet?.balance || 0,
    currency: wallet?.currency || "INR",
    lastUpdated: wallet?.updatedAt,
    totalCredits: summary?.monthlyCredits || 0,
    totalDebits: summary?.monthlyDebits || 0,
    pendingAmount: 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Wallet</h1>
        <p className="text-muted-foreground">Manage your wallet balance, transactions, and tax invoices</p>
      </div>

      {/* Wallet Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <WalletCard summary={walletSummary} showTopUp onTopUp={() => setTopUpOpen(true)} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month (Credits)</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-500">+₹{( (summary?.monthlyCredits || 0) / 100).toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted-foreground">Total money added</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month (Debits)</CardTitle>
            <ArrowUpRight className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-500">-₹{( (summary?.monthlyDebits || 0) / 100).toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted-foreground">Platform costs & charges</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="debits">Debits</TabsTrigger>
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

        <TabsContent value="credits">
          <Card>
            <CardHeader>
              <CardTitle>Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions.filter((t: any) => t.type === "credit")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debits">
          <Card>
            <CardHeader>
              <CardTitle>Debits</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={transactions.filter((t: any) => t.type === "debit")} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="m-0 pt-2">
           <GstInvoicesClient mode="self" title="" description="" />
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-dashed">
        <CardContent className="flex items-start gap-4 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Understanding Wallet Deductions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your wallet balance is used for service charges, AI processing, and extended event validities. Credits show all recharges and manual admin adjustments in your favor.
            </p>
          </div>
        </CardContent>
      </Card>

      <WalletRechargeCheckout open={topUpOpen} onOpenChange={setTopUpOpen} />
    </div>
  )
}
