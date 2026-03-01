"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { UserFormDialog } from "@/components/dashboard/user-form-dialog"
import { StatusChangeDialog } from "@/components/dashboard/status-change-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { mockStreamers } from "@/lib/mock-data"
import { Search, Plus, MoreHorizontal, LogIn, Edit, Ban, UserCheck, IndianRupee } from "lucide-react"
import type { Streamer, StreamTypePricing } from "@/lib/types"
import { CustomPricingDialog } from "@/components/admin/custom-pricing-dialog"

export default function AdminStreamersPage() {
  const router = useRouter()
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null)
  const [pricingStreamer, setPricingStreamer] = useState<Streamer | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    user: Streamer
    targetStatus: "active" | "suspended"
  } | null>(null)

  const allStreamers = mockStreamers

  // Filter streamers
  const filteredStreamers = allStreamers.filter((streamer) => {
    const matchesSearch =
      streamer.name.toLowerCase().includes(search.toLowerCase()) || streamer.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || streamer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: any) => {
    console.log("[v0] Creating streamer:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleEdit = async (data: any) => {
    console.log("[v0] Updating streamer:", editingStreamer?.id, data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingStreamer(null)
  }

  const handleStatusChange = async () => {
    if (!statusChangeTarget) return
    console.log("[v0] Changing streamer status:", statusChangeTarget.user.id, statusChangeTarget.targetStatus)
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
      header: "Streamer",
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
              Login as Streamer
            </DropdownMenuItem>
<DropdownMenuItem onClick={() => setEditingStreamer(item)}>
  <Edit className="mr-2 h-4 w-4" />
  Edit
</DropdownMenuItem>
<DropdownMenuItem onClick={() => setPricingStreamer(item)}>
  <IndianRupee className="mr-2 h-4 w-4" />
  Custom Pricing
  {item.customPricing && (
    <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
  )}
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
      <Header title="Streamer Management" subtitle="Manage all platform streamers" />

      <div className="space-y-6">
        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search streamers..."
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
                Add Streamer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>All Streamers ({filteredStreamers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredStreamers} />
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <UserFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        mode="create"
        userType="streamer"
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      {editingStreamer && (
        <UserFormDialog
          open={!!editingStreamer}
          onOpenChange={(open) => !open && setEditingStreamer(null)}
          mode="edit"
          userType="streamer"
          initialData={{
            id: editingStreamer.id,
            email: editingStreamer.email,
            firstName: editingStreamer.name.split(" ")[0],
            lastName: editingStreamer.name.split(" ").slice(1).join(" "),
            mobile: editingStreamer.phone,
            status: editingStreamer.status,
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

      {pricingStreamer && (
        <CustomPricingDialog
          open={!!pricingStreamer}
          onOpenChange={(open) => !open && setPricingStreamer(null)}
          targetName={pricingStreamer.name}
          targetType="streamer"
          existingCustomPricing={pricingStreamer.customPricing}
          existingPackOverrides={(pricingStreamer as unknown as Record<string, unknown>).customPackPricing as Record<string, { streamerPrice: number; studioPrice: number }> | null ?? null}
          existingValidityOverrides={(pricingStreamer as unknown as Record<string, unknown>).customValiditySurcharges as Record<number, { streamerSurcharge: number; studioSurcharge: number }> | null ?? null}
          onSave={(pricing, _note, _annualOverride, packOverrides, validityOverrides) => {
            // In production, save to API
            pricingStreamer.customPricing = pricing
            ;(pricingStreamer as unknown as Record<string, unknown>).customPackPricing = packOverrides
            ;(pricingStreamer as unknown as Record<string, unknown>).customValiditySurcharges = validityOverrides
            setPricingStreamer(null)
          }}
        />
      )}
    </div>
  )
}
