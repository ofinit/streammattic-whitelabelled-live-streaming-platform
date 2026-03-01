"use client"

import type React from "react"

import type { Package } from "@/lib/types"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface PackageCardProps {
  pkg: Package
  effectivePrice?: number
  hasCustomPrice?: boolean
  onPurchase?: (pkg: Package) => void
  onEdit?: (pkg: Package) => void
  showActions?: boolean
  isAdmin?: boolean
  isStudio?: boolean
  isPopular?: boolean
}

const packageIcons: Record<string, React.ElementType> = {
  Starter: Zap,
  Professional: Sparkles,
  Enterprise: Crown,
}

export function PackageCard({
  pkg,
  effectivePrice,
  hasCustomPrice,
  onPurchase,
  onEdit,
  showActions = true,
  isAdmin = false,
  isStudio = false,
  isPopular = false,
}: PackageCardProps) {
  const Icon = packageIcons[pkg.name] || Zap
  const displayPrice = effectivePrice ?? pkg.price

  const canEdit = isAdmin || isStudio

  return (
    <Card
      className={cn("relative flex flex-col transition-all hover:shadow-lg", isPopular && "border-primary shadow-md")}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{pkg.name}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold">₹{displayPrice.toLocaleString()}</span>
            <span className="text-muted-foreground">/{pkg.duration} days</span>
          </div>
          {hasCustomPrice && (
            <Badge variant="outline" className="mt-1 text-xs">
              Custom Price
            </Badge>
          )}
          {(isAdmin || isStudio) && (
            <div className="mt-2 flex justify-center gap-2 text-xs text-muted-foreground">
              <span>Studio: ₹{pkg.basePriceStudio}</span>
              <span>|</span>
              <span>User: ₹{pkg.basePriceUser}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {pkg.features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs text-muted-foreground">
          <div className="rounded-md bg-muted/50 p-2">
            <div className="font-medium text-foreground">{pkg.maxEvents === -1 ? "Unlimited" : pkg.maxEvents}</div>
            <div>Events</div>
          </div>
          <div className="rounded-md bg-muted/50 p-2">
            <div className="font-medium text-foreground">{pkg.maxConcurrentViewers.toLocaleString()}</div>
            <div>Max Viewers</div>
          </div>
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2">
          {onPurchase && (
            <Button className="flex-1" onClick={() => onPurchase(pkg)}>
              Purchase
            </Button>
          )}
          {onEdit && canEdit && (
            <Button variant="outline" onClick={() => onEdit(pkg)}>
              Edit
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
