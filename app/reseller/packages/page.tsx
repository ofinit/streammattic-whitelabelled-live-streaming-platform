"use client"

import { useState } from "react"
import { mockPackages } from "@/lib/mock-data"
import type { Package, CustomPrice } from "@/lib/types"
import { PackageCard } from "@/components/packages/package-card"
import { PackageFormDialog } from "@/components/packages/package-form-dialog"
import { PurchaseDialog } from "@/components/orders/purchase-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Users, Plus, Search } from "lucide-react"
import { toast } from "sonner"

export default function ResellerPackagesPage() {
  const [packages, setPackages] = useState(mockPackages.filter((p) => p.isActive))
  const [purchasePkg, setPurchasePkg] = useState<Package | null>(null)
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [search, setSearch] = useState("")

  const walletBalance = 15000

  const filteredPackages = packages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const getEffectivePrice = (pkg: Package) => {
    return pkg.basePriceReseller
  }

  const handlePurchase = (packageId: string, quantity: number) => {
    toast.success(`Order placed for ${quantity}x package. Pending admin approval.`)
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setShowPackageForm(true)
  }

  const handlePackageSubmit = (data: Partial<Package>) => {
    if (editingPackage) {
      setPackages((prev) => prev.map((p) => (p.id === editingPackage.id ? { ...p, ...data } : p)))
      toast.success("Package updated successfully")
    } else {
      const newPkg: Package = {
        id: `pkg-${Date.now()}`,
        ...data,
        price: data.basePriceUser || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Package
      setPackages((prev) => [...prev, newPkg])
      toast.success("Package created successfully")
    }
    setEditingPackage(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packages</h1>
          <p className="text-muted-foreground">Manage packages and set custom pricing for your users</p>
        </div>
        <div className="flex gap-2">

          <Button onClick={() => setShowPackageForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Package
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Available Packages ({packages.length})</TabsTrigger>

        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPackages.map((pkg, i) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                effectivePrice={getEffectivePrice(pkg)}
                isPopular={i === 1}
                isReseller
                onEdit={handleEdit}
                onPurchase={setPurchasePkg}
              />
            ))}
          </div>
          {filteredPackages.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No packages found.</div>
          )}
        </TabsContent>


      </Tabs>

      <PurchaseDialog
        open={!!purchasePkg}
        onOpenChange={(open) => !open && setPurchasePkg(null)}
        pkg={purchasePkg}
        effectivePrice={purchasePkg ? getEffectivePrice(purchasePkg) : undefined}
        walletBalance={walletBalance}
        onConfirm={handlePurchase}
      />

      <PackageFormDialog
        open={showPackageForm}
        onOpenChange={(open) => {
          setShowPackageForm(open)
          if (!open) setEditingPackage(null)
        }}
        pkg={editingPackage}
        onSubmit={handlePackageSubmit}
      />


    </div>
  )
}
