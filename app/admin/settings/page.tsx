"use client"

import type React from "react"
import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/lib/auth-context"
import { Loader2, User, Lock, Bell, Shield, Globe } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function AdminSettingsPage() {
  const { user, changePassword, isLoading } = useAuth()
  const [profileData, setProfileData] = useState({
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ").slice(1).join(" ") || "",
    username: user?.email?.split("@")[0] || "",
    email: user?.email || "",
    phone: "",
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
    studioCnameTarget: "cname.vercel-dns.com",
  })
  const [domainSaved, setDomainSaved] = useState(false)

  const handleDomainSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setDomainSaved(true)
    setTimeout(() => setDomainSaved(false), 3000)
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would call the profile update API
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
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-secondary border-0 opacity-50"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
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
              <Button type="submit">Save Changes</Button>
            </form>
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

        {/* Platform Settings */}
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
          </CardContent>
        </Card>

        {/* Platform Domain */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Platform Domain</CardTitle>
                <CardDescription>Set your primary platform domain. Studio DNS records will reference this.</CardDescription>
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="cnameTarget">Studio CNAME Target</Label>
                <Input
                  id="cnameTarget"
                  placeholder="cname.vercel-dns.com"
                  value={domainSettings.studioCnameTarget}
                  onChange={(e) => setDomainSettings({ ...domainSettings, studioCnameTarget: e.target.value })}
                  className="bg-secondary border-0"
                />
                <p className="text-xs text-muted-foreground">
                  {"Studios' www CNAME records will point here. Default: cname.vercel-dns.com (Vercel). Change only if using a custom proxy or CDN."}
                </p>
              </div>
              <Separator />
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="text-xs font-medium text-foreground">Studio DNS Records Preview</p>
                <p className="text-xs text-muted-foreground">
                  When you configure a studio domain (e.g. clientbrand.com), they will need:
                </p>
                <div className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                  <p>A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; clientbrand.com &rarr; 76.76.21.21</p>
                  <p>CNAME &nbsp; www.clientbrand.com &rarr; {domainSettings.studioCnameTarget || "cname.vercel-dns.com"}</p>
                  <p>TXT &nbsp;&nbsp;&nbsp; _verify.clientbrand.com &rarr; (auto-generated)</p>
                </div>
              </div>
              {domainSaved && <p className="text-sm text-emerald-500">Platform domain settings saved!</p>}
              <Button type="submit" disabled={!domainSettings.platformDomain.trim()}>Save Domain Settings</Button>
            </form>
          </CardContent>
        </Card>

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
        <Card className="border-border bg-card">
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
  )
}
