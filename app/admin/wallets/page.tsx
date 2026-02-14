"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { WalletCard } from "@/components/wallet/wallet-card"
import { TransactionList } from "@/components/wallet/transaction-list"
import { CascadeFlow } from "@/components/wallet/cascade-flow"
import { TopUpDialog } from "@/components/wallet/top-up-dialog"
import { AdjustWalletDialog } from "@/components/wallet/adjust-wallet-dialog"
import { mockResellers, mockUsers, mockTransactions, mockAdminWalletSummary } from "@/lib/mock-data"
import { Search, MoreHorizontal, Plus, TrendingUp, Wallet, Users, Building2 } from "lucide-react"

export default function AdminWalletsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [topUpOpen, setTopUpOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; balance: number } | null>(null)

  // Combine resellers and users for wallet management
  const allWallets = [
    ...mockResellers.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      type: "reseller" as const,
      balance: r.walletBalance,
      status: r.status,
    })),
    ...mockUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      type: "user" as const,
      balance: u.walletBalance,
      status: u.status,
    })),
  ]

  const filteredWallets = allWallets.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleTopUp = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName, balance: 0 })
    setTopUpOpen(true)
  }

  const handleAdjust = (userId: string, userName: string, balance: number) => {
    setSelectedUser({ id: userId, name: userName, balance })
    setAdjustOpen(true)
  }

  const confirmTopUp = (amount: number) => {
    // In real app, this would call the API
    console.log(`Top up ${selectedUser?.name} with ${amount}`)
  }

  const confirmAdjust = (amount: number, type: "credit" | "debit", reason: string) => {
    // In real app, this would call the API
    console.log(`Adjust ${selectedUser?.name}: ${type} ${amount} - ${reason}`)
  }

  // Calculate totals
  const totalResellerBalance = mockResellers.reduce((sum, r) => sum + r.walletBalance, 0)
  const totalUserBalance = mockUsers.reduce((sum, u) => sum + u.walletBalance, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet Management</h1>
        <p className="text-muted-foreground">Manage platform wallets and view cascade transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <WalletCard summary={mockAdminWalletSummary} />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reseller Balance</CardTitle>
            <Building2 className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{(totalResellerBalance / 100).toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted-foreground">{mockResellers.length} resellers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total User Balance</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">₹{(totalUserBalance / 100).toLocaleString("en-IN")}</p>
            <p className="text-sm text-muted-foreground">{mockUsers.length} users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Transactions</CardTitle>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">24</p>
            <p className="text-sm text-emerald-500">+₹45,000 volume</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wallets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wallets">All Wallets</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="cascade">Cascade Flow</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets" className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search wallets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Wallets Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWallets.map((wallet) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{wallet.name}</p>
                        <p className="text-sm text-muted-foreground">{wallet.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={wallet.type === "reseller" ? "default" : "secondary"}>{wallet.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={wallet.status === "active" ? "default" : "destructive"}
                        className={wallet.status === "active" ? "bg-emerald-500/20 text-emerald-500" : ""}
                      >
                        {wallet.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(wallet.balance / 100).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTopUp(wallet.id, wallet.name)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Top Up
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAdjust(wallet.id, wallet.name, wallet.balance)}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Adjust Balance
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Wallet className="mr-2 h-4 w-4" />
                            View Transactions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionList transactions={mockTransactions} showUser />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cascade" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CascadeFlow
              packageName="Professional Package"
              userPrice={249900}
              resellerCost={100000}
              adminCost={60000}
              userName="Alice Johnson"
              resellerName="LiveStream Pro"
            />
            <Card>
              <CardHeader>
                <CardTitle>How Cascade Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>When a user purchases a package, money flows through the hierarchy:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>
                    <strong>User pays full price</strong> - Debited from user wallet
                  </li>
                  <li>
                    <strong>Reseller pays cost</strong> - Debited from reseller wallet (keeps margin)
                  </li>
                  <li>
                    <strong>Admin pays base cost</strong> - Debited from admin wallet (keeps margin)
                  </li>
                </ol>
                <p>Each level only pays what they owe to their parent, keeping the difference as profit.</p>
                <div className="rounded-lg bg-muted/50 p-4 mt-4">
                  <p className="font-medium text-foreground">Example:</p>
                  <ul className="mt-2 space-y-1">
                    <li>User Price: ₹2,499</li>
                    <li>Reseller Cost: ₹1,000 → Reseller Profit: ₹1,499</li>
                    <li>Admin Cost: ₹600 → Admin Profit: ₹400</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedUser && (
        <>
          <TopUpDialog
            open={topUpOpen}
            onOpenChange={setTopUpOpen}
            onConfirm={confirmTopUp}
            isAdmin
            targetUser={selectedUser}
          />
          <AdjustWalletDialog
            open={adjustOpen}
            onOpenChange={setAdjustOpen}
            onConfirm={confirmAdjust}
            targetUser={selectedUser}
          />
        </>
      )}
    </div>
  )
}
