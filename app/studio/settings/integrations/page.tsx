"use client"

import { useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Youtube, Key, Eye, EyeOff, ExternalLink, CheckCircle2, AlertTriangle, Info, Trash2, Lock } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StudioIntegrationsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const studioId = user?.id || "studio-1"

  const { data: settingsData } = useSWR<{ settings?: { key: string; value: unknown }[] }>("/api/settings", fetcher)
  const platformYoutubeEnabled =
    settingsData?.settings?.find((s) => s.key === "youtube_config_enabled")?.value === true ||
    settingsData?.settings?.find((s) => s.key === "youtube_config_enabled")?.value === "true"
  const override = settingsData?.settings?.find((s) => s.key === "youtube_config_override")?.value
  const youtubeConfigEnabled =
    override === true || override === "true"
      ? true
      : override === false || override === "false"
        ? false
        : Boolean(platformYoutubeEnabled)

  const { data, mutate, isLoading } = useSWR(
    youtubeConfigEnabled ? `/api/studio/integrations?studioId=${studioId}` : null,
    fetcher,
  )

  const [isSaving, setIsSaving] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [formData, setFormData] = useState({ google_client_id: "", google_client_secret: "" })
  const [hasEdited, setHasEdited] = useState(false)

  const displayClientId = hasEdited ? formData.google_client_id : (data?.google_client_id ?? "")
  const displayClientSecret = hasEdited ? formData.google_client_secret : (data?.google_client_secret ?? "")

  const handleFieldChange = (field: string, value: string) => {
    if (!hasEdited) {
      setFormData({
        google_client_id: data?.google_client_id ?? "",
        google_client_secret: data?.google_client_secret ?? "",
      })
      setHasEdited(true)
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/studio/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId, ...formData }),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "Saved", description: "Your YouTube API credentials have been saved." })
      setHasEdited(false)
      mutate()
    } catch {
      toast({ title: "Error", description: "Failed to save credentials.", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveOverride = async () => {
    setIsRemoving(true)
    try {
      const res = await fetch("/api/studio/integrations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studioId }),
      })
      if (!res.ok) throw new Error("Failed to remove")
      toast({ title: "Removed", description: "Your custom credentials have been removed. Platform defaults will be used." })
      setHasEdited(false)
      setFormData({ google_client_id: "", google_client_secret: "" })
      mutate()
    } catch {
      toast({ title: "Error", description: "Failed to remove credentials.", variant: "destructive" })
    } finally {
      setIsRemoving(false)
    }
  }

  const settingsLoaded = settingsData !== undefined
  const disabled = settingsLoaded && !youtubeConfigEnabled

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title="Integrations"
        description="Manage your YouTube API credentials for white-label branding"
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6">
          {disabled && (
            <Alert className="border-amber-500/30 bg-amber-500/10">
              <Lock className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              The platform is configured by the administrator for everyone. The option to view and configure YouTube API in your dashboard is not enabled. If you need to configure it yourself, ask your administrator to enable it for you.
            </AlertDescription>
            </Alert>
          )}
          {!disabled && (
          <>
          {/* Status Overview */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <Youtube className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">YouTube API Credentials</CardTitle>
                  <CardDescription>
                    Optionally provide your own Google Cloud credentials for branded OAuth consent screens
                  </CardDescription>
                </div>
                {data?.has_override ? (
                  <Badge variant="outline" className="border-primary/30 text-primary">Custom</Badge>
                ) : data?.has_platform_defaults ? (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Platform Default</Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">Not Configured</Badge>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Info Alert */}
          <Alert className="border-blue-500/20 bg-blue-500/5">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-muted-foreground">
              {data?.has_platform_defaults ? (
                <>
                  Platform-level YouTube credentials are already configured by your admin. Your users can connect their YouTube channels using those.
                  To show <strong>your own brand name</strong> on the Google OAuth consent screen, enter your own Google Cloud credentials below.
                </>
              ) : (
                <>
                  No platform-level YouTube credentials are configured yet. Contact your admin or enter your own Google Cloud credentials below.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Credential Form */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Your Google Cloud Credentials</CardTitle>
              </div>
              <CardDescription>
                These override the platform defaults for your brand only
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="r-client-id">Google Client ID</Label>
                <Input
                  id="r-client-id"
                  placeholder="123456789-abc.apps.googleusercontent.com"
                  value={displayClientId}
                  onChange={(e) => handleFieldChange("google_client_id", e.target.value)}
                  className="bg-background font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-client-secret">Google Client Secret</Label>
                <div className="relative">
                  <Input
                    id="r-client-secret"
                    type={showClientSecret ? "text" : "password"}
                    placeholder="GOCSPX-xxxxxxxxxxxx"
                    value={displayClientSecret}
                    onChange={(e) => handleFieldChange("google_client_secret", e.target.value)}
                    className="bg-background pr-10 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => setShowClientSecret(!showClientSecret)}
                  >
                    {showClientSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="bg-primary text-primary-foreground"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save Credentials
                    </>
                  )}
                </Button>

                {data?.has_override && (
                  <Button
                    variant="outline"
                    onClick={handleRemoveOverride}
                    disabled={isRemoving}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    {isRemoving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Remove Override
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Setup Guide */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base">Setup Guide</CardTitle>
              <CardDescription>How to get your own Google Cloud credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ol className="list-inside list-decimal space-y-2">
                <li>Go to the <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console <ExternalLink className="mb-0.5 inline h-3 w-3" /></a></li>
                <li>Create a new project (or select an existing one)</li>
                <li>Enable the <strong>YouTube Data API v3</strong></li>
                <li>Go to <strong>APIs & Services &gt; Credentials</strong></li>
                <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application type)</li>
                <li>Set the <strong>Authorized redirect URI</strong> to your callback URL</li>
                <li>Configure the <strong>OAuth consent screen</strong> with your brand name and logo</li>
                <li>Copy the Client ID and Client Secret into the form above</li>
              </ol>

              <Alert className="mt-4 border-yellow-500/20 bg-yellow-500/5">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-muted-foreground">
                  Your OAuth consent screen brand name is what users see when connecting their YouTube channels. This is the main benefit of using your own credentials.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          </>
          )}
        </div>
      </div>
    </div>
  )
}
