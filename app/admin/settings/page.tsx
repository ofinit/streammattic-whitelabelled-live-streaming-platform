"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { Eye, EyeOff, Loader2, Mail, User, Lock, Bell, Shield, Globe, ImageIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import {
  getPlatformARecordDisplay,
  getPlatformCnameDisplay,
  getVerificationTxtHostDisplay,
} from "@/lib/platform-dns"

import { ChangeEmailDialog } from "@/components/settings/change-email-dialog"
import { CloudflareSetupDialog } from "@/components/studio/cloudflare-setup-dialog"

export default function AdminSettingsPage() {
  const { user, changePassword, isLoading } = useAuth()
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
  const [notifications, setNotifications] = useState({
    email: true,
    newStudio: true,
    lowBalance: true,
    systemAlerts: true,
  })
  const [platformSettings, setPlatformSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  })
  const [domainSettings, setDomainSettings] = useState({
    platformDomain: "",
  })
  const [domainSaved, setDomainSaved] = useState(false)

  const [platformFaviconUrl, setPlatformFaviconUrl] = useState("")
  const [platformName, setPlatformName] = useState("")
  const [platformIp, setPlatformIp] = useState("")
  const [platformFaviconLoading, setPlatformFaviconLoading] = useState(false)
  const [platformFaviconSaving, setPlatformFaviconSaving] = useState(false)
  const [platformFaviconMessage, setPlatformFaviconMessage] = useState<"ok" | "err" | null>(null)

  const [platformBrandingSaving, setPlatformBrandingSaving] = useState(false)
  const [platformBrandingMessage, setPlatformBrandingMessage] = useState<"ok" | "err" | null>(null)
  const [smtpSettings, setSmtpSettings] = useState({
    enabled: false,
    host: "",
    port: 587,
    user: "",
    password: "",
    fromEmail: "",
    fromName: "",
    secure: false,
    requireTls: true,
    hasPassword: false,
    clearPassword: false,
  })
  const [smtpLoading, setSmtpLoading] = useState(false)
  const [smtpSaving, setSmtpSaving] = useState(false)
  const [smtpMessage, setSmtpMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)

  const parseSettingsValue = useCallback((raw: unknown): string => {
    if (raw == null) return ""
    if (typeof raw === "string") return raw.trim()
    if (typeof raw === "object" && raw !== null && "url" in raw && typeof (raw as { url: unknown }).url === "string") {
      return (raw as { url: string }).url.trim()
    }
    return ""
  }, [])

  useEffect(() => {
    if (user?.role !== "admin" || isLoading) return
    let cancelled = false
    setPlatformFaviconLoading(true)
    void fetch("/api/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { settings?: { key: string; value: unknown }[] } | null) => {
        if (cancelled || !data?.settings) return
        const favRow = data.settings.find((s) => s.key === "platform_favicon_url")
        const nameRow = data.settings.find((s) => s.key === "platform_name")
        const ipRow = data.settings.find((s) => s.key === "platform_a_record_ip")
        const domainRow = data.settings.find((s) => s.key === "platform_domain")
        
        setPlatformFaviconUrl(parseSettingsValue(favRow?.value))
        setPlatformName(parseSettingsValue(nameRow?.value))
        setPlatformIp(parseSettingsValue(ipRow?.value))
        setDomainSettings({
          platformDomain: parseSettingsValue(domainRow?.value),
        })
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setPlatformFaviconLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.role, isLoading, parseSettingsValue])

  useEffect(() => {
    if (user?.role !== "admin" || isLoading) return
    let cancelled = false
    setSmtpLoading(true)
    void fetch("/api/admin/settings/smtp", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { smtp?: Partial<typeof smtpSettings> } | null) => {
        if (cancelled || !data?.smtp) return
        const smtp = data.smtp
        setSmtpSettings((prev) => ({
          ...prev,
          enabled: smtp.enabled === true,
          host: typeof smtp.host === "string" ? smtp.host : "",
          port: Number(smtp.port || 587),
          user: typeof smtp.user === "string" ? smtp.user : "",
          password: "",
          fromEmail: typeof smtp.fromEmail === "string" ? smtp.fromEmail : "",
          fromName: typeof smtp.fromName === "string" ? smtp.fromName : "",
          secure: smtp.secure === true,
          requireTls: smtp.requireTls !== false,
          hasPassword: smtp.hasPassword === true,
          clearPassword: false,
        }))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSmtpLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user?.role, isLoading])

  const handlePlatformBrandingSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlatformBrandingMessage(null)
    setPlatformBrandingSaving(true)
    try {
      // Save Platform Name
      await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "platform_name",
          value: platformName.trim() || null,
        }),
      })

      // Save Platform IP
      await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "platform_a_record_ip",
          value: platformIp.trim() || null,
        }),
      })

      setPlatformBrandingMessage("ok")
    } catch {
      setPlatformBrandingMessage("err")
    } finally {
      setPlatformBrandingSaving(false)
      setTimeout(() => setPlatformBrandingMessage(null), 4000)
    }
  }

  const handlePlatformFaviconSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPlatformFaviconMessage(null)
    setPlatformFaviconSaving(true)
    try {
      const trimmed = platformFaviconUrl.trim()
      const res = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "platform_favicon_url",
          value: trimmed.length > 0 ? trimmed : null,
        }),
      })
      if (!res.ok) throw new Error("save failed")
      setPlatformFaviconMessage("ok")
    } catch {
      setPlatformFaviconMessage("err")
    } finally {
      setPlatformFaviconSaving(false)
      setTimeout(() => setPlatformFaviconMessage(null), 4000)
    }
  }

  const handleDomainSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setDomainSaved(false)
    try {
      await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "platform_domain",
          value: domainSettings.platformDomain.trim() || null,
        }),
      })

      setDomainSaved(true)
      setTimeout(() => setDomainSaved(false), 3000)
    } catch {
      // Error
    }
  }

  const handleSmtpSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSmtpMessage(null)
    setSmtpSaving(true)
    try {
      const res = await fetch("/api/admin/settings/smtp", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(smtpSettings),
      })
      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        smtp?: Partial<typeof smtpSettings>
      }
      if (!res.ok) throw new Error(data.error || "Failed to save SMTP settings")
      if (data.smtp) {
        setSmtpSettings((prev) => ({
          ...prev,
          enabled: data.smtp?.enabled === true,
          host: typeof data.smtp?.host === "string" ? data.smtp.host : prev.host,
          port: Number(data.smtp?.port || prev.port || 587),
          user: typeof data.smtp?.user === "string" ? data.smtp.user : prev.user,
          password: "",
          fromEmail: typeof data.smtp?.fromEmail === "string" ? data.smtp.fromEmail : prev.fromEmail,
          fromName: typeof data.smtp?.fromName === "string" ? data.smtp.fromName : prev.fromName,
          secure: data.smtp?.secure === true,
          requireTls: data.smtp?.requireTls !== false,
          hasPassword: data.smtp?.hasPassword === true,
          clearPassword: false,
        }))
      }
      setSmtpMessage({ type: "success", text: "Platform SMTP settings saved." })
    } catch (error) {
      setSmtpMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save SMTP settings",
      })
    } finally {
      setSmtpSaving(false)
      setTimeout(() => setSmtpMessage(null), 5000)
    }
  }

  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

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
      <Header title="Settings" subtitle="Manage platform and account settings" />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-10 md:px-6">
        {/* Account: profile + password side-by-side on large screens */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Profile Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your admin profile details</CardDescription>
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
                  placeholder="admin_username"
                />
                <p className="text-xs text-muted-foreground">Used for your admin profile identifier</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-secondary border-0 opacity-80 min-w-0 flex-1"
                  />
                  <ChangeEmailDialog 
                    currentEmail={profileData.email} 
                    onEmailChanged={(newEmail) => setProfileData({ ...profileData, email: newEmail })} 
                  />
                </div>
                <p className="text-xs text-muted-foreground">Used for login and critical notifications. Changing this requires verification.</p>
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

        {/* Password Settings */}
        <Card className="border-border bg-card h-fit">
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

        {/* Platform Settings — full width */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure global platform behavior</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Maintenance Mode</p>
                <p className="text-sm text-muted-foreground">Temporarily disable access for non-admins</p>
              </div>
              <Switch
                checked={platformSettings.maintenanceMode}
                onCheckedChange={(checked) => setPlatformSettings({ ...platformSettings, maintenanceMode: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Allow Registration</p>
                <p className="text-sm text-muted-foreground">Allow new users to register on the platform</p>
              </div>
              <Switch
                checked={platformSettings.allowRegistration}
                onCheckedChange={(checked) => setPlatformSettings({ ...platformSettings, allowRegistration: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Require Email Verification</p>
                <p className="text-sm text-muted-foreground">New users must verify email before accessing dashboard</p>
              </div>
              <Switch
                checked={platformSettings.requireEmailVerification}
                onCheckedChange={(checked) =>
                  setPlatformSettings({ ...platformSettings, requireEmailVerification: checked })
                }
              />
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Platform Branding</p>
                  <p className="text-sm text-muted-foreground">
                    Set your brand name and infrastructure details used for white-labeling.
                  </p>
                </div>
              </div>
              <form onSubmit={handlePlatformBrandingSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="platformName">Brand Name</Label>
                    <Input
                      id="platformName"
                      placeholder="e.g. LiveStream Pro"
                      value={platformName}
                      onChange={(e) => setPlatformName(e.target.value)}
                      className="bg-secondary border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platformIp">Server IP Address</Label>
                    <Input
                      id="platformIp"
                      placeholder="e.g. 204.168.228.71"
                      value={platformIp}
                      onChange={(e) => setPlatformIp(e.target.value)}
                      className="bg-secondary border-0"
                    />
                  </div>
                </div>
                {platformBrandingMessage === "ok" && (
                  <p className="text-sm text-emerald-500">Platform branding settings saved.</p>
                )}
                <Button type="submit" disabled={platformBrandingSaving || platformFaviconLoading}>
                  {platformBrandingSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Branding Settings
                </Button>
              </form>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                  <ImageIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Platform favicon</p>
                  <p className="text-sm text-muted-foreground">
                    Shown on every page (including streamers and public events). Leave empty to use the default red live
                    icon, or per-studio favicons when no platform favicon is set.
                  </p>
                </div>
              </div>
              <form onSubmit={handlePlatformFaviconSave} className="space-y-2">
                <Label htmlFor="platformFaviconUrl">Favicon URL</Label>
                <Input
                  id="platformFaviconUrl"
                  type="url"
                  placeholder="https://cdn.example.com/favicon.ico"
                  value={platformFaviconUrl}
                  onChange={(e) => setPlatformFaviconUrl(e.target.value)}
                  disabled={platformFaviconLoading}
                  className="bg-secondary border-0"
                />
                {platformFaviconMessage === "ok" && (
                  <p className="text-sm text-emerald-500">Platform favicon saved. Refresh open tabs to see it.</p>
                )}
                {platformFaviconMessage === "err" && (
                  <p className="text-sm text-destructive">Could not save. Try again or check you are logged in as admin.</p>
                )}
                <Button type="submit" disabled={platformFaviconSaving || platformFaviconLoading}>
                  {platformFaviconSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save platform favicon
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Platform SMTP — full width */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Platform SMTP</CardTitle>
                <CardDescription>
                  Configure the default mail server for platform emails. Studio custom SMTP still overrides this per studio.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSmtpSave} className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                <div>
                  <p className="font-medium text-foreground">Enable platform SMTP</p>
                  <p className="text-sm text-muted-foreground">
                    When enabled, platform emails use this SMTP config before falling back to environment email settings.
                  </p>
                </div>
                <Switch
                  checked={smtpSettings.enabled}
                  onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, enabled: checked })}
                  disabled={smtpLoading}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformSmtpHost">SMTP Host</Label>
                  <Input
                    id="platformSmtpHost"
                    value={smtpSettings.host}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                    placeholder="smtp.example.com"
                    className="bg-secondary border-0"
                    disabled={smtpLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformSmtpPort">SMTP Port</Label>
                  <Input
                    id="platformSmtpPort"
                    type="number"
                    min={1}
                    max={65535}
                    value={smtpSettings.port || ""}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, port: Number(e.target.value) || 587 })}
                    placeholder="587"
                    className="bg-secondary border-0"
                    disabled={smtpLoading}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformSmtpUser">SMTP User</Label>
                  <Input
                    id="platformSmtpUser"
                    value={smtpSettings.user}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, user: e.target.value })}
                    placeholder="user@example.com"
                    className="bg-secondary border-0"
                    disabled={smtpLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformSmtpPassword">
                    SMTP Password {smtpSettings.hasPassword && !smtpSettings.clearPassword ? "(saved)" : ""}
                  </Label>
                  <div className="relative">
                    <Input
                      id="platformSmtpPassword"
                      type={showSmtpPassword ? "text" : "password"}
                      value={smtpSettings.password}
                      onChange={(e) =>
                        setSmtpSettings({ ...smtpSettings, password: e.target.value, clearPassword: false })
                      }
                      placeholder={smtpSettings.hasPassword ? "Leave blank to keep existing password" : "SMTP password"}
                      className="bg-secondary border-0 pr-10"
                      disabled={smtpLoading}
                      autoComplete="new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSmtpPassword((v) => !v)}
                      aria-label={showSmtpPassword ? "Hide SMTP password" : "Show SMTP password"}
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {smtpSettings.hasPassword ? (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs text-destructive"
                      onClick={() => setSmtpSettings({ ...smtpSettings, password: "", clearPassword: true, hasPassword: false })}
                    >
                      Clear saved SMTP password
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformSmtpFromEmail">From Email</Label>
                  <Input
                    id="platformSmtpFromEmail"
                    type="email"
                    value={smtpSettings.fromEmail}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                    placeholder="noreply@yourdomain.com"
                    className="bg-secondary border-0"
                    disabled={smtpLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="platformSmtpFromName">From Name</Label>
                  <Input
                    id="platformSmtpFromName"
                    value={smtpSettings.fromName}
                    onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                    placeholder={platformName || "StreamLivee"}
                    className="bg-secondary border-0"
                    disabled={smtpLoading}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Use SSL / implicit TLS</p>
                    <p className="text-xs text-muted-foreground">Usually enabled for port 465.</p>
                  </div>
                  <Switch
                    checked={smtpSettings.secure}
                    onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, secure: checked })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Require STARTTLS</p>
                    <p className="text-xs text-muted-foreground">Usually enabled for port 587.</p>
                  </div>
                  <Switch
                    checked={smtpSettings.requireTls}
                    onCheckedChange={(checked) => setSmtpSettings({ ...smtpSettings, requireTls: checked })}
                  />
                </div>
              </div>

              {smtpMessage ? (
                <p className={`text-sm ${smtpMessage.type === "success" ? "text-emerald-500" : "text-destructive"}`}>
                  {smtpMessage.text}
                </p>
              ) : null}

              <Button type="submit" disabled={smtpSaving || smtpLoading}>
                {(smtpSaving || smtpLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save SMTP Settings
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Platform Domain — full width */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Platform Domain</CardTitle>
                  <CardDescription>Set your primary platform domain. Studio DNS records will reference this.</CardDescription>
                </div>
              </div>
              {domainSettings.platformDomain && (
                <CloudflareSetupDialog 
                  domainId="platform" 
                  domainName={domainSettings.platformDomain} 
                  onSuccess={() => {}} 
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDomainSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platformDomain">Primary Platform Domain</Label>
                <Input
                  id="platformDomain"
                  placeholder="e.g. myplatform.io"
                  value={domainSettings.platformDomain}
                  onChange={(e) => setDomainSettings({ ...domainSettings, platformDomain: e.target.value })}
                  className="bg-secondary border-0"
                />
                <p className="text-xs text-muted-foreground">
                  The main domain your admin panel and platform runs on.
                </p>
              </div>
              <Separator />
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">Records Configuration (Cloudflare example)</p>
                <div className="space-y-4 font-mono text-xs text-muted-foreground">
                  <div className="space-y-1">
                    <p className="font-bold text-foreground opacity-60 text-[10px] uppercase">Routing Records</p>
                    <div className="rounded border bg-background/50 divide-y overflow-hidden border-border/50">
                       <div className="flex px-3 py-2 bg-muted/50 font-bold border-b text-[10px] uppercase">
                          <span className="w-12">Type</span>
                          <span className="w-32">Name</span>
                          <span className="flex-1">Content</span>
                       </div>
                       <div className="flex px-3 py-2 items-center">
                          <span className="w-12 text-primary font-bold">A</span>
                          <span className="w-32 text-foreground">clientbrand.com</span>
                          <span className="flex-1">{getPlatformARecordDisplay(platformIp)}</span>
                       </div>
                       <div className="flex px-3 py-2 items-center">
                          <span className="w-12 text-primary font-bold">A</span>
                          <span className="w-32 text-foreground">www</span>
                          <span className="flex-1">{getPlatformARecordDisplay(platformIp)}</span>
                       </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">* Both must be A records. Subdomains should also use A records to the same IP. CNAMEs are not required.</p>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="font-bold text-foreground opacity-60 text-[10px] uppercase">Verification Record</p>
                    <p>Type: <span className="font-bold">TXT</span> &nbsp; Host: <span className="text-foreground">{getVerificationTxtHostDisplay("clientbrand.com")}</span> &rarr; (unique token)</p>
                  </div>
                </div>
              </div>
              {domainSaved && <p className="text-sm text-emerald-500">Platform domain settings saved!</p>}
              <Button type="submit" disabled={!domainSettings.platformDomain.trim()}>Save Domain Settings</Button>
            </form>
          </CardContent>
        </Card>

        {/* Notifications + Security — side-by-side on large screens */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Notification Settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive important updates via email</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">New Studio Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when new studios sign up</p>
              </div>
              <Switch
                checked={notifications.newStudio}
                onCheckedChange={(checked) => setNotifications({ ...notifications, newStudio: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Low Balance Warnings</p>
                <p className="text-sm text-muted-foreground">Alert when studio balance is low</p>
              </div>
              <Switch
                checked={notifications.lowBalance}
                onCheckedChange={(checked) => setNotifications({ ...notifications, lowBalance: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">System Alerts</p>
                <p className="text-sm text-muted-foreground">Critical system and security notifications</p>
              </div>
              <Switch
                checked={notifications.systemAlerts}
                onCheckedChange={(checked) => setNotifications({ ...notifications, systemAlerts: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-border bg-card h-fit">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage security settings and active sessions</CardDescription>
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
    </div>
  )
}
