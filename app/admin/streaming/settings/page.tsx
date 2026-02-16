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
import {
  ArrowLeft,
  Server,
  Shield,
  Tv,
  HardDrive,
  Plus,
  Trash2,
  TestTubeDiagonal,
  Save,
  RefreshCw,
} from "lucide-react"
import type { TranscodingProfile } from "@/lib/types"

export default function StreamingSettingsPage() {
  const router = useRouter()

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
            <p className="text-muted-foreground">Configure Nimble Streamer server connection and streaming defaults</p>
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

      {/* Server Connection */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Server className="h-5 w-5 text-primary" />
            Server Connection
          </CardTitle>
          <CardDescription>Configure the connection to your Nimble Streamer server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="server-name">Server Name</Label>
              <Input
                id="server-name"
                value={serverConfig.name}
                onChange={(e) => setServerConfig({ ...serverConfig, name: e.target.value })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-host">API Host</Label>
              <Input
                id="server-host"
                value={serverConfig.host}
                onChange={(e) => setServerConfig({ ...serverConfig, host: e.target.value })}
                className="bg-secondary border-0"
                placeholder="nimble-api.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rtmp-port">RTMP Port</Label>
              <Input
                id="rtmp-port"
                type="number"
                value={serverConfig.rtmpPort}
                onChange={(e) => setServerConfig({ ...serverConfig, rtmpPort: parseInt(e.target.value) || 1935 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="http-port">HTTP API Port</Label>
              <Input
                id="http-port"
                type="number"
                value={serverConfig.httpPort}
                onChange={(e) => setServerConfig({ ...serverConfig, httpPort: parseInt(e.target.value) || 8082 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
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
                {isTesting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <TestTubeDiagonal className="mr-2 h-4 w-4" />}
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rtmp-base">RTMP Ingest URL</Label>
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
              <Label htmlFor="playback-base">Playback Base URL</Label>
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
              <Label htmlFor="max-bitrate">Max Bitrate (kbps)</Label>
              <Input
                id="max-bitrate"
                type="number"
                value={streamDefaults.maxBitrate}
                onChange={(e) => setStreamDefaults({ ...streamDefaults, maxBitrate: parseInt(e.target.value) || 8000 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-res">Max Resolution</Label>
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
              <Label htmlFor="keyframe">Keyframe Interval (s)</Label>
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
              <Label htmlFor="hls-segment">HLS Segment Duration (s)</Label>
              <Input
                id="hls-segment"
                type="number"
                value={streamDefaults.hlsSegmentDuration}
                onChange={(e) => setStreamDefaults({ ...streamDefaults, hlsSegmentDuration: parseInt(e.target.value) || 4 })}
                className="bg-secondary border-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hls-playlist">HLS Playlist Length</Label>
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
                <Label>Default Recording</Label>
                <p className="text-xs text-muted-foreground">Automatically record all new streams</p>
              </div>
              <Switch
                checked={streamDefaults.defaultRecording}
                onCheckedChange={(v) => setStreamDefaults({ ...streamDefaults, defaultRecording: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Default Transcoding</Label>
                <p className="text-xs text-muted-foreground">Enable adaptive bitrate transcoding by default</p>
              </div>
              <Switch
                checked={streamDefaults.defaultTranscoding}
                onCheckedChange={(v) => setStreamDefaults({ ...streamDefaults, defaultTranscoding: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Low Latency Mode</Label>
                <p className="text-xs text-muted-foreground">Reduce stream latency (may affect stability)</p>
              </div>
              <Switch
                checked={streamDefaults.lowLatencyMode}
                onCheckedChange={(v) => setStreamDefaults({ ...streamDefaults, lowLatencyMode: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Adaptive Bitrate</Label>
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
            <CardDescription>Configure quality tiers for adaptive bitrate streaming</CardDescription>
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
              <Label>Require Stream Authentication</Label>
              <p className="text-xs text-muted-foreground">Publishers must authenticate before streaming</p>
            </div>
            <Switch
              checked={security.requireStreamAuth}
              onCheckedChange={(v) => setSecurity({ ...security, requireStreamAuth: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Token-Based Playback Auth</Label>
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
                <Label htmlFor="token-secret">Token Secret</Label>
                <Input
                  id="token-secret"
                  type="password"
                  value={security.tokenSecret}
                  onChange={(e) => setSecurity({ ...security, tokenSecret: e.target.value })}
                  className="bg-secondary border-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token-expiry">Token Expiry (seconds)</Label>
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
              <Label>IP Whitelist</Label>
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
              <Label>Geo Restriction</Label>
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
              <Label>Enable Recording</Label>
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
                  <Label htmlFor="rec-format">Recording Format</Label>
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
                  <Label htmlFor="rec-path">Storage Path</Label>
                  <Input
                    id="rec-path"
                    value={recording.storagePath}
                    onChange={(e) => setRecording({ ...recording, storagePath: e.target.value })}
                    className="bg-secondary border-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rec-max">Max Duration (min)</Label>
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
                  <Label>Auto-Delete Recordings</Label>
                  <p className="text-xs text-muted-foreground">Automatically delete recordings after a set period</p>
                </div>
                <Switch
                  checked={recording.autoDelete}
                  onCheckedChange={(v) => setRecording({ ...recording, autoDelete: v })}
                />
              </div>

              {recording.autoDelete && (
                <div className="space-y-2 max-w-xs">
                  <Label htmlFor="auto-delete-days">Delete After (days)</Label>
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
