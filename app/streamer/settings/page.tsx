"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { Loader2, User, Lock, Bell, CheckCircle, AlertCircle, ShieldCheck, ChevronsUpDown } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ChangeEmailDialog } from "@/components/settings/change-email-dialog"
import { BillingGstSection } from "@/components/settings/billing-gst-section"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { PHONE_DIAL_OPTIONS, flagEmojiFromIso, normalizeSignupPhoneStorage, parseStoredPhone } from "@/lib/phone-country-codes"
import { cn } from "@/lib/utils"

export default function StreamerSettingsPage() {
  const { user, changePassword, isLoading } = useAuth()
  const parsedPhone = parseStoredPhone(user?.phone || "")
  const [phoneDial, setPhoneDial] = useState(parsedPhone.dial)
  const [phoneLocal, setPhoneLocal] = useState(parsedPhone.local)
  const [dialOpen, setDialOpen] = useState(false)
  const selectedDial = PHONE_DIAL_OPTIONS.find((o) => o.dial === phoneDial) ?? PHONE_DIAL_OPTIONS[0]!
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    username: user?.username || "",
    email: user?.email || "",
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Crew PIN display mode
  const [crewDisplayMode, setCrewDisplayMode] = useState<"crew_page" | "template_bottom">("crew_page")
  const [crewDisplaySaving, setCrewDisplaySaving] = useState(false)
  const [crewDisplayMessage, setCrewDisplayMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetch("/api/settings/crew-pin-display")
      .then((r) => r.json())
      .then((data) => { if (data?.mode) setCrewDisplayMode(data.mode) })
      .catch(() => {})
  }, [])

  const saveCrewDisplayMode = async (mode: "crew_page" | "template_bottom") => {
    setCrewDisplaySaving(true)
    setCrewDisplayMessage(null)
    try {
      const res = await fetch("/api/settings/crew-pin-display", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      if (!res.ok) throw new Error()
      setCrewDisplayMode(mode)
      setCrewDisplayMessage({ type: "success", text: "Setting saved." })
      setTimeout(() => setCrewDisplayMessage(null), 3000)
    } catch {
      setCrewDisplayMessage({ type: "error", text: "Failed to save setting." })
    } finally {
      setCrewDisplaySaving(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileMessage(null)
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: normalizeSignupPhoneStorage(phoneDial, phoneLocal),
          username: profileData.username || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setProfileMessage({ type: "error", text: data.error || "Failed to update profile" })
        return
      }
      setProfileMessage({ type: "success", text: "Profile updated successfully!" })
      setTimeout(() => setProfileMessage(null), 3000)
    } catch {
      setProfileMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess(false)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    const success = await changePassword(passwordData.currentPassword, passwordData.newPassword)
    if (success) {
      setPasswordSuccess(true)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } else {
      setPasswordError("Failed to change password")
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account settings" />

      <div className="space-y-6 max-w-2xl">
        {/* Profile Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="bg-secondary border-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value.toLowerCase() })}
                  className="bg-secondary border-0"
                  placeholder="johndoe"
                  autoComplete="username"
                />
                <p className="text-xs text-muted-foreground">3–30 chars: letters, numbers, _ . - · Can be used to log in instead of email</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  Email
                  {user?.emailVerified ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors border-0">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0 hover:bg-destructive/20 transition-colors">
                      <AlertCircle className="h-3 w-3" /> Unverified
                    </Badge>
                  )}
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-secondary border-0 opacity-80 flex-1 max-w-sm"
                  />
                  <ChangeEmailDialog 
                    currentEmail={profileData.email} 
                    onEmailChanged={(newEmail) => {
                      setProfileData({ ...profileData, email: newEmail })
                      if (user) user.emailVerified = true
                    }} 
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used for login and notifications.</p>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <div className="flex gap-2">
                  <Popover open={dialOpen} onOpenChange={setDialOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="h-10 w-[118px] shrink-0 justify-between px-2 font-mono tabular-nums bg-secondary border-0"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="text-lg leading-none">{flagEmojiFromIso(selectedDial.iso)}</span>
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
                                onSelect={() => { setPhoneDial(o.dial); setDialOpen(false) }}
                              >
                                <span className="mr-2 text-lg leading-none">{flagEmojiFromIso(o.iso)}</span>
                                <span className="font-mono tabular-nums">{o.dial}</span>
                                <span className="ml-2 truncate text-muted-foreground text-xs">{o.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder={phoneDial === "+91" ? "10-digit number" : "Number"}
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    className="min-w-0 flex-1 bg-secondary border-0"
                    autoComplete="tel-national"
                  />
                </div>
              </div>
              {profileMessage && (
                <p className={`text-sm ${profileMessage.type === "success" ? "text-emerald-500" : "text-destructive"}`}>
                  {profileMessage.text}
                </p>
              )}
              <Button type="submit" disabled={profileSaving}>
                {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <BillingGstSection initialBillingState={user?.billingState} />

        {/* Crew PIN Display Setting */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Crew Access Display</CardTitle>
                <CardDescription>Choose where crew members enter their PIN to see stream credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              type="button"
              onClick={() => saveCrewDisplayMode("crew_page")}
              disabled={crewDisplaySaving}
              className={`w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                crewDisplayMode === "crew_page"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${crewDisplayMode === "crew_page" ? "border-primary" : "border-muted-foreground"}`}>
                {crewDisplayMode === "crew_page" && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="font-medium text-sm">At /crew page</p>
                <p className="text-xs text-muted-foreground mt-0.5">Crew visits <span className="font-mono">/event-slug/crew</span> to enter PIN and view credentials</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => saveCrewDisplayMode("template_bottom")}
              disabled={crewDisplaySaving}
              className={`w-full flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                crewDisplayMode === "template_bottom"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/50"
              }`}
            >
              <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${crewDisplayMode === "template_bottom" ? "border-primary" : "border-muted-foreground"}`}>
                {crewDisplayMode === "template_bottom" && <div className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <div>
                <p className="font-medium text-sm">At bottom of watch page</p>
                <p className="text-xs text-muted-foreground mt-0.5">A minimal PIN entry appears at the bottom of every event page — crew enters PIN directly there</p>
              </div>
            </button>

            {crewDisplaySaving && <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</p>}
            {crewDisplayMessage && (
              <p className={`text-xs ${crewDisplayMessage.type === "success" ? "text-emerald-500" : "text-destructive"}`}>
                {crewDisplayMessage.text}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password regularly for security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="bg-secondary border-0"
                />
              </div>
              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-emerald-500">Password changed successfully!</p>}
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
