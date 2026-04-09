"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Loader2, Youtube, Key, Eye, EyeOff, ExternalLink, CheckCircle2, AlertTriangle, Shield, Users, CreditCard } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const settingsFetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" })
  if (!r.ok) throw new Error("Failed to load settings")
  return r.json() as Promise<{ settings?: { key: string; value: unknown }[] }>
}

export default function IntegrationsSettingsPage() {
  const { toast } = useToast()
  const { data, mutate, isLoading } = useSWR("/api/admin/integrations", fetcher)
  const { data: settingsData, mutate: mutateSettings, isLoading: settingsLoading } = useSWR(
    "/api/settings",
    settingsFetcher,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [pgRazorpay, setPgRazorpay] = useState(true)
  const [pgInstamojo, setPgInstamojo] = useState(true)
  const [pgSaving, setPgSaving] = useState(false)
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [showEncryptionKey, setShowEncryptionKey] = useState(false)

  const [formData, setFormData] = useState({
    google_client_id: "",
    google_client_secret: "",
    encryption_key: "",
    youtube_config_enabled: false,
  })
  const [hasEdited, setHasEdited] = useState(false)

  // Sync from server data on first load
  const displayClientId = hasEdited ? formData.google_client_id : (data?.google_client_id ?? "")
  const displayClientSecret = hasEdited ? formData.google_client_secret : (data?.google_client_secret ?? "")
  const displayEncryptionKey = hasEdited ? formData.encryption_key : (data?.encryption_key ?? "")
  const effectiveYoutubeConfigEnabled = hasEdited ? formData.youtube_config_enabled : (data?.youtube_config_enabled ?? false)

  useEffect(() => {
    if (data && !hasEdited)
      setFormData((prev) => ({ ...prev, youtube_config_enabled: Boolean(data?.youtube_config_enabled) }))
  }, [data?.youtube_config_enabled, hasEdited])

  useEffect(() => {
    const row = settingsData?.settings?.find((s) => s.key === "payment_gateways")
    if (!row?.value || typeof row.value !== "object") return
    const v = row.value as { razorpay?: { enabled?: boolean }; instamojo?: { enabled?: boolean } }
    setPgRazorpay(v?.razorpay?.enabled !== false)
    setPgInstamojo(v?.instamojo?.enabled !== false)
  }, [settingsData])

  const handleFieldChange = (field: string, value: string) => {
    if (!hasEdited) {
      setFormData({
        google_client_id: data?.google_client_id ?? "",
        google_client_secret: data?.google_client_secret ?? "",
        encryption_key: data?.encryption_key ?? "",
      })
      setHasEdited(true)
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: Record<string, string> = {}
      if (formData.google_client_id && formData.google_client_id !== data?.google_client_id) {
        payload.google_client_id = formData.google_client_id
      }
      if (formData.google_client_secret && !formData.google_client_secret.startsWith("****")) {
        payload.google_client_secret = formData.google_client_secret
      }
      if (formData.encryption_key && !formData.encryption_key.startsWith("****")) {
        payload.encryption_key = formData.encryption_key
      }

      payload.youtube_config_enabled = effectiveYoutubeConfigEnabled

      if (Object.keys(payload).length === 0) {
        toast({ title: "No changes to save" })
        setIsSaving(false)
        return
      }

      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Failed to save")

      toast({ title: "Integration settings saved", description: "YouTube API credentials have been updated." })
      setHasEdited(false)
      mutate()
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const isConfigured = data?.has_google_client_id && data?.has_google_client_secret

  const handleSavePaymentGateways = async () => {
    setPgSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "payment_gateways",
          value: {
            razorpay: { enabled: pgRazorpay, label: "Razorpay" },
            instamojo: { enabled: pgInstamojo, label: "Instamojo" },
          },
        }),
      })
      if (!res.ok) throw new Error("save failed")
      toast({ title: "Payment gateways updated", description: "Checkout will show only enabled options." })
      void mutateSettings()
    } catch {
      toast({ title: "Failed to save payment gateways", variant: "destructive" })
    } finally {
      setPgSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="Integrations" subtitle="Configure third-party service credentials" />

      <div className="space-y-6 max-w-2xl">
        {/* Toggle: Show YouTube API Configuration in streamer/studio dashboards */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Show YouTube API Configuration in their dashboard</CardTitle>
                  <CardDescription>
                    By default you configure YouTube API for everyone. Enable this to show the YouTube API Configuration screen in streamer and studio dashboards so they can view and configure it themselves if required.
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={effectiveYoutubeConfigEnabled}
                onCheckedChange={(checked) => {
                  setHasEdited(true)
                  setFormData((prev) => ({ ...prev, youtube_config_enabled: checked }))
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Default: OFF. When OFF, only admins see and manage YouTube API Configuration; streamers and studios use the platform credentials. When ON, they can open the configuration page in their dashboard and configure by themselves.
            </p>
          </CardContent>
        </Card>

        {/* Payment gateways (Razorpay / Instamojo) */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20">
                  <CreditCard className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <CardTitle>Payment gateways</CardTitle>
                  <CardDescription>
                    Control which card/UPI checkout options appear for wallet top-up and Studio subscription. API keys stay in server environment variables (
                    <code className="text-xs">RAZORPAY_*</code>, <code className="text-xs">INSTAMOJO_*</code>).
                  </CardDescription>
                </div>
              </div>
              {settingsLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">Razorpay</p>
                <p className="text-xs text-muted-foreground">Razorpay Checkout (cards, UPI, netbanking)</p>
              </div>
              <Switch checked={pgRazorpay} onCheckedChange={setPgRazorpay} id="pg-razorpay" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">Instamojo</p>
                <p className="text-xs text-muted-foreground">Instamojo payment links (redirect)</p>
              </div>
              <Switch checked={pgInstamojo} onCheckedChange={setPgInstamojo} id="pg-instamojo" />
            </div>
            <p className="text-xs text-muted-foreground">
              If both are off, users cannot pay by card until at least one is enabled (wallet-only Studio upgrade still works when balance is sufficient).
            </p>
            <Button type="button" onClick={() => void handleSavePaymentGateways()} disabled={pgSaving}>
              {pgSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save payment gateways
            </Button>
          </CardContent>
        </Card>

        {/* YouTube / Google OAuth */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                  <Youtube className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle>YouTube Live Streaming API</CardTitle>
                  <CardDescription>Google OAuth credentials for YouTube Live integration</CardDescription>
                </div>
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isConfigured ? (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Configured
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Not configured
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
                <li>Create or select a project and enable the <strong>YouTube Data API v3</strong></li>
                <li>Go to Credentials and create an <strong>OAuth 2.0 Client ID</strong> (Web application)</li>
                <li>Add this exact URL as an <strong>Authorized redirect URI</strong> in Google Console:
                  <p className="mt-1.5 font-mono text-xs bg-secondary rounded px-2 py-1.5 text-foreground break-all">
                    {typeof window !== "undefined"
                      ? `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/youtube/callback`
                      : "/api/auth/youtube/callback"}
                  </p>
                  {typeof window !== "undefined" && !process.env.NEXT_PUBLIC_APP_URL && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      For production, set <code className="rounded bg-secondary px-1">NEXT_PUBLIC_APP_URL</code> to your live site (e.g. <code className="rounded bg-secondary px-1">https://www.streamlivee.com</code>) in your hosting environment so this URI matches.
                    </p>
                  )}
                </li>
                <li>Copy the Client ID and Client Secret below</li>
              </ol>
            </div>

            <Separator />

            {/* Client ID */}
            <div className="space-y-2">
              <Label htmlFor="google-client-id">Google Client ID</Label>
              <Input
                id="google-client-id"
                value={displayClientId}
                onChange={(e) => handleFieldChange("google_client_id", e.target.value)}
                className="bg-secondary border-0 font-mono text-sm"
                placeholder="123456789-xxxxxxx.apps.googleusercontent.com"
              />
              <p className="text-xs text-muted-foreground">
                The OAuth 2.0 Client ID from Google Cloud Console.
                {data?.has_google_client_id && !hasEdited && " Currently set."}
              </p>
            </div>

            {/* Client Secret */}
            <div className="space-y-2">
              <Label htmlFor="google-client-secret">Google Client Secret</Label>
              <div className="relative">
                <Input
                  id="google-client-secret"
                  type={showClientSecret ? "text" : "password"}
                  value={displayClientSecret}
                  onChange={(e) => handleFieldChange("google_client_secret", e.target.value)}
                  className="bg-secondary border-0 font-mono text-sm pr-10"
                  placeholder="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxx"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                The OAuth 2.0 Client Secret. Stored securely in the database.
                {data?.has_google_client_secret && !hasEdited && " Currently set (masked)."}
              </p>
            </div>

            <Separator />

            {/* Encryption Key */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="encryption-key">Token Encryption Key</Label>
              </div>
              <div className="relative">
                <Input
                  id="encryption-key"
                  type={showEncryptionKey ? "text" : "password"}
                  value={displayEncryptionKey}
                  onChange={(e) => handleFieldChange("encryption_key", e.target.value)}
                  className="bg-secondary border-0 font-mono text-sm pr-10"
                  placeholder="64-character hex key (openssl rand -hex 32)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                >
                  {showEncryptionKey ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used to encrypt/decrypt YouTube OAuth tokens at rest. Generate with: <code className="rounded bg-secondary px-1 py-0.5 text-xs font-mono text-foreground">openssl rand -hex 32</code>.
                {data?.has_encryption_key && !hasEdited && " Currently set (masked)."}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={isSaving || (!hasEdited && isConfigured)}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Credentials
              </Button>
              {hasEdited && (
                <Button variant="outline" onClick={() => { setHasEdited(false); setFormData({ google_client_id: "", google_client_secret: "", encryption_key: "", youtube_config_enabled: data?.youtube_config_enabled ?? false }) }}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Env var fallback note */}
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Environment Variable Fallback</CardTitle>
                <CardDescription>Credentials set above take priority over environment variables</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs text-muted-foreground">GOOGLE_CLIENT_ID</code>
                {process.env.NEXT_PUBLIC_HAS_GOOGLE_CLIENT_ID === "true" || data?.has_google_client_id ? (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">Set</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">Not set</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs text-muted-foreground">GOOGLE_CLIENT_SECRET</code>
                {data?.has_google_client_secret ? (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">Set</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">Not set</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <code className="font-mono text-xs text-muted-foreground">ENCRYPTION_KEY</code>
                {data?.has_encryption_key ? (
                  <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-xs">Set</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">Not set</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                If credentials are set both in the UI above and as environment variables, the UI values take priority.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
