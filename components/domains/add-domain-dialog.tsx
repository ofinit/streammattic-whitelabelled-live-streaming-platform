"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, AlertCircle } from "lucide-react"

interface AddDomainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (domain: string) => void
}

export function AddDomainDialog({ open, onOpenChange, onAdd }: AddDomainDialogProps) {
  const [domain, setDomain] = useState("")
  const [error, setError] = useState("")

  const validateDomain = (value: string) => {
    const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/
    return domainRegex.test(value.toLowerCase())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanDomain = domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")

    if (!validateDomain(cleanDomain)) {
      setError("Please enter a valid domain (e.g., live.example.com)")
      return
    }

    onAdd(cleanDomain)
    setDomain("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add Custom Domain
          </DialogTitle>
          <DialogDescription>Add your own domain to white-label your streaming platform.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain">Domain Name</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value)
                setError("")
              }}
              placeholder="live.yourdomain.com"
            />
            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-2">
            <p className="font-medium">After adding your domain:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>You will receive DNS records to add at your domain registrar</li>
              <li>For subdomains (e.g., live.example.com): Add a CNAME pointing to Vercel</li>
              <li>For root domains (e.g., example.com): Add an A record pointing to Vercel</li>
              <li>Add the TXT record for domain ownership verification</li>
              <li>Click "Verify Now" once DNS has propagated (usually 5-30 minutes)</li>
            </ol>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Domain</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
