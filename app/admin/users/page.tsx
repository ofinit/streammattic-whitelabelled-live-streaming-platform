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
import { Search, Plus, MoreHorizontal, LogIn, Edit, Ban, UserCheck } from "lucide-react"
import type { EndUser } from "@/lib/types"

export default function AdminUsersPage() {
  const router = useRouter()
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EndUser | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    user: EndUser
    targetStatus: "active" | "suspended"
  } | null>(null)

  const allUsers = mockUsers

  // Filter users
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: any) => {
    console.log("[v0] Creating user:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleEdit = async (data: any) => {
    console.log("[v0] Updating user:", editingUser?.id, data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingUser(null)
  }

  const handleStatusChange = async () => {
    if (!statusChangeTarget) return
    console.log("[v0] Changing user status:", statusChangeTarget.user.id, statusChangeTarget.targetStatus)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleImpersonate = (item: any) => {
    const targetRoute = impersonate(item.id)
    if (targetRoute) {
      router.push(targetRoute)
    }
  }

  const columns = [
    {
      key: "name",
      header: "User",
      render: (item: any) => (
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
      render: (item: any) => <StatusBadge status={item.status} />,
    },
    {
      key: "walletBalance",
      header: "Balance",
      render: (item: any) => (
        <span className="font-mono text-foreground">₹{(item.walletBalance || 0).toLocaleString()}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (item: any) => (
        <span className="text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item: any) => (
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
      <Header title="User Management" subtitle="Manage all platform users" />

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
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredUsers} />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <UserFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        userType="user"
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
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
            mobile: editingUser.phone,
            status: editingUser.status,
          }}
          onSubmit={handleEdit}
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
