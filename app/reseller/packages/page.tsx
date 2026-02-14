"use client"

import { useState } from "react"
import { mockPackages, mockUsers, mockCustomPrices } from "@/lib/mock-data"
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
  const [customPrices, setCustomPrices] = useState<CustomPrice[]>(mockCustomPrices)
  const [purchasePkg, setPurchasePkg] = useState<Package | null>(null)
  const [showPricingDialog, setShowPricingDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [selectedPackage, setSelectedPackage] = useState<string>("")
  const [customPrice, setCustomPrice] = useState<string>("")
  const [showPackageForm, setShowPackageForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [search, setSearch] = useState("")

  const myUsers = mockUsers.filter((u) => u.resellerId === "reseller-1")
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

  const handleSetCustomPrice = () => {
    if (!selectedUser || !selectedPackage || !customPrice) return

    const pkg = packages.find((p) => p.id === selectedPackage)
    const price = Number(customPrice)

    if (pkg && price < pkg.basePriceReseller) {
      toast.error(`Price cannot be less than your cost (₹${pkg.basePriceReseller})`)
      return
    }

    const newPrice: CustomPrice = {
      id: `cp-${Date.now()}`,
      packageId: selectedPackage,
      ownerId: selectedUser,
      setById: "reseller-1",
      price,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setCustomPrices((prev) => {
      const existing = prev.findIndex((p) => p.packageId === selectedPackage && p.ownerId === selectedUser)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newPrice
        return updated
      }
      return [...prev, newPrice]
    })

    toast.success("Custom price set successfully")
    setShowPricingDialog(false)
    setSelectedUser("")
    setSelectedPackage("")
    setCustomPrice("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packages</h1>
          <p className="text-muted-foreground">Manage packages and set custom pricing for your users</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPricingDialog(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Set Custom Pricing
          </Button>
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
          <TabsTrigger value="pricing">Custom Pricing ({customPrices.length})</TabsTrigger>
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

        <TabsContent value="pricing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Custom Prices
              </CardTitle>
              <CardDescription>Custom prices you have set for your users</CardDescription>
            </CardHeader>
            <CardContent>
              {customPrices.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No custom prices set yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Custom Price</TableHead>
                      <TableHead>Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customPrices.map((cp) => {
                      const user = myUsers.find((u) => u.id === cp.ownerId)
                      const pkg = packages.find((p) => p.id === cp.packageId)
                      if (!user || !pkg) return null
                      const margin = cp.price - pkg.basePriceReseller
                      return (
                        <TableRow key={cp.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{pkg.name}</TableCell>
                          <TableCell>₹{pkg.basePriceReseller}</TableCell>
                          <TableCell>₹{cp.price}</TableCell>
                          <TableCell className="text-green-500">+₹{margin}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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

      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Custom Price</DialogTitle>
            <DialogDescription>Set a custom package price for one of your users.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {myUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a package..." />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name} (Your cost: ₹{pkg.basePriceReseller})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Price (₹)</Label>
              <Input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Enter price..."
              />
              {selectedPackage && (
                <p className="text-xs text-muted-foreground">
                  Minimum: ₹{packages.find((p) => p.id === selectedPackage)?.basePriceReseller}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingDialog(false)} type="button">
              Cancel
            </Button>
            <Button
              onClick={handleSetCustomPrice}
              disabled={!selectedUser || !selectedPackage || !customPrice}
              type="button"
            >
              Set Price
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
