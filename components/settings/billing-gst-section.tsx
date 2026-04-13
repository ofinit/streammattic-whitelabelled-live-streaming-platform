"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Receipt } from "lucide-react"
import { INDIAN_STATES_AND_UT } from "@/lib/indian-states"
import type { GstProfileType } from "@/lib/indian-states"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const GST_TYPE_OPTIONS: { value: GstProfileType; label: string }[] = [
  { value: "individual", label: "Individual" },
  { value: "business_registered", label: "Business (GST registered)" },
  { value: "business_unregistered", label: "Business (not GST registered)" },
]

export function BillingGstSection() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  /** Mirrors `users.phone` from Profile — not edited here. */
  const [profilePhoneDisplay, setProfilePhoneDisplay] = useState<string | null>(null)
  const [billingState, setBillingState] = useState("")
  const [gstType, setGstType] = useState<GstProfileType>("individual")
  const [businessName, setBusinessName] = useState("")
  const [gstNumber, setGstNumber] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [city, setCity] = useState("")
  const [pincode, setPincode] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/user/billing", { credentials: "include" })
      const data = (await res.json()) as Record<string, unknown>
      if (!res.ok) {
        setMessage({ type: "error", text: (data.error as string) || "Failed to load billing" })
        return
      }
      setProfilePhoneDisplay(typeof data.phone === "string" && data.phone.trim() ? data.phone.trim() : null)
      setBillingState((data.billingState as string) ?? "")
      setGstType((data.gstType as GstProfileType) || "individual")
      setBusinessName((data.businessName as string) ?? "")
      setGstNumber((data.gstNumber as string) ?? "")
      setBusinessAddress((data.businessAddress as string) ?? "")
      setCity((data.city as string) ?? "")
      setPincode((data.pincode as string) ?? "")
    } catch {
      setMessage({ type: "error", text: "Failed to load billing" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/user/billing", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingState,
          gstType,
          businessName,
          gstNumber,
          businessAddress,
          city,
          pincode,
        }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Save failed" })
        return
      }
      setMessage({ type: "success", text: "Billing details saved." })
      setTimeout(() => setMessage(null), 4000)
    } catch {
      setMessage({ type: "error", text: "Save failed" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading billing…
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Billing and GST</CardTitle>
            <CardDescription>
              Used for tax invoices (B2B when GSTIN is provided, otherwise B2C). Mobile number is taken from your
              profile above. Business name and GSTIN are optional.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {profilePhoneDisplay ? (
              <p>
                <span className="font-medium text-foreground">Mobile for invoices:</span> {profilePhoneDisplay}{" "}
                <span className="text-xs">(from Profile)</span>
              </p>
            ) : (
              <p className="text-amber-600 dark:text-amber-400">
                Add a valid mobile number in <span className="font-medium">Profile information</span> above, then
                save billing here.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>State (GST)</Label>
            <Select value={billingState} onValueChange={setBillingState} required>
              <SelectTrigger className="bg-secondary border-0 w-full">
                <SelectValue placeholder="Select state / UT" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {INDIAN_STATES_AND_UT.map((s) => (
                  <SelectItem key={s.code} value={s.code}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-base">GST profile type</Label>
            <RadioGroup
              value={gstType}
              onValueChange={(v) => setGstType(v as GstProfileType)}
              className="grid gap-2"
            >
              {GST_TYPE_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`gst-${opt.value}`} />
                  <Label htmlFor={`gst-${opt.value}`} className="font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-business">Business name (optional)</Label>
            <Input
              id="bill-business"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="bg-secondary border-0"
              placeholder="Registered or trading name on invoice"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bill-gstin">GSTIN (optional)</Label>
            <Input
              id="bill-gstin"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              className="bg-secondary border-0 font-mono"
              placeholder="15-character GSTIN"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              If provided, invoices are treated as B2B; otherwise B2C.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bill-address">Billing address</Label>
            <Input
              id="bill-address"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="bg-secondary border-0"
              placeholder="Street, building, locality"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bill-city">City</Label>
              <Input
                id="bill-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bill-pincode">PIN code</Label>
              <Input
                id="bill-pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="bg-secondary border-0"
                inputMode="numeric"
              />
            </div>
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-500" : "text-destructive"}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={saving || !profilePhoneDisplay}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save billing details
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
