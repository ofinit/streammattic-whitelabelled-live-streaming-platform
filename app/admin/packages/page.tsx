"use client"

import { useState } from "react"
import { mockPackages } from "@/lib/mock-data"
import type { Package } from "@/lib/types"
import { PackageCard } from "@/components/packages/package-card"
import { PackageFormDialog } from "@/components/packages/package-form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search } from "lucide-react"

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState(mockPackages)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)

  const activePackages = packages.filter((p) => p.isActive)
  const inactivePackages = packages.filter((p) => !p.isActive)

  const filteredActive = activePackages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
  const filteredInactive = inactivePackages.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setShowForm(true)
  }

  const handleSubmit = (data: Partial<Package>) => {
    if (editingPackage) {
      setPackages((prev) => prev.map((p) => (p.id === editingPackage.id ? { ...p, ...data } : p)))
    } else {
      const newPkg: Package = {
        id: `pkg-${Date.now()}`,
        ...data,
        price: data.basePriceUser || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Package
      setPackages((prev) => [...prev, newPkg])
    }
    setEditingPackage(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Packages</h1>
          <p className="text-muted-foreground">Manage subscription packages and pricing</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Package
        </Button>
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

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activePackages.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactivePackages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredActive.map((pkg, i) => (
              <PackageCard key={pkg.id} pkg={pkg} isAdmin isPopular={i === 1} onEdit={handleEdit} />
            ))}
          </div>
          {filteredActive.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No active packages found.</div>
          )}
        </TabsContent>

        <TabsContent value="inactive" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredInactive.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} isAdmin onEdit={handleEdit} />
            ))}
          </div>
          {filteredInactive.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">No inactive packages.</div>
          )}
        </TabsContent>
      </Tabs>

      <PackageFormDialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingPackage(null)
        }}
        pkg={editingPackage}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
