"use client"

import { useState } from "react"
import { mockPackages, mockUserInventory } from "@/lib/mock-data"
import type { Package } from "@/lib/types"
import { PackageCard } from "@/components/packages/package-card"
import { PurchaseDialog } from "@/components/orders/purchase-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PackageIcon, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function UserPackagesPage() {
  const [packages] = useState(mockPackages.filter((p) => p.isActive))
  const [inventory] = useState(mockUserInventory.filter((i) => i.userId === "user-1"))
  const [purchasePkg, setPurchasePkg] = useState<Package | null>(null)
  const walletBalance = 500

  const handlePurchase = (packageId: string, quantity: number) => {
    toast.success(`Order placed for ${quantity}x package. Pending approval.`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Packages</h1>
        <p className="text-muted-foreground">View available packages and your inventory</p>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">My Inventory</TabsTrigger>
          <TabsTrigger value="available">Available Packages</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          {inventory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <PackageIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No packages yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">Purchase a package to get started with streaming</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {inventory.map((inv) => {
                const usage = (inv.usedQty / inv.totalQty) * 100
                return (
                  <Card key={inv.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <PackageIcon className="h-5 w-5" />
                            {inv.package?.name}
                          </CardTitle>
                          <CardDescription>{inv.package?.description}</CardDescription>
                        </div>
                        <Badge variant={inv.availableQty > 0 ? "default" : "secondary"}>
                          {inv.availableQty > 0 ? "Active" : "Depleted"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Usage</span>
                          <span>
                            {inv.usedQty} / {inv.totalQty} events
                          </span>
                        </div>
                        <Progress value={usage} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="rounded-md bg-muted/50 p-2">
                          <div className="font-semibold text-foreground">{inv.totalQty}</div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div className="rounded-md bg-muted/50 p-2">
                          <div className="font-semibold text-green-500">{inv.availableQty}</div>
                          <div className="text-xs text-muted-foreground">Available</div>
                        </div>
                        <div className="rounded-md bg-muted/50 p-2">
                          <div className="font-semibold text-foreground">{inv.usedQty}</div>
                          <div className="text-xs text-muted-foreground">Used</div>
                        </div>
                      </div>

                      {inv.package?.features && (
                        <div className="space-y-1">
                          {inv.package.features.slice(0, 3).map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-primary" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, i) => (
              <PackageCard key={pkg.id} pkg={pkg} isPopular={i === 1} onPurchase={setPurchasePkg} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PurchaseDialog
        open={!!purchasePkg}
        onOpenChange={(open) => !open && setPurchasePkg(null)}
        pkg={purchasePkg}
        walletBalance={walletBalance}
        onConfirm={handlePurchase}
      />
    </div>
  )
}
