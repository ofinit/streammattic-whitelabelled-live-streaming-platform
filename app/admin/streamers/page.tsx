"use client"

import { useState, useEffect } from "react"
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
import { toast } from "sonner"

import { Search, Plus, MoreHorizontal, LogIn, Edit, Ban, UserCheck, IndianRupee, Youtube, Wallet, Images, Building2 } from "lucide-react"
import type { Streamer, StreamTypePricing } from "@/lib/types"
import { FullscreenCustomPricingDialog } from "@/components/admin/fullscreen-custom-pricing-dialog"
import { StreamerYouTubeOverrideDialog } from "@/components/admin/streamer-youtube-override-dialog"
import { AdjustWalletDialog } from "@/components/wallet/adjust-wallet-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

function formatDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminStreamersPage() {
  const router = useRouter()
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null)
  const [pricingStreamer, setPricingStreamer] = useState<Streamer | null>(null)
  const [youtubeOverrideStreamer, setYoutubeOverrideStreamer] = useState<Streamer | null>(null)
  const [addFundsStreamer, setAddFundsStreamer] = useState<Streamer | null>(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    user: Streamer
    targetStatus: "active" | "suspended"
  } | null>(null)
  const [studioGrantTarget, setStudioGrantTarget] = useState<Streamer | null>(null)
  const [studioGrantExpiresLocal, setStudioGrantExpiresLocal] = useState("")
  const [studioGrantSubmitting, setStudioGrantSubmitting] = useState(false)

  const [streamers, setStreamers] = useState<Streamer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/users?role=streamer", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setStreamers(data.users)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter streamers
  const filteredStreamers = streamers.filter((streamer) => {
    const matchesSearch =
      streamer.name.toLowerCase().includes(search.toLowerCase()) || streamer.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || streamer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
    mobile?: string
  }) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          role: "streamer",
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          mobile: data.mobile,
        }),
      })
      const result = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!res.ok) {
        const msg = result.error || result.message || "Failed to create streamer"
        throw new Error(msg)
      }
      toast.success("Streamer created successfully")
      const updated = await fetch("/api/admin/users?role=streamer", { credentials: "include" }).then((r) => r.json())
      if (updated.users) setStreamers(updated.users)
      setIsCreateOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create streamer")
      console.error(err)
      throw err instanceof Error ? err : new Error("Failed to create streamer")
    }
  }

  const handleEdit = async (data: any) => {
    console.log("[update API] Updating streamer:", editingStreamer?.id, data)
    setEditingStreamer(null)
  }

  const togglePhotoGallery = async (user: Streamer) => {
    const next = !user.photoGalleryEnabled
    try {
      const res = await fetch(`/api/admin/users/${user.id}/photo-gallery`, {
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
      setStreamers((s) =>
        s.map((x) => (x.id === user.id ? { ...x, photoGalleryEnabled: next } : x)),
      )
      toast.success(next ? "Client photo gallery enabled" : "Client photo gallery disabled")
    } catch (e) {
      console.error(e)
      toast.error("Failed to update photo gallery access")
    }
  }

  const handleStatusChange = async () => {
    if (!statusChangeTarget) return
    try {
      const res = await fetch(`/api/admin/users/${statusChangeTarget.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: statusChangeTarget.targetStatus }),
      })
      if (res.ok) {
        setStreamers(s => s.map(x => x.id === statusChangeTarget.user.id ? { ...x, status: statusChangeTarget.targetStatus as any } : x))
      }
    } catch (err) {
      console.error(err)
    }
    setStatusChangeTarget(null)
  }

  const handleImpersonate = async (item: any) => {
    const targetRoute = await impersonate(item.id)
    if (targetRoute) {
      router.push(targetRoute)
    }
  }

  const openStudioGrantDialog = (user: Streamer) => {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    setStudioGrantExpiresLocal(formatDatetimeLocalValue(d))
    setStudioGrantTarget(user)
  }

  const handleStudioGrantSubmit = async () => {
    if (!studioGrantTarget) return
    const expires = new Date(studioGrantExpiresLocal)
    if (Number.isNaN(expires.getTime())) {
      toast.error("Enter a valid date and time")
      return
    }
    if (expires.getTime() <= Date.now()) {
      toast.error("Subscription end must be in the future")
      return
    }
    setStudioGrantSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${studioGrantTarget.id}/studio-subscription-grant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ expiresAt: expires.toISOString() }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!res.ok) {
        toast.error(data.error || data.message || "Failed to grant Studio access")
        return
      }
      toast.success(data.message || "Studio access granted")
      setStudioGrantTarget(null)
      const updated = await fetch("/api/admin/users?role=streamer", { credentials: "include" }).then((r) => r.json())
      if (updated.users) setStreamers(updated.users)
    } catch (e) {
      console.error(e)
      toast.error("Failed to grant Studio access")
    } finally {
      setStudioGrantSubmitting(false)
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
              View as Streamer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setEditingStreamer(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAddFundsStreamer(item)}>
              <Wallet className="mr-2 h-4 w-4" />
              Add Funds
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openStudioGrantDialog(item)}>
              <Building2 className="mr-2 h-4 w-4" />
              Grant Studio access (no payment)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPricingStreamer(item)}>
              <IndianRupee className="mr-2 h-4 w-4" />
              Custom Pricing
              {(item as any).customPricing && (
                <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setYoutubeOverrideStreamer(item)}>
              <Youtube className="mr-2 h-4 w-4" />
              YouTube API access
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
        <FullscreenCustomPricingDialog
          open={!!pricingStreamer}
          onOpenChange={(open) => !open && setPricingStreamer(null)}
          userId={(pricingStreamer as any).id}
          targetName={pricingStreamer.name}
          targetType="streamer"
          existingCustomPricing={(pricingStreamer as any).customPricing ?? null}
          onSaved={() => {
            fetch("/api/admin/users?role=streamer", { credentials: "include" })
              .then((r) => r.json())
              .then((data) => {
                if (data.users) setStreamers(data.users)
              })
              .catch(console.error)
            setPricingStreamer(null)
          }}
        />
      )}

      <StreamerYouTubeOverrideDialog
        open={!!youtubeOverrideStreamer}
        onOpenChange={(open) => !open && setYoutubeOverrideStreamer(null)}
        streamer={youtubeOverrideStreamer}
      />

      {addFundsStreamer && (
        <AdjustWalletDialog
          open={!!addFundsStreamer}
          onOpenChange={(open) => !open && setAddFundsStreamer(null)}
          targetUser={{
            id: addFundsStreamer.id,
            name: addFundsStreamer.name,
            balance: (addFundsStreamer.walletBalance ?? 0) * 100,
          }}
          onConfirm={async (amountInPaise, type, reason) => {
            try {
              const amountInRupees = amountInPaise / 100
              const res = await fetch("/api/wallets/adjust", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                  userId: addFundsStreamer.id,
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
              setStreamers((prev) =>
                prev.map((s) => (s.id === addFundsStreamer.id ? { ...s, walletBalance: newBalance } : s)),
              )

              toast.success(
                type === "credit"
                  ? `Funds added to ${addFundsStreamer.name}`
                  : `Funds deducted from ${addFundsStreamer.name}`,
              )
              setAddFundsStreamer(null)
            } catch (error) {
              console.error(error)
              toast.error("Failed to adjust wallet")
            }
          }}
        />
      )}

      <Dialog
        open={!!studioGrantTarget}
        onOpenChange={(open) => {
          if (!open) {
            setStudioGrantTarget(null)
            setStudioGrantSubmitting(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Studio access</DialogTitle>
            <DialogDescription>
              Sets the user&apos;s Studio subscription end without charging their wallet. Streamers are promoted to the Studio role;
              existing Studio accounts only get an updated expiry. The same renewal reminders and dashboard notices apply as for paid
              Studio plans; future renewal is at the platform&apos;s current Studio rate (set by admin). If the subscription is not renewed
              before it ends, the account is downgraded to Streamer.
            </DialogDescription>
          </DialogHeader>
          {studioGrantTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{studioGrantTarget.name}</span>
                <span className="mx-1">·</span>
                {studioGrantTarget.email}
              </p>
              <div className="space-y-2">
                <Label htmlFor="studio-grant-expires">Subscription valid until</Label>
                <Input
                  id="studio-grant-expires"
                  type="datetime-local"
                  value={studioGrantExpiresLocal}
                  onChange={(e) => setStudioGrantExpiresLocal(e.target.value)}
                  className="bg-secondary border-0"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setStudioGrantTarget(null)}
              disabled={studioGrantSubmitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleStudioGrantSubmit()} disabled={studioGrantSubmitting}>
              {studioGrantSubmitting ? "Saving…" : "Grant access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
