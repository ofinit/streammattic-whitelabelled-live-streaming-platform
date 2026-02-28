"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { ResellerFormDialog, type ResellerFormData } from "@/components/reseller/reseller-form-dialog"
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
import { Search, Plus, MoreHorizontal, Eye, Edit, Ban, UserCheck, Wallet, Users, Globe, Youtube } from "lucide-react"
import type { Reseller } from "@/lib/types"
import { ResellerDomainDialog } from "@/components/admin/reseller-domain-dialog"
import { ResellerYouTubeDialog } from "@/components/admin/reseller-youtube-dialog"

export default function AdminResellersPage() {
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingReseller, setEditingReseller] = useState<Reseller | null>(null)
  const [domainReseller, setDomainReseller] = useState<Reseller | null>(null)
  const [youtubeReseller, setYoutubeReseller] = useState<Reseller | null>(null)

  const filteredResellers = mockResellers.filter((reseller) => {
    const matchesSearch =
      reseller.name.toLowerCase().includes(search.toLowerCase()) ||
      reseller.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || reseller.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: ResellerFormData) => {
    console.log("[v0] Creating reseller:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleEdit = async (data: ResellerFormData) => {
    console.log("[v0] Updating reseller:", editingReseller?.id, data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingReseller(null)
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
            <DropdownMenuItem onClick={() => impersonate(item.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View as Reseller
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
            <DropdownMenuItem onClick={() => setDomainReseller(item)}>
              <Globe className="mr-2 h-4 w-4" />
              Manage Domain
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setYoutubeReseller(item)}>
              <Youtube className="mr-2 h-4 w-4" />
              YouTube API
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {item.status === "active" ? (
              <DropdownMenuItem className="text-destructive">
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem>
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
      <Header title="Reseller Management" subtitle="Manage platform resellers" />

      <div className="space-y-6">
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
            <CardTitle>All Resellers ({filteredResellers.length})</CardTitle>
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

      {domainReseller && (
        <ResellerDomainDialog
          open={!!domainReseller}
          onOpenChange={(open) => !open && setDomainReseller(null)}
          reseller={domainReseller}
        />
      )}

      {youtubeReseller && (
        <ResellerYouTubeDialog
          open={!!youtubeReseller}
          onOpenChange={(open) => !open && setYoutubeReseller(null)}
          reseller={youtubeReseller}
        />
      )}
    </div>
  )
}
