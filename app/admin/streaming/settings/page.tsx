"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { HelpTip } from "@/components/ui/help-tip"
import {
  ArrowLeft,
  Server,
  Shield,
  Tv,
  HardDrive,
  Plus,
  Trash2,
  FlaskConical,
  Save,
  RefreshCw,
} from "lucide-react"
import type { TranscodingProfile, StreamingBackendType } from "@/lib/types"
import { BACKEND_INFO } from "@/lib/streaming"
import type { StreamingBackendInfo } from "@/lib/streaming"

export default function StreamingSettingsPage() {
  const router = useRouter()

  // Active streaming backend
  const [activeBackend, setActiveBackend] = useState<StreamingBackendType>("nimble")
  const backendInfo: StreamingBackendInfo = BACKEND_INFO[activeBackend]

  // Server connection
  const [serverConfig, setServerConfig] = useState({
    name: "Primary Nimble Server",
    host: "nimble-api.streammattic.com",
    rtmpPort: 1935,
    httpPort: 8082,
    apiKey: "••••••••••••••••",
    rtmpBaseUrl: "rtmp://stream.streammattic.com/live",
    playbackBaseUrl: "https://cdn.streammattic.com",
  })

  // Streaming defaults
  const [streamDefaults, setStreamDefaults] = useState({
    maxBitrate: 8000,
    maxResolution: "1080p",
    defaultRecording: true,
    defaultTranscoding: true,
    keyframeInterval: 2,
    hlsSegmentDuration: 4,
    hlsPlaylistLength: 6,
    lowLatencyMode: false,
    adaptiveBitrate: true,
  })

  // Security
  const [security, setSecurity] = useState({
    requireStreamAuth: true,
    tokenBasedAuth: true,
    tokenSecret: "••••••••••••••••••••••••",
    tokenExpiry: 3600,
    ipWhitelist: false,
    allowedIPs: "",
    geoRestriction: false,
    allowedCountries: "",
  })

  // Transcoding profiles
  const [profiles, setProfiles] = useState<TranscodingProfile[]>([
    { id: "tp-1", name: "1080p Full HD", resolution: "1920x1080", bitrate: 6000, fps: 30, codec: "h264", isDefault: false },
    { id: "tp-2", name: "720p HD", resolution: "1280x720", bitrate: 3000, fps: 30, codec: "h264", isDefault: true },
    { id: "tp-3", name: "480p SD", resolution: "854x480", bitrate: 1500, fps: 30, codec: "h264", isDefault: false },
    { id: "tp-4", name: "360p Mobile", resolution: "640x360", bitrate: 800, fps: 25, codec: "h264", isDefault: false },
  ])

  // Recording
  const [recording, setRecording] = useState({
    enabled: true,
    format: "mp4",
    storagePath: "/recordings",
    maxDuration: 480,
    autoDelete: false,
    autoDeleteDays: 30,
  })

  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing">("connected")

  const handleTestConnection = async () => {
    setIsTesting(true)
    setConnectionStatus("testing")
    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setConnectionStatus("connected")
    setIsTesting(false)
    toast({ title: "Connection successful", description: "Nimble Streamer server is reachable and responding" })
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsSaving(false)
    toast({ title: "Settings saved", description: "Streaming server configuration has been updated" })
  }

  const addProfile = () => {
    const newProfile: TranscodingProfile = {
      id: `tp-${Date.now()}`,
      name: "New Profile",
      resolution: "1280x720",
      bitrate: 2500,
      fps: 30,
      codec: "h264",
      isDefault: false,
    }
    setProfiles([...profiles, newProfile])
  }

  const removeProfile = (id: string) => {
    setProfiles(profiles.filter((p) => p.id !== id))
  }

  const updateProfile = (id: string, field: keyof TranscodingProfile, value: string | number | boolean) => {
    setProfiles(profiles.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/admin/streaming")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Server Settings</h1>
            <p className="text-muted-foreground">Configure {backendInfo.name} server connection and streaming defaults</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              connectionStatus === "connected"
                ? "bg-green-500/20 text-green-500 border-green-500/30"
                : connectionStatus === "testing"
                  ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30"
                  : "bg-red-500/20 text-red-500 border-red-500/30"
            }
          >
            {connectionStatus === "connected" ? "Connected" : connectionStatus === "testing" ? "Testing..." : "Disconnected"}
          </Badge>
          <Button variant="outline" className="border-border bg-transparent" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Streaming Backend Selector */}
      <Card className="border-primary/30 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            Streaming Backend
          </CardTitle>
          <CardDescription>
            Choose your streaming server. Free alternatives available alongside Nimble Streamer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(BACKEND_INFO) as StreamingBackendType[]).map((key) => {
              const info = BACKEND_INFO[key]
              const isActive = activeBackend === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveBackend(key)}
                  className={`relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all ${
                    isActive
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">{info.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        info.isFree
                          ? "bg-green-500/10 text-green-500 border-green-500/30 text-xs"
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 text-xs"
                      }
                    >
                      {info.isFree ? "Free" : "$50/mo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{info.description}</p>
                  {isActive && (
                    <div className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Active backend info */}
          <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm text-foreground">{backendInfo.name}</h4>
              <a
                href={backendInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Documentation
              </a>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{backendInfo.cost}</p>
            <div className="flex flex-wrap gap-1.5">
              {backendInfo.features.map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs bg-transparent border-border text-muted-foreground">
                  {feature}
                </Badge>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
              <div>Default Ports: RTMP {backendInfo.defaultPorts.rtmp}, HTTP {backendInfo.defaultPorts.http}, API {backendInfo.defaultPorts.api}</div>
              <div>Env vars: {backendInfo.envVars.apiUrl}, {backendInfo.envVars.rtmpUrl}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Connection */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            Server Connection
          </CardTitle>
          <CardDescription>Configure the connection to your {backendInfo.name} server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name <HelpTip text="A friendly name to identify this server. You can set any name you prefer." /></Label>
              <Input
                id="server-name"
                value={serverConfig.name}
                onChange={(e) => setServerConfig({ ...serverConfig, name: e.target.value })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-host">API Host <HelpTip text="The hostname or IP of your Nimble Streamer server. Find this in your server provider's dashboard (e.g., AWS EC2 Public IPv4, DigitalOcean Droplet IP, or your custom domain pointing to the server)." link="https://wmspanel.com/nimble/install" linkLabel="Installation Guide" /></Label>
              <Input
                id="server-host"
                value={serverConfig.host}
                onChange={(e) => setServerConfig({ ...serverConfig, host: e.target.value })}
                className="bg-secondary border-0"
                placeholder="nimble-api.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rtmp-port">RTMP Port <HelpTip text="Default RTMP port is 1935. Find or change this in Nimble Streamer Admin Panel > Global Settings > RTMP Interfaces. Only change if your server uses a non-standard port." /></Label>
              <Input
                id="rtmp-port"
                type="number"
                value={serverConfig.rtmpPort}
                onChange={(e) => setServerConfig({ ...serverConfig, rtmpPort: parseInt(e.target.value) || 1935 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="http-port">HTTP API Port <HelpTip text="The management API port for Nimble Streamer. Default is 8082. Find this in /etc/nimble/nimble.conf under 'management_listen_interfaces'. Ensure this port is open in your firewall." /></Label>
              <Input
                id="http-port"
                type="number"
                value={serverConfig.httpPort}
                onChange={(e) => setServerConfig({ ...serverConfig, httpPort: parseInt(e.target.value) || 8082 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key <HelpTip text="Your Nimble Streamer management API key. Generate this in Nimble Admin Panel > Global Settings > Management API > API Key. If using WMSPanel, find it at wmspanel.com > Account > API Keys." link="https://wmspanel.com/api" linkLabel="WMSPanel API Docs" /></Label>
              <Input
                id="api-key"
                type="password"
                value={serverConfig.apiKey}
                onChange={(e) => setServerConfig({ ...serverConfig, apiKey: e.target.value })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full border-border bg-transparent" onClick={handleTestConnection} disabled={isTesting}>
                {isTesting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rtmp-base">RTMP Ingest URL <HelpTip text="The base URL encoders use to push RTMP streams. Format: rtmp://{your-server-ip-or-domain}/live. The '/live' is the Nimble application name. Create applications in Nimble Admin > Live Streams > RTMP Applications." link="https://wmspanel.com/nimble/live" linkLabel="RTMP Setup Guide" /></Label>
              <Input
                id="rtmp-base"
                value={serverConfig.rtmpBaseUrl}
                onChange={(e) => setServerConfig({ ...serverConfig, rtmpBaseUrl: e.target.value })}
                className="bg-secondary border-0"
                placeholder="rtmp://stream.example.com/live"
              />
              <p className="text-xs text-muted-foreground">Base URL used for RTMP stream ingest</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="playback-base">Playback Base URL <HelpTip text="The base URL viewers use to watch streams via HLS/DASH. If using Nimble directly, this is your server's HTTP output address. If using a CDN (CloudFront, Cloudflare), use the CDN distribution URL." link="https://wmspanel.com/nimble/cdn" linkLabel="CDN Setup Guide" /></Label>
              <Input
                id="playback-base"
                value={serverConfig.playbackBaseUrl}
                onChange={(e) => setServerConfig({ ...serverConfig, playbackBaseUrl: e.target.value })}
                className="bg-secondary border-0"
                placeholder="https://cdn.example.com"
              />
              <p className="text-xs text-muted-foreground">Base URL for HLS/DASH playback delivery</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Streaming Defaults */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tv className="h-5 w-5 text-primary" />
            Streaming Defaults
          </CardTitle>
          <CardDescription>Default settings applied to new streams</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="max-bitrate">Max Bitrate (kbps) <HelpTip text="Maximum allowed bitrate for incoming streams. Recommended: 720p = 2500-4000 kbps, 1080p = 4500-8000 kbps, 4K = 15000-25000 kbps. Set based on your server's upload capacity." /></Label>
              <Input
                id="max-bitrate"
                type="number"
                value={streamDefaults.maxBitrate}
                onChange={(e) => setStreamDefaults({ ...streamDefaults, maxBitrate: parseInt(e.target.value) || 8000 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-res">Max Resolution <HelpTip text="Maximum resolution accepted from incoming streams. Streams exceeding this will be rejected. Match this to your highest transcoding profile tier." /></Label>
              <Select
                value={streamDefaults.maxResolution}
                onValueChange={(v) => setStreamDefaults({ ...streamDefaults, maxResolution: v })}
              >
                <SelectTrigger className="bg-secondary border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4k">4K (3840x2160)</SelectItem>
                  <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                  <SelectItem value="720p">720p (1280x720)</SelectItem>
                  <SelectItem value="480p">480p (854x480)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyframe">Keyframe Interval (s) <HelpTip text="How often keyframes are inserted (in seconds). Recommended: 2s. Must match the encoder's setting (OBS > Output > Keyframe Interval). YouTube/Facebook require 2s." /></Label>
              <Input
                id="keyframe"
                type="number"
                value={streamDefaults.keyframeInterval}
                onChange={(e) => setStreamDefaults({ ...streamDefaults, keyframeInterval: parseInt(e.target.value) || 2 })}
                className="bg-secondary border-0"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hls-segment">HLS Segment Duration (s) <HelpTip text="Duration of each HLS segment. Default: 4s. Lower values (2s) reduce latency but increase server load. For low-latency, use 2s with Low Latency Mode enabled. Find in Nimble Admin > Live Streams > HLS Settings." /></Label>
              <Input
                id="hls-segment"
                type="number"
                value={streamDefaults.hlsSegmentDuration}
                onChange={(e) => setStreamDefaults({ ...streamDefaults, hlsSegmentDuration: parseInt(e.target.value) || 4 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hls-playlist">HLS Playlist Length <HelpTip text="Number of segments in the HLS playlist. Default: 6. More segments = longer buffer (more stability) but higher latency. Latency ~ Segment Duration x Playlist Length (e.g., 4s x 6 = ~24s)." /></Label>
              <Input
                id="hls-playlist"
                type="number"
                value={streamDefaults.hlsPlaylistLength}
                onChange={(e) => setStreamDefaults({ ...streamDefaults, hlsPlaylistLength: parseInt(e.target.value) || 6 })}
                className="bg-secondary border-0"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Default Recording <HelpTip text="When ON, all new streams are automatically recorded to disk. Recordings are saved to the Storage Path defined in Recording Settings below." /></Label>
                <p className="text-xs text-muted-foreground">Automatically record all new streams</p>
              </div>
              <Switch
                checked={streamDefaults.defaultRecording}
                onCheckedChange={(v) => setStreamDefaults({ ...streamDefaults, defaultRecording: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Default Transcoding <HelpTip text="When ON, all new streams are automatically transcoded using the profiles below. Requires FFmpeg installed on the server. Check via SSH: 'ffmpeg -version'." link="https://wmspanel.com/nimble/transcoding" linkLabel="Transcoding Guide" /></Label>
                <p className="text-xs text-muted-foreground">Enable adaptive bitrate transcoding by default</p>
              </div>
              <Switch
                checked={streamDefaults.defaultTranscoding}
                onCheckedChange={(v) => setStreamDefaults({ ...streamDefaults, defaultTranscoding: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Latency Mode <HelpTip text="Reduces stream latency to ~3-5s (vs default ~15-30s). May cause buffering on slow connections. Best with HLS Segment Duration = 2s and Playlist Length = 3. Not recommended for 500+ viewers." /></Label>
                <p className="text-xs text-muted-foreground">Reduce stream latency (may affect stability)</p>
              </div>
              <Switch
                checked={streamDefaults.lowLatencyMode}
                onCheckedChange={(v) => setStreamDefaults({ ...streamDefaults, lowLatencyMode: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Adaptive Bitrate <HelpTip text="Enables ABR (Adaptive Bitrate Streaming). Viewers automatically switch between quality levels based on their connection speed. Requires Transcoding Profiles to be configured below. Recommended: Keep ON for public streams." /></Label>
                <p className="text-xs text-muted-foreground">Enable ABR for viewers with varying connection speeds</p>
              </div>
              <Switch
                checked={streamDefaults.adaptiveBitrate}
                onCheckedChange={(v) => setStreamDefaults({ ...streamDefaults, adaptiveBitrate: v })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcoding Profiles */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tv className="h-5 w-5 text-primary" />
              Transcoding Profiles
            </CardTitle>
            <CardDescription>Configure quality tiers for adaptive bitrate streaming <HelpTip text="Each profile re-encodes the stream at a different resolution/bitrate. Requires FFmpeg on the server and increases CPU usage per profile. Recommended minimum: 3 profiles (1080p, 720p, 360p)." link="https://wmspanel.com/nimble/transcoding" linkLabel="FFmpeg + Transcoding Guide" /></CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-border bg-transparent" onClick={addProfile}>
            <Plus className="mr-2 h-4 w-4" />
            Add Profile
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                <div className="flex-1 grid gap-3 md:grid-cols-5">
                  <Input
                    value={profile.name}
                    onChange={(e) => updateProfile(profile.id, "name", e.target.value)}
                    className="bg-secondary border-0 text-sm"
                    placeholder="Profile name"
                  />
                  <Input
                    value={profile.resolution}
                    onChange={(e) => updateProfile(profile.id, "resolution", e.target.value)}
                    className="bg-secondary border-0 text-sm"
                    placeholder="1920x1080"
                  />
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={profile.bitrate}
                      onChange={(e) => updateProfile(profile.id, "bitrate", parseInt(e.target.value) || 0)}
                      className="bg-secondary border-0 text-sm"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">kbps</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={profile.fps}
                      onChange={(e) => updateProfile(profile.id, "fps", parseInt(e.target.value) || 0)}
                      className="bg-secondary border-0 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">fps</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.isDefault && (
                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 text-xs">
                        Default
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeProfile(profile.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Stream Security
          </CardTitle>
          <CardDescription>Configure authentication and access control for streams</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require Stream Authentication <HelpTip text="When ON, publishers must provide valid credentials to push a stream. Prevents unauthorized streaming to your server. Configure in Nimble Admin > Live Streams > RTMP Authentication. Recommended: Always ON in production." /></Label>
              <p className="text-xs text-muted-foreground">Publishers must authenticate before streaming</p>
            </div>
            <Switch
              checked={security.requireStreamAuth}
              onCheckedChange={(v) => setSecurity({ ...security, requireStreamAuth: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Token-Based Playback Auth <HelpTip text="When ON, playback URLs require a signed token to prevent hotlinking. Nimble validates the token using the secret below. Configure in Nimble Admin > Security > Hotlink Protection." link="https://wmspanel.com/nimble/security" linkLabel="Hotlink Protection Docs" /></Label>
              <p className="text-xs text-muted-foreground">Require tokens for playback URLs (prevents hotlinking)</p>
            </div>
            <Switch
              checked={security.tokenBasedAuth}
              onCheckedChange={(v) => setSecurity({ ...security, tokenBasedAuth: v })}
            />
          </div>

          {security.tokenBasedAuth && (
            <div className="grid gap-4 md:grid-cols-2 pl-0 mt-2">
              <div className="space-y-2">
                <Label htmlFor="token-secret">Token Secret <HelpTip text="A secret key used to sign playback tokens. Generate a strong random string (32+ chars). Must match the value in Nimble Admin > Security > Hotlink Protection > Secret Key. Generate via: openssl rand -hex 32" /></Label>
                <Input
                  id="token-secret"
                  type="password"
                  value={security.tokenSecret}
                  onChange={(e) => setSecurity({ ...security, tokenSecret: e.target.value })}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-expiry">Token Expiry (seconds) <HelpTip text="How long a playback token remains valid. Default: 3600 (1 hour). Lower = more secure but tokens expire faster. Recommended: 3600 for live streams, 86400 for VOD." /></Label>
                <Input
                  id="token-expiry"
                  type="number"
                  value={security.tokenExpiry}
                  onChange={(e) => setSecurity({ ...security, tokenExpiry: parseInt(e.target.value) || 3600 })}
                  className="bg-secondary border-0"
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>IP Whitelist <HelpTip text="When ON, only specific IP addresses can publish streams. Add your encoder/studio IPs. Find your IP at whatismyip.com. Configure in Nimble Admin > Security > IP Access Control." /></Label>
              <p className="text-xs text-muted-foreground">Only allow publishing from specific IP addresses</p>
            </div>
            <Switch
              checked={security.ipWhitelist}
              onCheckedChange={(v) => setSecurity({ ...security, ipWhitelist: v })}
            />
          </div>

          {security.ipWhitelist && (
            <div className="space-y-2">
              <Label htmlFor="allowed-ips">Allowed IPs (comma separated)</Label>
              <Input
                id="allowed-ips"
                value={security.allowedIPs}
                onChange={(e) => setSecurity({ ...security, allowedIPs: e.target.value })}
                className="bg-secondary border-0"
                placeholder="192.168.1.1, 10.0.0.1"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Geo Restriction <HelpTip text="When ON, restrict playback to specific countries. Uses GeoIP lookup on viewer IPs. Requires MaxMind GeoLite2 database. Configure in Nimble Admin > Security > Geo Restrictions." link="https://dev.maxmind.com/geoip/geolite2-free-geolocation-data" linkLabel="MaxMind GeoIP Setup" /></Label>
              <p className="text-xs text-muted-foreground">Restrict playback to specific countries</p>
            </div>
            <Switch
              checked={security.geoRestriction}
              onCheckedChange={(v) => setSecurity({ ...security, geoRestriction: v })}
            />
          </div>

          {security.geoRestriction && (
            <div className="space-y-2">
              <Label htmlFor="allowed-countries">Allowed Countries (ISO codes, comma separated)</Label>
              <Input
                id="allowed-countries"
                value={security.allowedCountries}
                onChange={(e) => setSecurity({ ...security, allowedCountries: e.target.value })}
                className="bg-secondary border-0"
                placeholder="IN, US, GB, CA"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recording Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HardDrive className="h-5 w-5 text-primary" />
            Recording Settings
          </CardTitle>
          <CardDescription>Configure stream recording and storage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Recording <HelpTip text="Master switch for stream recording. When ON, streams can be recorded to disk. Ensure sufficient disk space: 1 hour of 1080p recording ~ 3-5 GB. Check space via SSH: 'df -h'." /></Label>
              <p className="text-xs text-muted-foreground">Allow streams to be recorded on the server</p>
            </div>
            <Switch
              checked={recording.enabled}
              onCheckedChange={(v) => setRecording({ ...recording, enabled: v })}
            />
          </div>

          {recording.enabled && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rec-format">Recording Format <HelpTip text="MP4: Best compatibility, playable everywhere. FLV: Legacy format, faster to write. MPEG-TS: Good for long recordings (crash-resilient). Recommended: MP4 for most use cases." /></Label>
                  <Select value={recording.format} onValueChange={(v) => setRecording({ ...recording, format: v })}>
                    <SelectTrigger className="bg-secondary border-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="flv">FLV</SelectItem>
                      <SelectItem value="ts">MPEG-TS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-path">Storage Path <HelpTip text="Server directory where recordings are saved. This is a path ON THE NIMBLE SERVER, not your local machine. Ensure it exists and Nimble has write permission: 'mkdir -p /recordings && chown nimble:nimble /recordings'." /></Label>
                  <Input
                    id="rec-path"
                    value={recording.storagePath}
                    onChange={(e) => setRecording({ ...recording, storagePath: e.target.value })}
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-max">Max Duration (min) <HelpTip text="Maximum recording duration per stream in minutes. Default: 480 (8 hours). Set to 0 for unlimited. Plan storage: 1 hour @ 1080p/6Mbps ~ 2.7 GB." /></Label>
                  <Input
                    id="rec-max"
                    type="number"
                    value={recording.maxDuration}
                    onChange={(e) => setRecording({ ...recording, maxDuration: parseInt(e.target.value) || 480 })}
                    className="bg-secondary border-0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Delete Recordings <HelpTip text="When ON, old recordings are automatically deleted after the specified number of days. Helps manage disk space. Deleted recordings cannot be recovered." /></Label>
                  <p className="text-xs text-muted-foreground">Automatically delete recordings after a set period</p>
                </div>
                <Switch
                  checked={recording.autoDelete}
                  onCheckedChange={(v) => setRecording({ ...recording, autoDelete: v })}
                />
              </div>

              {recording.autoDelete && (
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="auto-delete-days">Delete After (days) <HelpTip text="Number of days to keep recordings before auto-deletion. Default: 90 days. Set based on your storage capacity and retention requirements." /></Label>
                  <Input
                    id="auto-delete-days"
                    type="number"
                    value={recording.autoDeleteDays}
                    onChange={(e) => setRecording({ ...recording, autoDeleteDays: parseInt(e.target.value) || 30 })}
                    className="bg-secondary border-0"
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex justify-end gap-3 pb-6">
        <Button variant="outline" className="border-border bg-transparent" onClick={() => router.push("/admin/streaming")}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  )
}
