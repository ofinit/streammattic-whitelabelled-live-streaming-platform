"use client"

import { useState } from "react"
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
import { mockStudios } from "@/lib/mock-data"
import { Search, Plus, MoreHorizontal, Eye, Edit, Ban, UserCheck, Wallet, Users, Globe, Youtube, IndianRupee } from "lucide-react"
import type { Studio } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { StudioDomainDialog } from "@/components/admin/studio-domain-dialog"
import { StudioYouTubeDialog } from "@/components/admin/studio-youtube-dialog"
import { CustomPricingDialog } from "@/components/admin/custom-pricing-dialog"

export default function AdminStudiosPage() {
  const { impersonate } = useAuth()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null)
  const [domainStudio, setDomainStudio] = useState<Studio | null>(null)
  const [youtubeStudio, setYoutubeStudio] = useState<Studio | null>(null)
  const [pricingStudio, setPricingStudio] = useState<Studio | null>(null)

  const filteredStudios = mockStudios.filter((studio) => {
    const matchesSearch =
      studio.name.toLowerCase().includes(search.toLowerCase()) ||
      studio.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || studio.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreate = async (data: StudioFormData) => {
    console.log("[v0] Creating studio:", data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleEdit = async (data: StudioFormData) => {
    console.log("[v0] Updating studio:", editingStudio?.id, data)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEditingStudio(null)
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
            <DropdownMenuItem>
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
<DropdownMenuItem onClick={() => setPricingStudio(item)}>
  <IndianRupee className="mr-2 h-4 w-4" />
  Custom Pricing
  {(item.customStreamPricing || (item as unknown as Record<string, unknown>).customAnnualSubscription) && (
    <Badge variant="outline" className="ml-auto text-[10px] px-1 py-0 text-amber-500 border-amber-500/30">Custom</Badge>
  )}
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

        {/* Resellers Table */}
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
        <CustomPricingDialog
          open={!!pricingStudio}
          onOpenChange={(open) => !open && setPricingStudio(null)}
          targetName={pricingStudio.branding.platformName}
          targetType="studio"
          existingCustomPricing={pricingStudio.customStreamPricing}
          existingAnnualOverride={(pricingStudio as unknown as Record<string, unknown>).customAnnualSubscription as { price: number; enabled: boolean } | null ?? null}
          existingPackOverrides={(pricingStudio as unknown as Record<string, unknown>).customPackPricing as Record<string, { userPrice: number; studioPrice: number }> | null ?? null}
          existingValidityOverrides={(pricingStudio as unknown as Record<string, unknown>).customValiditySurcharges as Record<number, { userSurcharge: number; studioSurcharge: number }> | null ?? null}
          onSave={(pricing, _note, annualOverride, packOverrides, validityOverrides) => {
            pricingStudio.customStreamPricing = pricing
            ;(pricingStudio as unknown as Record<string, unknown>).customAnnualSubscription = annualOverride
            ;(pricingStudio as unknown as Record<string, unknown>).customPackPricing = packOverrides
            ;(pricingStudio as unknown as Record<string, unknown>).customValiditySurcharges = validityOverrides
            setPricingStudio(null)
          }}
        />
      )}
    </div>
  )
}
