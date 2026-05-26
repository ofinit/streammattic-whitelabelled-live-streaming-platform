"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Download, FileArchive } from "lucide-react"
import { formatDate } from "@/lib/utils"

type InvoiceRow = {
  id: string
  invoiceNumber: string
  invoiceDate: string
  recipientId?: string
  recipientName?: string | null
  recipientEmail?: string | null
  baseAmountPaise: number
  totalGstAmountPaise: number
  totalAmountPaise: number
  gstPercentage: number
  paymentMethod?: string | null
  status?: string
}

function defaultRange(): { from: string; to: string } {
  const to = new Date()
  const from = subDays(to, 30)
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  }
}

function currentMonth(): string {
  return format(new Date(), "yyyy-MM")
}

export function GstInvoicesClient({
  mode,
  title = "GST invoices",
  description,
}: {
  mode: "admin" | "self"
  title?: string
  description?: string
}) {
  const defaults = useMemo(() => defaultRange(), [])
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [month, setMonth] = useState(currentMonth)
  const [recipientId, setRecipientId] = useState("")
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zipLoading, setZipLoading] = useState<"month" | "range" | null>(null)

  const listUrl = useCallback(() => {
    const p = new URLSearchParams({ from, to })
    if (mode === "admin" && recipientId.trim()) {
      p.set("recipientId", recipientId.trim())
    }
    return `/api/invoices?${p.toString()}`
  }, [from, to, mode, recipientId])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(listUrl(), { credentials: "include" })
      const data = (await res.json()) as { invoices?: InvoiceRow[]; error?: string }
      if (!res.ok) {
        setError(data.error || "Failed to load invoices")
        setRows([])
        return
      }
      setRows(data.invoices ?? [])
    } catch {
      setError("Failed to load invoices")
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [listUrl])

  useEffect(() => {
    void load()
    // Initial load only; user clicks Apply to refresh after changing filters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const downloadPdf = (id: string) => {
    window.open(`/api/invoices/${id}/pdf`, "_blank", "noopener,noreferrer")
  }

  const downloadZipMonth = async () => {
    setZipLoading("month")
    setError(null)
    try {
      const p = new URLSearchParams({ month })
      if (recipientId.trim()) p.set("recipientId", recipientId.trim())
      const res = await fetch(`/api/admin/invoices/zip?${p}`, { credentials: "include" })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error || "ZIP download failed")
        return
      }
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `gst-invoices-${month}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      setError("ZIP download failed")
    } finally {
      setZipLoading(null)
    }
  }

  const downloadZipRange = async () => {
    setZipLoading("range")
    setError(null)
    try {
      let url: string
      if (mode === "admin") {
        const p = new URLSearchParams({ from, to })
        if (recipientId.trim()) p.set("recipientId", recipientId.trim())
        url = `/api/admin/invoices/zip?${p}`
      } else {
        url = `/api/invoices/zip?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      }
      const res = await fetch(url, { credentials: "include" })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setError(j.error || "ZIP download failed")
        return
      }
      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download =
        mode === "admin" ? `gst-invoices-${from}_to_${to}.zip` : `gst-invoices-${from}_to_${to}.zip`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      setError("ZIP download failed")
    } finally {
      setZipLoading(null)
    }
  }

  const fmtMoney = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="text-muted-foreground">{description}</p> : null}
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            {mode === "admin"
              ? "Filter by date range. Optionally restrict to one user (recipient UUID) for list and ZIP downloads."
              : "Choose a date range to list and download your wallet GST invoices."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="gst-from">From</Label>
              <Input id="gst-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst-to">To</Label>
              <Input id="gst-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            {mode === "admin" ? (
              <div className="min-w-[220px] flex-1 space-y-2">
                <Label htmlFor="gst-recipient">Recipient user ID (optional)</Label>
                <Input
                  id="gst-recipient"
                  placeholder="UUID — filter list & ZIPs"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                />
              </div>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Apply
            </Button>
          </div>

          {mode === "admin" ? (
            <div className="flex flex-wrap items-end gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="gst-month">Bulk download by month</Label>
                <Input id="gst-month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
              <Button
                type="button"
                onClick={() => void downloadZipMonth()}
                disabled={zipLoading !== null}
              >
                {zipLoading === "month" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileArchive className="mr-2 h-4 w-4" />
                )}
                Download ZIP (full month)
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => void downloadZipRange()} disabled={zipLoading !== null}>
              {zipLoading === "range" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileArchive className="mr-2 h-4 w-4" />
              )}
              {mode === "admin" ? "Download ZIP (selected date range)" : "Download all as ZIP (range)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Wallet recharge tax invoices in the selected range</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && rows.length === 0 ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices for this range.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {mode === "admin" ? <TableHead>Recipient</TableHead> : null}
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Taxable</TableHead>
                    <TableHead className="text-right">GST</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[100px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      {mode === "admin" ? (
                        <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                          {r.recipientName || "—"}
                          {r.recipientEmail ? (
                            <span className="block truncate text-[10px]">{r.recipientEmail}</span>
                          ) : null}
                        </TableCell>
                      ) : null}
                      <TableCell className="font-mono text-xs">{r.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.invoiceDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{fmtMoney(r.baseAmountPaise)}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmtMoney(r.totalGstAmountPaise)} ({r.gstPercentage}%)
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmtMoney(r.totalAmountPaise)}
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="sm" onClick={() => downloadPdf(r.id)}>
                          <Download className="h-4 w-4" />
                          <span className="sr-only">Download PDF</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
