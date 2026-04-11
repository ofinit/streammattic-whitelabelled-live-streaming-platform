"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCircle2 } from "lucide-react"
import { PHONE_DIAL_OPTIONS, composeInternationalPhone } from "@/lib/phone-country-codes"

const STORAGE_KEY_PREFIX = "sl_visitor_gate:"

export function visitorGateStorageKey(eventId: string) {
  return `${STORAGE_KEY_PREFIX}${eventId}`
}

export function readVisitorGateComplete(eventId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(visitorGateStorageKey(eventId)) === "1"
  } catch {
    return false
  }
}

export function writeVisitorGateComplete(eventId: string) {
  try {
    sessionStorage.setItem(visitorGateStorageKey(eventId), "1")
  } catch {
    /* ignore */
  }
}

export function VisitorGateForm({
  eventId,
  eventTitle,
  onComplete,
}: {
  eventId: string
  eventTitle?: string
  onComplete: () => void
}) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneDial, setPhoneDial] = useState("+91")
  const [phoneLocal, setPhoneLocal] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    const phone = composeInternationalPhone(phoneDial, phoneLocal)
    if (!fullName.trim()) {
      setError("Please enter your full name.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.")
      return
    }
    if (!phone || phone.replace(/\s/g, "").length < 8) {
      setError("Please enter a valid mobile number.")
      return
    }

    setSubmitting(true)
    try {
      const utmQuery = typeof window !== "undefined" ? window.location.search : ""
      const res = await fetch(`/api/watch/${encodeURIComponent(eventId)}/visitor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phoneDial,
          phoneLocal,
          utmQuery,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        return
      }
      writeVisitorGateComplete(eventId)
      onComplete()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <UserCircle2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Before you watch</CardTitle>
          <p className="text-sm text-muted-foreground">
            {eventTitle ? `Enter your details to continue to “${eventTitle}”.` : "Enter your details to continue."}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vg-full-name">Full name</Label>
              <Input
                id="vg-full-name"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary border-0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vg-email">Email</Label>
              <Input
                id="vg-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary border-0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile number</Label>
              <div className="flex gap-2">
                <Select value={phoneDial} onValueChange={setPhoneDial}>
                  <SelectTrigger className="w-[140px] shrink-0 bg-secondary border-0">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {PHONE_DIAL_OPTIONS.map((o) => (
                      <SelectItem key={`${o.iso}-${o.dial}`} value={o.dial}>
                        {o.dial} {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="Number"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  className="min-w-0 flex-1 bg-secondary border-0"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our processing of this data as described in our{" "}
              <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
              </Link>
              .
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Please wait…" : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
