"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import type { Domain, DNSRecord } from "@/lib/types"

interface DNSInstructionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  domain: Domain | null
}

export function DNSInstructionsDialog({ open, onOpenChange, domain }: DNSInstructionsDialogProps) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!domain) return null

  const serverIp = "123.45.67.89"

  const records: DNSRecord[] = [
    { type: "A", host: "@", value: serverIp, ttl: 3600 },
    { type: "TXT", host: "_streammattic", value: domain.verificationToken, ttl: 3600 },
    { type: "CNAME", host: "www", value: domain.domain, ttl: 3600 },
  ]

  const copyValue = (value: string, id: string) => {
    navigator.clipboard.writeText(value)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>DNS Configuration for {domain.domain}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add the following DNS records to your domain registrar to verify your domain and enable SSL.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Type</th>
                  <th className="px-4 py-2 text-left font-medium">Host/Name</th>
                  <th className="px-4 py-2 text-left font-medium">Value</th>
                  <th className="px-4 py-2 text-left font-medium">TTL</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3">
                      <Badge variant="outline">{record.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{record.host}</td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate" title={record.value}>
                      {record.value}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{record.ttl}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => copyValue(record.value, `${record.type}-${idx}`)}
                      >
                        {copied === `${record.type}-${idx}` ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Important Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>DNS propagation can take up to 48 hours</li>
              <li>The TXT record is required for domain verification</li>
              <li>SSL certificate will be automatically provisioned after verification</li>
              <li>Do not modify these records after verification</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
