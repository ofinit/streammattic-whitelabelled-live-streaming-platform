"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { UserFormDialog } from "@/components/dashboard/user-form-dialog"
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
import { mockUsers } from "@/lib/mock-data"
import { Search, Plus, MoreHorizontal, Edit, Ban, UserCheck, Wallet, LogIn } from "lucide-react"
import type { EndUser } from "@/lib/types"

export default function ResellerUsersPage() {
  const router = useRouter()
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EndUser | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    user: EndUser
    targetStatus: "active" | "suspended"
  } | null>(null)

  // Only show users under this reseller
  const myUsers = mockUsers.filter((u) => u.resellerId === "reseller-1")

  const filteredUsers = myUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateUser = async (data: any) => {
    console.log("[v0] Creating user:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleEditUser = async (data: any) => {
    console.log("[v0] Updating user:", editingUser?.id, data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingUser(null)
  }

  const handleStatusChange = async () => {
    if (!statusChangeTarget) return
    console.log("[v0] Changing user status:", statusChangeTarget.user.id, statusChangeTarget.targetStatus)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleImpersonate = (user: EndUser) => {
    const targetRoute = impersonate(user.id)
    if (targetRoute) {
      router.push(targetRoute)
    }
  }

  const userColumns = [
    {
      key: "name",
      header: "User",
      render: (item: EndUser) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
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
      key: "status",
      header: "Status",
      render: (item: EndUser) => <StatusBadge status={item.status} />,
    },
    {
      key: "package",
      header: "Package",
      render: (item: EndUser) => (
        <span className="text-foreground">
          {item.packageId ? `Package ${item.packageId.split("-")[1]}` : "No Package"}
        </span>
      ),
    },
    {
      key: "events",
      header: "Events",
      render: (item: EndUser) => (
        <span className="text-foreground">
          {item.eventsUsed} / {item.totalEvents}
        </span>
      ),
    },
    {
      key: "walletBalance",
      header: "Balance",
      render: (item: EndUser) => (
        <span className="font-mono text-foreground">₹{item.walletBalance.toLocaleString()}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item: EndUser) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleImpersonate(item)}>
              <LogIn className="mr-2 h-4 w-4" />
              Login as User
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingUser(item)}>
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
                onClick={() => setStatusChangeTarget({ user: item, targetStatus: "suspended" })}
                className="text-destructive"
              >
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => setStatusChangeTarget({ user: item, targetStatus: "active" })}>
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
      <Header title="My Users" subtitle="Manage your users" />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
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
              <Button onClick={() => setIsCreateUserOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>My Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={userColumns} data={filteredUsers} />
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <UserFormDialog
        open={isCreateUserOpen}
        onOpenChange={setIsCreateUserOpen}
        mode="create"
        userType="user"
        onSubmit={handleCreateUser}
      />

      {/* Edit User Dialog */}
      {editingUser && (
        <UserFormDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          mode="edit"
          userType="user"
          initialData={{
            id: editingUser.id,
            email: editingUser.email,
            firstName: editingUser.name.split(" ")[0],
            lastName: editingUser.name.split(" ").slice(1).join(" "),
            status: editingUser.status,
          }}
          onSubmit={handleEditUser}
        />
      )}

      {statusChangeTarget && (
        <StatusChangeDialog
          open={!!statusChangeTarget}
          onOpenChange={(open) => !open && setStatusChangeTarget(null)}
          userName={statusChangeTarget.user.name}
          currentStatus={statusChangeTarget.user.status}
          targetStatus={statusChangeTarget.targetStatus}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  )
}
