"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Globe, CheckCircle, Clock, AlertCircle, Trash, Star, RefreshCw, Copy } from "lucide-react"
import type { Domain } from "@/lib/types"
import { format } from "date-fns"

interface DomainCardProps {
  domain: Domain
  onVerify?: (domain: Domain) => void
  onSetPrimary?: (domain: Domain) => void
  onRemove?: (domain: Domain) => void
  showInstructions?: (domain: Domain) => void
}

export function DomainCard({ domain, onVerify, onSetPrimary, onRemove, showInstructions }: DomainCardProps) {
  const getStatusBadge = () => {
    switch (domain.verificationStatus) {
      case "verified":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
    }
  }

  const getSslBadge = () => {
    if (domain.sslStatus === "active") {
      return (
        <Badge variant="outline" className="text-green-500 border-green-500/30">
          SSL Active
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-muted-foreground">
        SSL Pending
      </Badge>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{domain.domain}</p>
                {domain.isPrimary && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    Primary
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Added {format(new Date(domain.createdAt), "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {domain.verificationStatus === "verified" && getSslBadge()}
          </div>
        </div>

        {domain.verificationStatus === "pending" && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 mb-3">
            <p className="text-sm text-yellow-600">
              DNS verification pending. Please add the required DNS records to verify your domain.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          {domain.verificationStatus === "pending" && (
            <>
              <Button size="sm" variant="outline" onClick={() => showInstructions?.(domain)}>
                <Copy className="h-4 w-4 mr-1" />
                DNS Instructions
              </Button>
              <Button size="sm" onClick={() => onVerify?.(domain)}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Verify Now
              </Button>
            </>
          )}
          {domain.verificationStatus === "verified" && !domain.isPrimary && (
            <Button size="sm" variant="outline" onClick={() => onSetPrimary?.(domain)}>
              <Star className="h-4 w-4 mr-1" />
              Set as Primary
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onRemove?.(domain)}>
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
