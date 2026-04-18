"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PublicGalleryPinGate({
  publicToken,
  albumTitle,
}: {
  publicToken: string
  albumTitle: string
}) {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = pin.trim().replace(/\s+/g, "")
    if (!/^\d{4,12}$/.test(trimmed)) {
      toast.error("Enter the PIN digits")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/client-gallery/public/${encodeURIComponent(publicToken)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: trimmed }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || "Could not unlock")
      }
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not unlock")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="text-center text-2xl font-semibold text-foreground">{albumTitle}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">This gallery is protected. Enter the PIN to continue.</p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cg-pin">PIN</Label>
          <Input
            id="cg-pin"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
            className="text-center font-mono text-lg tracking-widest"
            disabled={submitting}
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
        </Button>
      </form>
    </div>
  )
}
