"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Globe, CheckCircle, Clock } from "lucide-react"
import { DomainCard } from "@/components/domains/domain-card"
import { AddDomainDialog } from "@/components/domains/add-domain-dialog"
import { DNSInstructionsDialog } from "@/components/domains/dns-instructions-dialog"
import { mockDomains } from "@/lib/mock-data"
import type { Domain } from "@/lib/types"

const MAX_DOMAINS = 3

export default function ResellerDomainsPage() {
  const [domains, setDomains] = useState<Domain[]>(mockDomains.filter((d) => d.userId === "reseller-1"))
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [instructionsDomain, setInstructionsDomain] = useState<Domain | null>(null)

  const verifiedCount = domains.filter((d) => d.verificationStatus === "verified").length
  const pendingCount = domains.filter((d) => d.verificationStatus === "pending").length
  const canAddMore = domains.length < MAX_DOMAINS

  const handleAddDomain = (domainName: string) => {
    const newDomain: Domain = {
      id: `dom-${Date.now()}`,
      userId: "reseller-1",
      domain: domainName,
      verificationToken: `streammattic-verify-${Math.random().toString(36).substring(2, 34)}`,
      verificationStatus: "pending",
      sslStatus: "pending",
      isPrimary: domains.length === 0,
      createdAt: new Date(),
    }
    setDomains([...domains, newDomain])
    setInstructionsDomain(newDomain)
  }

  const handleVerify = (domain: Domain) => {
    // Simulate verification (in real app, this would call the API)
    setDomains(
      domains.map((d) =>
        d.id === domain.id
          ? { ...d, verificationStatus: "verified" as const, sslStatus: "active" as const, verifiedAt: new Date() }
          : d,
      ),
    )
  }

  const handleSetPrimary = (domain: Domain) => {
    setDomains(
      domains.map((d) => ({
        ...d,
        isPrimary: d.id === domain.id,
      })),
    )
  }

  const handleRemove = (domain: Domain) => {
    if (confirm(`Are you sure you want to remove ${domain.domain}?`)) {
      setDomains(domains.filter((d) => d.id !== domain.id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Domain Management</h1>
          <p className="text-muted-foreground">Configure custom domains for your white-label platform</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{domains.length}/{MAX_DOMAINS} domains</span>
          <Button onClick={() => setShowAddDialog(true)} disabled={!canAddMore}>
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{domains.length}</p>
                <p className="text-sm text-muted-foreground">Total Domains</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verifiedCount}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
          <CardDescription>
            Manage your custom domains. The primary domain will be used for all your event URLs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No custom domains added yet</p>
              <p className="text-xs text-muted-foreground mb-4">You can add up to {MAX_DOMAINS} custom domains</p>
              <Button onClick={() => setShowAddDialog(true)}>Add Your First Domain</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={domain}
                  onVerify={handleVerify}
                  onSetPrimary={handleSetPrimary}
                  onRemove={handleRemove}
                  showInstructions={setInstructionsDomain}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddDomainDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddDomain} />

      <DNSInstructionsDialog
        open={!!instructionsDomain}
        onOpenChange={(open) => !open && setInstructionsDomain(null)}
        domain={instructionsDomain}
      />
    </div>
  )
}
