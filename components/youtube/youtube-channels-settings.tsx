"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Youtube,
  Plus,
  Info,
  Loader2,
  Lock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react"
import { YouTubeChannelCard } from "@/components/youtube/youtube-channel-card"
import { ConnectYouTubeDialog } from "@/components/youtube/connect-youtube-dialog"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-context"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const integrationFetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json())

type OwnerIntegrationData = {
  google_client_id?: string
  google_client_secret?: string
  has_override?: boolean
  has_platform_defaults?: boolean
}

export function YouTubeChannelsSettings({ returnUrl }: { returnUrl: string }) {
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [credSaving, setCredSaving] = useState(false)
  const [credRemoving, setCredRemoving] = useState(false)
  const [showCredSecret, setShowCredSecret] = useState(false)
  const [credForm, setCredForm] = useState({ google_client_id: "", google_client_secret: "" })
  const [credEdited, setCredEdited] = useState(false)
  const [oauthCallbackUrl, setOauthCallbackUrl] = useState("")
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (typeof window === "undefined") return
    setOauthCallbackUrl(
      `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/youtube/callback`,
    )
  }, [])

  const OWNER_ID = user?.id || ""
  const OWNER_TYPE = (user?.role || "streamer") as "streamer" | "studio" | "admin"
  const showOwnerCredentialsUi = OWNER_TYPE === "streamer" || OWNER_TYPE === "studio"

  const { data: settingsData, error: settingsError, isLoading: settingsLoading } = useSWR<
    { settings?: { key: string; value: unknown }[] }
  >("/api/settings", fetcher)
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

  const { data, isLoading, mutate } = useSWR(
    OWNER_ID && youtubeConfigEnabled ? `/api/youtube/channels?ownerId=${OWNER_ID}&ownerType=${OWNER_TYPE}` : null,
    fetcher
  )

  const integrationsKey =
    youtubeConfigEnabled && OWNER_ID && showOwnerCredentialsUi
      ? OWNER_TYPE === "streamer"
        ? "/api/streamer/integrations"
        : `/api/studio/integrations?studioId=${encodeURIComponent(OWNER_ID)}`
      : null

  const { data: integrationData, mutate: mutateIntegrations, isLoading: integrationLoading } = useSWR<OwnerIntegrationData>(
    integrationsKey,
    integrationFetcher,
  )

  const channels = data?.channels ?? []

  const displayCredClientId = credEdited ? credForm.google_client_id : (integrationData?.google_client_id ?? "")
  const displayCredSecret = credEdited ? credForm.google_client_secret : (integrationData?.google_client_secret ?? "")

  const handleCredFieldChange = (field: "google_client_id" | "google_client_secret", value: string) => {
    if (!credEdited) {
      setCredForm({
        google_client_id: integrationData?.google_client_id ?? "",
        google_client_secret: integrationData?.google_client_secret ?? "",
      })
      setCredEdited(true)
    }
    setCredForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveCredentials = async () => {
    setCredSaving(true)
    try {
      if (OWNER_TYPE === "streamer") {
        const res = await fetch("/api/streamer/integrations", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            google_client_id: credForm.google_client_id,
            google_client_secret: credForm.google_client_secret,
          }),
        })
        if (!res.ok) throw new Error("save failed")
      } else {
        const res = await fetch("/api/studio/integrations", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studioId: OWNER_ID,
            google_client_id: credForm.google_client_id,
            google_client_secret: credForm.google_client_secret,
          }),
        })
        if (!res.ok) throw new Error("save failed")
      }
      toast({ title: "Saved", description: "Your Google OAuth credentials have been saved." })
      setCredEdited(false)
      await mutateIntegrations()
    } catch {
      toast({ title: "Error", description: "Failed to save credentials.", variant: "destructive" })
    } finally {
      setCredSaving(false)
    }
  }

  const handleRemoveCredentialOverride = async () => {
    setCredRemoving(true)
    try {
      if (OWNER_TYPE === "streamer") {
        const res = await fetch("/api/streamer/integrations", {
          method: "DELETE",
          credentials: "include",
        })
        if (!res.ok) throw new Error("remove failed")
      } else {
        const res = await fetch("/api/studio/integrations", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studioId: OWNER_ID }),
        })
        if (!res.ok) throw new Error("remove failed")
      }
      toast({
        title: "Removed",
        description: "Your custom credentials were removed. Platform defaults apply when available.",
      })
      setCredEdited(false)
      setCredForm({ google_client_id: "", google_client_secret: "" })
      await mutateIntegrations()
    } catch {
      toast({ title: "Error", description: "Failed to remove credentials.", variant: "destructive" })
    } finally {
      setCredRemoving(false)
    }
  }

  const handleRefreshToken = async (channelDbId: string) => {
    toast({
      title: "Refreshing token...",
      description: "Please wait while we refresh your YouTube access.",
    })

    try {
      const res = await fetch("/api/youtube/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token-refresh", channelDbId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to refresh token")
      }

      await mutate()

      toast({
        title: "Token refreshed",
        description: "Your YouTube channel access has been renewed.",
      })
    } catch (err) {
      toast({
        title: "Refresh failed",
        description: (err as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleDisconnect = async (channelDbId: string) => {
    const channel = channels.find((c: Record<string, string>) => c.id === channelDbId)

    try {
      const res = await fetch("/api/youtube/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect", channelDbId }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Failed to disconnect")
      }

      await mutate()

      toast({
        title: "Channel disconnected",
        description: `${channel?.channelTitle || "Channel"} has been removed from your account.`,
      })
    } catch (err) {
      toast({
        title: "Disconnect failed",
        description: (err as Error).message,
        variant: "destructive",
      })
    }
  }

  const handleConnectSuccess = () => {
    mutate()
    toast({
      title: "Channel connected",
      description: "Your YouTube channel has been linked to your account.",
    })
  }

  const settingsReady = !settingsLoading && settingsData !== undefined
  const settingsFetchFailed = !settingsLoading && !!settingsError && settingsData === undefined
  const disabledByAdmin = settingsReady && !youtubeConfigEnabled
  const showManagementUi = settingsReady && youtubeConfigEnabled

  return (
    <div className="min-h-screen">
      <Header title="YouTube Channels" subtitle="Manage your connected YouTube channels for live streaming" />

      <div className="space-y-6 max-w-3xl">
        {settingsLoading && (
          <div className="flex min-h-[12rem] items-center justify-center rounded-lg border border-border bg-muted/20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading settings" />
          </div>
        )}
        {settingsFetchFailed && (
          <Alert variant="destructive">
            <AlertDescription>
              Could not load platform settings. Check your connection and refresh the page.
            </AlertDescription>
          </Alert>
        )}
        {disabledByAdmin && (
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <Lock className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              The platform is configured by the administrator for everyone. The option to view and configure YouTube API in your dashboard is not enabled. If you need to configure it yourself, ask your administrator to enable it for you.
            </AlertDescription>
          </Alert>
        )}
        {showManagementUi && (
          <>
            {showOwnerCredentialsUi && (
              <>
                <Card className="border-border bg-card">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                          <Key className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Your Google OAuth credentials</CardTitle>
                          <CardDescription>
                            Required if the platform has not set global credentials. See the setup guide below for the
                            exact <strong>Authorized redirect URI</strong> to register in Google Cloud.
                          </CardDescription>
                        </div>
                      </div>
                      {integrationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : integrationData?.has_override ? (
                        <Badge variant="outline" className="border-primary/30 text-primary w-fit">
                          Custom
                        </Badge>
                      ) : integrationData?.has_platform_defaults ? (
                        <Badge variant="outline" className="w-fit border-emerald-500/30 text-emerald-400">
                          Using platform defaults
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit border-amber-500/30 text-amber-400">
                          Not configured
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="border-blue-500/20 bg-blue-500/5">
                      <Info className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-muted-foreground text-sm">
                        {integrationData?.has_platform_defaults ? (
                          <p className="m-0 leading-relaxed">
                            Admin credentials are available for OAuth. Add your own Client ID and Secret below only if you
                            want your brand on Google&apos;s consent screen, or if the platform has no credentials yet.
                          </p>
                        ) : (
                          <p className="m-0 leading-relaxed">
                            Enter a{" "}
                            <strong className="font-semibold text-foreground">Web application</strong> OAuth client from
                            Google Cloud Console with the redirect URI from the setup guide below. Without these, you
                            cannot connect a channel until an admin configures platform credentials.
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="yt-oauth-client-id">Google Client ID</Label>
                      <Input
                        id="yt-oauth-client-id"
                        placeholder="123456789-abc.apps.googleusercontent.com"
                        value={displayCredClientId}
                        onChange={(e) => handleCredFieldChange("google_client_id", e.target.value)}
                        className="bg-secondary font-mono text-sm"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yt-oauth-client-secret">Google Client Secret</Label>
                      <div className="relative">
                        <Input
                          id="yt-oauth-client-secret"
                          type={showCredSecret ? "text" : "password"}
                          placeholder="GOCSPX-xxxxxxxxxxxx"
                          value={displayCredSecret}
                          onChange={(e) => handleCredFieldChange("google_client_secret", e.target.value)}
                          className="bg-secondary pr-10 font-mono text-sm"
                          autoComplete="off"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowCredSecret(!showCredSecret)}
                          aria-label={showCredSecret ? "Hide secret" : "Show secret"}
                        >
                          {showCredSecret ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        onClick={() => void handleSaveCredentials()}
                        disabled={credSaving || integrationLoading || !credEdited}
                      >
                        {credSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Save credentials
                          </>
                        )}
                      </Button>
                      {integrationData?.has_override && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void handleRemoveCredentialOverride()}
                          disabled={credRemoving}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          {credRemoving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Remove my credentials
                        </Button>
                      )}
                    </div>

                  </CardContent>
                </Card>

                <Card className="border-border bg-card">
                  <CardHeader>
                    <CardTitle className="text-base">Setup guide: Google Cloud OAuth</CardTitle>
                    <CardDescription>Create a Web application OAuth client and paste the Client ID and Secret above</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="rounded-lg border border-border bg-muted/40 p-3">
                      <p className="mb-1.5 text-xs font-medium text-foreground">Authorized redirect URI (must match exactly)</p>
                      <code className="block break-all font-mono text-xs text-foreground">
                        {oauthCallbackUrl || "Loading…"}
                      </code>
                      {typeof window !== "undefined" && !process.env.NEXT_PUBLIC_APP_URL && (
                        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                          In production, set <code className="rounded bg-muted px-1">NEXT_PUBLIC_APP_URL</code> to your
                          live site URL so this matches Google Cloud (e.g. https://streamlivee.com).
                        </p>
                      )}
                    </div>
                    <ol className="list-inside list-decimal space-y-2.5">
                      <li>
                        Open{" "}
                        <a
                          href="https://console.cloud.google.com/apis/credentials"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2 inline-flex items-center gap-0.5"
                        >
                          Google Cloud Console — Credentials
                          <ExternalLink className="inline h-3 w-3" />
                        </a>
                        .
                      </li>
                      <li>Select or create a project.</li>
                      <li>
                        Enable{" "}
                        <strong className="text-foreground">YouTube Data API v3</strong> (APIs &amp; Services → Library).
                      </li>
                      <li>
                        Go to <strong className="text-foreground">APIs &amp; Services → Credentials</strong> → Create
                        credentials → <strong className="text-foreground">OAuth client ID</strong> → Application type:{" "}
                        <strong className="text-foreground">Web application</strong>.
                      </li>
                      <li>
                        Under <strong className="text-foreground">Authorized redirect URIs</strong>, add the URI shown in
                        the box above (one line, no trailing slash).
                      </li>
                      <li>
                        Complete the <strong className="text-foreground">OAuth consent screen</strong> (User type,
                        app name, scopes). For personal use you can use &quot;External&quot; and add test users if in
                        testing.
                      </li>
                      <li>Copy the <strong className="text-foreground">Client ID</strong> and <strong className="text-foreground">Client secret</strong> into the form above, then click Save credentials.</li>
                      <li>Return here and use <strong className="text-foreground">Connect Your First Channel</strong> to sign in with Google.</li>
                    </ol>
                    <Alert className="border-yellow-500/20 bg-yellow-500/5">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <AlertDescription className="text-xs">
                        <p className="m-0 leading-relaxed">
                          The redirect URI in Google Cloud must match this deployment exactly. If OAuth fails with{" "}
                          <code className="rounded bg-muted px-1 py-0.5 text-[0.7rem]">redirect_uri_mismatch</code>,
                          compare the URI in the error to the one in the box above.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </>
            )}

            <Alert className="bg-muted/50 border-border">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="m-0 leading-relaxed">
                  Connect your YouTube channels to create live broadcasts directly from StreamLivee. You can connect
                  multiple channels and choose which one to use for each event.
                </p>
              </AlertDescription>
            </Alert>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600/20">
                    <Youtube className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle>Connected Channels</CardTitle>
                    <CardDescription>
                      {channels.length} channel{channels.length !== 1 ? "s" : ""} connected
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : channels.length === 0 ? (
                  <div className="text-center py-8">
                    <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-foreground mb-1">No channels connected</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect a YouTube channel to start creating live broadcasts
                    </p>
                    <Button onClick={() => setShowConnectDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Your First Channel
                    </Button>
                  </div>
                ) : (
                  <>
                    {channels.map((channel: Record<string, string>) => (
                      <YouTubeChannelCard
                        key={channel.id}
                        channel={channel}
                        onRefresh={handleRefreshToken}
                        onDisconnect={handleDisconnect}
                      />
                    ))}
                    <div className="pt-2">
                      <Button variant="outline" onClick={() => setShowConnectDialog(true)} className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Connect another channel
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                      1
                    </span>
                    <span>Use the connect button above and sign in with your Google account</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                      2
                    </span>
                    <span>Grant StreamLivee permission to manage your live streams</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                      3
                    </span>
                    <span>{"When creating an event, select \"YouTube API\" and choose your channel"}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-medium">
                      4
                    </span>
                    <span>StreamLivee will automatically create the broadcast and provide RTMP credentials</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {youtubeConfigEnabled && (
        <ConnectYouTubeDialog
          open={showConnectDialog}
          onOpenChange={setShowConnectDialog}
          ownerId={OWNER_ID}
          ownerType={OWNER_TYPE}
          returnUrl={returnUrl}
          onSuccess={handleConnectSuccess}
        />
      )}
    </div>
  )
}
