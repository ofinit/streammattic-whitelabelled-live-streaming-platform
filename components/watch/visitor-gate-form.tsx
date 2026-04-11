"use client"

import { useMemo, useState, type FormEvent } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChevronsUpDown, UserCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  PHONE_DIAL_OPTIONS,
  composeInternationalPhone,
  flagEmojiFromIso,
} from "@/lib/phone-country-codes"

const fieldBorderClass =
  "border-2 border-primary/50 bg-secondary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"

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
  const [dialOpen, setDialOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const selectedDial = useMemo(
    () => PHONE_DIAL_OPTIONS.find((o) => o.dial === phoneDial) ?? PHONE_DIAL_OPTIONS[0],
    [phoneDial],
  )

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
                className={fieldBorderClass}
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
                className={fieldBorderClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile number</Label>
              <div className="flex gap-2">
                <Popover open={dialOpen} onOpenChange={setDialOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={dialOpen}
                      className={cn(
                        "h-10 w-[118px] shrink-0 justify-between px-2 font-mono tabular-nums hover:bg-secondary/80",
                        fieldBorderClass,
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="text-lg leading-none" aria-hidden>
                          {flagEmojiFromIso(selectedDial.iso)}
                        </span>
                        <span>{phoneDial}</span>
                      </span>
                      <ChevronsUpDown className="ml-0.5 h-4 w-4 shrink-0 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,280px)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search code or country…" className="h-9" />
                      <CommandList className="max-h-[280px]">
                        <CommandEmpty>No match.</CommandEmpty>
                        <CommandGroup>
                          {PHONE_DIAL_OPTIONS.map((o) => (
                            <CommandItem
                              key={`${o.iso}-${o.dial}`}
                              value={`${o.dial} ${o.iso} ${o.name}`}
                              onSelect={() => {
                                setPhoneDial(o.dial)
                                setDialOpen(false)
                              }}
                            >
                              <span className="mr-2 text-lg leading-none" aria-hidden>
                                {flagEmojiFromIso(o.iso)}
                              </span>
                              <span className="font-mono tabular-nums">{o.dial}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Input
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="Number"
                  value={phoneLocal}
                  onChange={(e) => setPhoneLocal(e.target.value)}
                  className={cn("min-w-0 flex-1", fieldBorderClass)}
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              By continuing, you agree to our processing of this data as described in our{" "}
              <button
                type="button"
                className="text-foreground underline underline-offset-2 hover:text-primary"
                onClick={() => setPrivacyOpen(true)}
              >
                Privacy Policy
              </button>
              .
            </p>
            <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
              <DialogContent className="flex max-h-[min(85vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
                <DialogHeader className="shrink-0 border-b border-border px-6 py-4 text-left">
                  <DialogTitle>Privacy Policy</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Last updated: April 10, 2026
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[min(60vh,520px)] px-6 py-4">
                  <div className="space-y-1 pb-2 text-sm leading-relaxed text-foreground/90">
                    <PrivacyPolicyContent />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
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
