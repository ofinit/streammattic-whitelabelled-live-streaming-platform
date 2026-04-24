"use client"

import type React from "react"
import { useState, useEffect } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { Loader2, User, Lock, Bell, Shield, CheckCircle, AlertCircle, CreditCard, ShieldCheck } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ChangeEmailDialog } from "@/components/settings/change-email-dialog"
import { BillingGstSection } from "@/components/settings/billing-gst-section"
import { StudioUpgradePaymentPanel } from "@/components/streamer/studio-upgrade-payment-panel"
import { parseStudioAnnualSubscription } from "@/lib/studio-subscription-public"
import { calendarDaysUntilSubscriptionEnd, isStudioSubscriptionPastDue } from "@/lib/studio-subscription-shared"
import { toast } from "sonner"

const settingsFetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StudioSettingsPage() {
  const { user, changePassword, isLoading, refreshUser } = useAuth()
  const [renewPayMethod, setRenewPayMethod] = useState<"wallet" | "razorpay" | "instamojo">("wallet")

  const { data: settingsData } = useSWR(user?.role === "studio" ? "/api/settings" : null, settingsFetcher, {
    refreshInterval: 60_000,
  })
  const { data: dashData } = useSWR(user?.role === "studio" ? "/api/studio/dashboard" : null, settingsFetcher, {
    refreshInterval: 30_000,
  })
  const settingsRows = (settingsData?.settings ?? []) as { key: string; value: unknown }[]
  const studioSubRaw = settingsRows.find((s) => s.key === "studio_annual_subscription")?.value
  const studioSubscription = parseStudioAnnualSubscription(studioSubRaw)
  const studioRenewalAvailable = Boolean(studioSubscription?.enabled && studioSubscription.pricePaisa > 0)
  const walletBalancePaise = Number((dashData?.stats as { walletBalance?: number } | undefined)?.walletBalance ?? 0)

  const subExpiresIso = user?.studioSubscriptionExpiresAt ?? null
  const subExpired = subExpiresIso != null && isStudioSubscriptionPastDue(subExpiresIso)
  const daysLeft =
    subExpiresIso && !isStudioSubscriptionPastDue(subExpiresIso) ? calendarDaysUntilSubscriptionEnd(subExpiresIso) : null
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    username: user?.email?.split("@")[0] || "",
    email: user?.email || "",
    phone: user?.phone || "",
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
          phone: profileData.phone,
        }),
      })
      if (!res.ok) throw new Error("Failed to update profile")
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
        {user?.role === "studio" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Studio subscription</CardTitle>
                  <CardDescription>Annual white-label plan — renew to keep creating and editing events</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {subExpiresIso ? (
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Current period ends: </span>
                  <strong className="tabular-nums">
                    {new Date(subExpiresIso).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </strong>
                  {daysLeft !== null && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({daysLeft === 0 ? "renew today" : `${daysLeft} calendar days left`})
                    </span>
                  )}
                  {subExpired && (
                    <span className="block text-destructive font-medium mt-1">
                      Expired — renew below to restore event creation and editing.
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No renewal date on file. Contact support if this looks wrong.</p>
              )}
              {studioRenewalAvailable && studioSubscription ? (
                <StudioUpgradePaymentPanel
                  pricePaisa={studioSubscription.pricePaisa}
                  walletBalancePaise={walletBalancePaise}
                  selectedGateway={renewPayMethod}
                  onSelectedGatewayChange={setRenewPayMethod}
                  showActions
                  onPaidSuccess={async () => {
                    toast.success("Subscription renewed for one year.")
                    await refreshUser()
                  }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Renewal checkout is not available right now.</p>
              )}
            </CardContent>
          </Card>
        )}

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
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  className="bg-secondary border-0"
                  placeholder="studio_username"
                />
                <p className="text-xs text-muted-foreground">Used for your public profile URL</p>
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
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="bg-secondary border-0"
                  placeholder="+1 (555) 000-0000"
                />
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

        <BillingGstSection />

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

        {/* Security Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Active Sessions</p>
                <p className="text-sm text-muted-foreground">You are currently logged in on 1 device</p>
              </div>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
