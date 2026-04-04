"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Mail } from "lucide-react"

interface ChangeEmailDialogProps {
  currentEmail: string
  onEmailChanged?: (newEmail: string) => void
}

export function ChangeEmailDialog({ currentEmail, onEmailChanged }: ChangeEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"request" | "verify">("request")
  const [newEmail, setNewEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || newEmail === currentEmail) {
      setError("Please enter a different valid email address.")
      return
    }

    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/email-update/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to request OTP")
      
      setSuccess("Verification code sent! Check your new email inbox.")
      setStep("verify")
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code.")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/auth/email-update/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to verify OTP")
      
      setSuccess("Email updated successfully!")
      if (onEmailChanged) onEmailChanged(data.email)
      
      setTimeout(() => {
        setOpen(false)
        setStep("request")
        setNewEmail("")
        setOtp("")
        setSuccess("")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Invalid or expired code")
    } finally {
      setLoading(false)
    }
  }

  const resetState = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setTimeout(() => {
        setStep("request")
        setNewEmail("")
        setOtp("")
        setError("")
        setSuccess("")
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={resetState}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Mail className="mr-2 h-4 w-4" />
          Change Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Email Address</DialogTitle>
          <DialogDescription>
            {step === "request" 
              ? "Enter your new email address. We will send a verification code to confirm."
              : `Enter the 6-digit verification code sent to ${newEmail}`
            }
          </DialogDescription>
        </DialogHeader>

        {step === "request" ? (
          <form onSubmit={handleRequestOTP} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="new@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading || !newEmail}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Verification Code
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-emerald-500">{success}</p>}
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="ghost" onClick={() => setStep("request")} className="mr-auto">
                Back
              </Button>
              <Button type="submit" disabled={loading || otp.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Update
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
