"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ResellerFormDialog, type ResellerFormData } from "@/components/reseller/reseller-form-dialog"
import { StatusChangeDialog } from "@/components/dashboard/status-change-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import { mockResellers } from "@/lib/mock-data"
import { Search, Plus, MoreHorizontal, LogIn, Edit, Ban, UserCheck, Wallet, Users } from "lucide-react"
import type { Reseller } from "@/lib/types"

export default function ResellerResellersPage() {
  const router = useRouter()
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    reseller: Reseller
    targetStatus: "active" | "suspended"
  } | null>(null)

  // Only show sub-resellers under this reseller (parentResellerId = "reseller-1")
  const myResellers = mockResellers.filter((r) => r.parentResellerId === "reseller-1")

  const filteredResellers = myResellers.filter((reseller) => {
    const matchesSearch =
      reseller.name.toLowerCase().includes(search.toLowerCase()) ||
      reseller.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || reseller.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: ResellerFormData) => {
    console.log("[v0] Creating sub-reseller:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleEdit = async (data: ResellerFormData) => {
    console.log("[v0] Updating sub-reseller:", editingReseller?.id, data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingReseller(null)
  }

  const handleStatusChange = async () => {
    if (!statusChangeTarget) return
    console.log("[v0] Changing reseller status:", statusChangeTarget.reseller.id, statusChangeTarget.targetStatus)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleImpersonate = (reseller: Reseller) => {
    const targetRoute = impersonate(reseller.id)
    if (targetRoute) {
      router.push(targetRoute)
    }
  }

  const columns = [
    {
      key: "name",
      header: "Reseller",
      render: (item: Reseller) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: item.branding.primaryColor }}
          >
            {item.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "branding",
      header: "Platform",
      render: (item: Reseller) => <span className="text-foreground">{item.branding.platformName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Reseller) => <StatusBadge status={item.status} />,
    },
    {
      key: "totalUsers",
      header: "Users",
      render: (item: Reseller) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-foreground">{item.totalUsers}</span>
        </div>
      ),
    },
    {
      key: "walletBalance",
      header: "Balance",
      render: (item: Reseller) => (
        <span className="font-mono text-foreground">₹{item.walletBalance.toLocaleString()}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item: Reseller) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleImpersonate(item)}>
              <LogIn className="mr-2 h-4 w-4" />
              Login as Reseller
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingReseller(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Wallet className="mr-2 h-4 w-4" />
              Add Funds
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {item.status === "active" ? (
              <DropdownMenuItem
                onClick={() => setStatusChangeTarget({ reseller: item, targetStatus: "suspended" })}
                className="text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setStatusChangeTarget({ reseller: item, targetStatus: "active" })}>
                <UserCheck className="mr-2 h-4 w-4" />
                Activate
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      <Header title="My Resellers" subtitle="Manage your sub-resellers" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search resellers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-secondary border-0"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-secondary border-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Reseller
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resellers Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>My Resellers ({filteredResellers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredResellers} />
          </CardContent>
        </Card>
      </div>

      <ResellerFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} mode="create" onSubmit={handleCreate} />

      {editingReseller && (
        <ResellerFormDialog
          open={!!editingReseller}
          onOpenChange={(open) => !open && setEditingReseller(null)}
          mode="edit"
          initialData={editingReseller}
          onSubmit={handleEdit}
        />
      )}

      {statusChangeTarget && (
        <StatusChangeDialog
          open={!!statusChangeTarget}
          onOpenChange={(open) => !open && setStatusChangeTarget(null)}
          userName={statusChangeTarget.reseller.name}
          currentStatus={statusChangeTarget.reseller.status}
          targetStatus={statusChangeTarget.targetStatus}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  )
}
