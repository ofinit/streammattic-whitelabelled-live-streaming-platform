"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { StudioFormDialog, type StudioFormData } from "@/components/studio/studio-form-dialog"
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

import { Search, Plus, MoreHorizontal, Eye, Edit, Ban, UserCheck, Wallet, Users, Globe, Youtube, IndianRupee, Images, KeyRound } from "lucide-react"
import type { Studio } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { StudioDomainDialog } from "@/components/admin/studio-domain-dialog"
import { StudioYouTubeDialog } from "@/components/admin/studio-youtube-dialog"
import { FullscreenCustomPricingDialog } from "@/components/admin/fullscreen-custom-pricing-dialog"
import { AdjustWalletDialog } from "@/components/wallet/adjust-wallet-dialog"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function AdminStudiosPage() {
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null)
  const [domainStudio, setDomainStudio] = useState<Studio | null>(null)
  const [youtubeStudio, setYoutubeStudio] = useState<Studio | null>(null)
  const [pricingStudio, setPricingStudio] = useState<Studio | null>(null)
  const [addFundsStudio, setAddFundsStudio] = useState<Studio | null>(null)
  const [resetPwTarget, setResetPwTarget] = useState<Studio | null>(null)
  const [resetPwValue, setResetPwValue] = useState("")
  const [resetPwSubmitting, setResetPwSubmitting] = useState(false)

  const [studios, setStudios] = useState<Studio[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/users?role=studio", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.users) setStudios(data.users)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const togglePhotoGallery = async (studio: Studio) => {
    const next = !studio.photoGalleryEnabled
    try {
      const res = await fetch(`/api/admin/users/${studio.id}/photo-gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ photoGalleryEnabled: next }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        toast.error(data.error || "Failed to update photo gallery access")
        return
      }
      setStudios((s) =>
        s.map((x) => (x.id === studio.id ? { ...x, photoGalleryEnabled: next } : x)),
      )
      toast.success(next ? "Client photo gallery enabled" : "Client photo gallery disabled")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update photo gallery access")
    }
  }

  const filteredStudios = studios.filter((studio) => {
    const matchesSearch =
      studio.name.toLowerCase().includes(search.toLowerCase()) ||
      studio.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || studio.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: StudioFormData) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to create studio")
      
      toast.success("Studio created successfully")
      // Refresh list
      const updated = await fetch("/api/admin/users?role=studio", { credentials: "include" }).then((r) =>
        r.json(),
      )
      if (updated.users) setStudios(updated.users)
      setIsCreateOpen(false)
    } catch (err: any) {
      toast.error(err.message)
      console.error(err)
    }
  }

  const handleEdit = async (data: StudioFormData) => {
    if (!editingStudio) return
    try {
      const res = await fetch(`/api/admin/users/${editingStudio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.companyName,
          phone: data.phone,
          status: data.status,
          branding: {
            platformName: data.platformName,
            primaryColor: data.primaryColor,
            secondaryColor: data.secondaryColor,
          }
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to update studio")

      toast.success("Studio updated successfully")
      // Refresh list
      const updated = await fetch("/api/admin/users?role=studio", { credentials: "include" }).then((r) =>
        r.json(),
      )
      if (updated.users) setStudios(updated.users)
      setEditingStudio(null)
    } catch (err: any) {
      toast.error(err.message)
      console.error(err)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStudios(s => s.map(x => x.id === id ? { ...x, status: newStatus as any } : x))
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleResetPassword() {
    if (!resetPwTarget) return
    if (!resetPwValue || resetPwValue.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setResetPwSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${resetPwTarget.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: resetPwValue }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!res.ok) {
        toast.error(data.error || "Failed to reset password")
        return
      }
      toast.success(data.message || "Password reset successfully")
      setResetPwTarget(null)
      setResetPwValue("")
    } catch (e) {
      console.error(e)
      toast.error("Failed to reset password")
    } finally {
      setResetPwSubmitting(false)
    }
  }

  const columns = [
    {
      key: "name",
      header: "Studio",
      render: (item: Studio) => (
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
      render: (item: Studio) => <span className="text-foreground">{item.branding.platformName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (item: Studio) => <StatusBadge status={item.status} />,
    },
    {
      key: "studioSubscriptionExpiresAt",
      header: "Studio renews",
      render: (item: Studio) => {
        const raw = (item as unknown as { studioSubscriptionExpiresAt?: string | null }).studioSubscriptionExpiresAt
        if (!raw) return <span className="text-muted-foreground text-sm">—</span>
        const d = new Date(raw)
        return (
          <span className="text-sm tabular-nums text-foreground" title={d.toISOString()}>
            {d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
          </span>
        )
      },
    },
    {
      key: "walletBalance",
      header: "Balance",
      render: (item: Studio) => (
        <span className="font-mono text-foreground">₹{item.walletBalance.toLocaleString()}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item: Studio) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => impersonate(item.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View as Studio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingStudio(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setResetPwTarget(item); setResetPwValue("") }}>
              <KeyRound className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddFundsStudio(item)}>
              <Wallet className="mr-2 h-4 w-4" />
              Add Funds
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDomainStudio(item)}>
              <Globe className="mr-2 h-4 w-4" />
              Manage Domain
            </DropdownMenuItem>
<DropdownMenuItem onClick={() => setYoutubeStudio(item)}>
  <Youtube className="mr-2 h-4 w-4" />
  YouTube API
</DropdownMenuItem>
            <DropdownMenuItem onClick={() => void togglePhotoGallery(item)}>
              <Images className="mr-2 h-4 w-4" />
              {item.photoGalleryEnabled ? "Disable" : "Enable"} client photo gallery
              {item.photoGalleryEnabled ? (
                <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 text-emerald-600 border-emerald-500/30">
                  On
                </Badge>
              ) : null}
            </DropdownMenuItem>
<DropdownMenuItem onClick={() => setPricingStudio(item)}>
  <IndianRupee className="mr-2 h-4 w-4" />
  Custom Pricing
  {((item as any).customPricing || (item as unknown as Record<string, unknown>).customAnnualSubscription) && (
    <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
  )}
</DropdownMenuItem>
<DropdownMenuSeparator />
{item.status === "active" ? (
              <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(item.id, 'suspended')}>
                <Ban className="mr-2 h-4 w-4" />
                Suspend
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'active')}>
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
      <Header title="Studio Management" subtitle="Manage platform studios" />

      <div className="space-y-6">
        {/* Filters */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search studios..."
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
                Add Studio
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Studios Table */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>All Studios ({filteredStudios.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredStudios} />
          </CardContent>
        </Card>
      </div>

      <StudioFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} mode="create" onSubmit={handleCreate} />

      {editingStudio && (
        <StudioFormDialog
          open={!!editingStudio}
          onOpenChange={(open) => !open && setEditingStudio(null)}
          mode="edit"
          initialData={editingStudio}
          onSubmit={handleEdit}
        />
      )}

      {domainStudio && (
        <StudioDomainDialog
          open={!!domainStudio}
          onOpenChange={(open) => !open && setDomainStudio(null)}
          studio={domainStudio}
        />
      )}

      {youtubeStudio && (
        <StudioYouTubeDialog
          open={!!youtubeStudio}
          onOpenChange={(open) => !open && setYoutubeStudio(null)}
          studio={youtubeStudio}
        />
      )}

      {pricingStudio && (
        <FullscreenCustomPricingDialog
          open={!!pricingStudio}
          onOpenChange={(open) => !open && setPricingStudio(null)}
          userId={(pricingStudio as any).id}
          targetName={(pricingStudio as any).branding?.platformName || pricingStudio.name}
          targetType="studio"
          existingCustomPricing={(pricingStudio as any).customPricing ?? null}
          onSaved={() => {
            // Refresh list in background
            fetch("/api/admin/users?role=studio", { credentials: "include" })
              .then(r => r.json())
              .then(data => { if (data.users) setStudios(data.users) })
              .catch(console.error)
            setPricingStudio(null)
          }}
        />
      )}

      {addFundsStudio && (
        <AdjustWalletDialog
          open={!!addFundsStudio}
          onOpenChange={(open) => !open && setAddFundsStudio(null)}
          targetUser={{
            id: addFundsStudio.id,
            name: addFundsStudio.name,
            balance: Number(addFundsStudio.walletBalance ?? 0),
          }}
          onConfirm={async (amountInPaise, type, reason) => {
            try {
              const amountInRupees = amountInPaise / 100
              const res = await fetch("/api/wallets/adjust", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  userId: addFundsStudio.id,
                  amount: amountInRupees,
                  type,
                  category: "manual_adjustment",
                  reason,
                }),
              })

              const data = (await res.json().catch(() => ({}))) as { error?: string; newBalance?: number }
              if (!res.ok) {
                toast.error(data.error || "Failed to adjust wallet")
                return
              }

              const newBalance = Number(data.newBalance ?? 0)
              setStudios((prev) =>
                prev.map((s) => (s.id === addFundsStudio.id ? { ...s, walletBalance: newBalance } : s)),
              )
              toast.success(
                type === "credit"
                  ? `Funds added to ${addFundsStudio.name}`
                  : `Funds deducted from ${addFundsStudio.name}`,
              )
              setAddFundsStudio(null)
            } catch (error) {
              console.error(error)
              toast.error("Failed to adjust wallet")
            }
          }}
        />
      )}

      {/* Reset Password Dialog */}
      <Dialog
        open={!!resetPwTarget}
        onOpenChange={(open) => {
          if (!open) { setResetPwTarget(null); setResetPwValue("") }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for this studio account. All active sessions will be cleared so they must log in again.
            </DialogDescription>
          </DialogHeader>
          {resetPwTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{resetPwTarget.name}</span>
                <span className="mx-1">·</span>
                {resetPwTarget.email}
              </p>
              <div className="space-y-2">
                <Label htmlFor="studio-reset-pw-input">New Password</Label>
                <Input
                  id="studio-reset-pw-input"
                  type="text"
                  placeholder="Minimum 8 characters"
                  value={resetPwValue}
                  onChange={(e) => setResetPwValue(e.target.value)}
                  className="bg-secondary border-0"
                  autoComplete="off"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setResetPwTarget(null); setResetPwValue("") }}
              disabled={resetPwSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleResetPassword()}
              disabled={resetPwSubmitting || resetPwValue.length < 8}
            >
              {resetPwSubmitting ? "Resetting…" : "Set Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
