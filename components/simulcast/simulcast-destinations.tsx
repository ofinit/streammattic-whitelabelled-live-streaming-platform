"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Youtube,
  Facebook,
  Plus,
  Trash2,
  ChevronDown,
  Twitch,
  Twitter,
  Linkedin,
  Globe,
  Eye,
  EyeOff,
} from "lucide-react"
import type { YouTubeChannel, FacebookPage, CustomRtmpDestination, SimulcastConfig } from "@/lib/types"
import { ConnectYouTubeDialog } from "@/components/youtube/connect-youtube-dialog"
import { ConnectFacebookDialog } from "./connect-facebook-dialog"

interface SimulcastDestinationsProps {
  youtubeChannels: YouTubeChannel[]
  facebookPages: FacebookPage[]
  config: SimulcastConfig
  onConfigChange: (config: SimulcastConfig) => void
  onYouTubeChannelConnected: (channel: YouTubeChannel) => void
  onFacebookPageConnected: (page: FacebookPage) => void
}

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "twitch":
      return Twitch
    case "twitter":
      return Twitter
    case "linkedin":
      return Linkedin
    default:
      return Globe
  }
}

export function SimulcastDestinations({
  youtubeChannels,
  facebookPages,
  config,
  onConfigChange,
  onYouTubeChannelConnected,
  onFacebookPageConnected,
}: SimulcastDestinationsProps) {
  const [showConnectYouTube, setShowConnectYouTube] = useState(false)
  const [showConnectFacebook, setShowConnectFacebook] = useState(false)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customRtmp, setCustomRtmp] = useState<Partial<CustomRtmpDestination>>({
    platform: "other",
  })
  const [showStreamKeys, setShowStreamKeys] = useState<Record<string, boolean>>({})

  const selectedYouTubeChannel = youtubeChannels?.find((c) => c.id === config?.youtubeChannelId)
  const selectedFacebookPage = facebookPages?.find((p) => p.id === config?.facebookPageId)

  const handleAddCustomDestination = () => {
    if (!customRtmp.name || !customRtmp.rtmpUrl || !customRtmp.streamKey) return

    const newDestination: CustomRtmpDestination = {
      id: `custom-${Date.now()}`,
      name: customRtmp.name,
      rtmpUrl: customRtmp.rtmpUrl,
      streamKey: customRtmp.streamKey,
      platform: customRtmp.platform || "other",
    }

    onConfigChange({
      ...config,
      customDestinations: [...(config?.customDestinations || []), newDestination],
    })

    setCustomRtmp({ platform: "other" })
    setShowAddCustom(false)
  }

  const handleRemoveCustomDestination = (id: string) => {
    onConfigChange({
      ...config,
      customDestinations: (config?.customDestinations || []).filter((d) => d.id !== id),
    })
  }

  const toggleStreamKeyVisibility = (id: string) => {
    setShowStreamKeys((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (!config) {
    return null
  }

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Simulcast Destinations</h4>
          <p className="text-xs text-muted-foreground">Stream to multiple platforms simultaneously (optional)</p>
        </div>
        <Switch checked={config.enabled} onCheckedChange={(enabled) => onConfigChange({ ...config, enabled })} />
      </div>

      {config.enabled && (
        <div className="space-y-4 pt-2">
          {/* YouTube Destination */}
          <Collapsible>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-red-600/10 flex items-center justify-center">
                  <Youtube className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">YouTube Live</p>
                  {selectedYouTubeChannel ? (
                    <p className="text-xs text-muted-foreground">{selectedYouTubeChannel.channelTitle}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>

              {selectedYouTubeChannel ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-primary border-primary">
                    Connected
                  </Badge>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowConnectYouTube(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              )}
            </div>

            <CollapsibleContent className="pt-2">
              {youtubeChannels && youtubeChannels.length > 0 && (
                <div className="space-y-3 p-3 rounded-lg border bg-background">
                  <div className="space-y-2">
                    <Label className="text-xs">Select Channel</Label>
                    <Select
                      value={config.youtubeChannelId || ""}
                      onValueChange={(value) =>
                        onConfigChange({
                          ...config,
                          youtubeChannelId: value || undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {youtubeChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={channel.channelThumbnail || "/placeholder.svg"} />
                                <AvatarFallback>{channel.channelTitle.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {channel.channelTitle}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {config.youtubeChannelId && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Privacy</Label>
                        <Select
                          value={config.youtubeSettings?.privacyStatus || "public"}
                          onValueChange={(value: "public" | "unlisted" | "private") =>
                            onConfigChange({
                              ...config,
                              youtubeSettings: {
                                ...config.youtubeSettings,
                                privacyStatus: value,
                                enableDvr: config.youtubeSettings?.enableDvr ?? true,
                                enableAutoStart: config.youtubeSettings?.enableAutoStart ?? true,
                                enableAutoStop: config.youtubeSettings?.enableAutoStop ?? true,
                              },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="unlisted">Unlisted</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Enable DVR</Label>
                        <Switch
                          checked={config.youtubeSettings?.enableDvr ?? true}
                          onCheckedChange={(checked) =>
                            onConfigChange({
                              ...config,
                              youtubeSettings: {
                                ...config.youtubeSettings,
                                privacyStatus: config.youtubeSettings?.privacyStatus || "public",
                                enableDvr: checked,
                                enableAutoStart: config.youtubeSettings?.enableAutoStart ?? true,
                                enableAutoStop: config.youtubeSettings?.enableAutoStop ?? true,
                              },
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Facebook Destination */}
          <Collapsible>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center">
                  <Facebook className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Facebook Live</p>
                  {selectedFacebookPage ? (
                    <p className="text-xs text-muted-foreground">{selectedFacebookPage.pageName}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>

              {selectedFacebookPage ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-primary border-primary">
                    Connected
                  </Badge>
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowConnectFacebook(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              )}
            </div>

            <CollapsibleContent className="pt-2">
              {facebookPages && facebookPages.length > 0 && (
                <div className="space-y-3 p-3 rounded-lg border bg-background">
                  <div className="space-y-2">
                    <Label className="text-xs">Select Page</Label>
                    <Select
                      value={config.facebookPageId || ""}
                      onValueChange={(value) =>
                        onConfigChange({
                          ...config,
                          facebookPageId: value || undefined,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a page" />
                      </SelectTrigger>
                      <SelectContent>
                        {facebookPages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={page.pageThumbnail || "/placeholder.svg"} />
                                <AvatarFallback>{page.pageName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              {page.pageName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {config.facebookPageId && (
                    <div className="space-y-2">
                      <Label className="text-xs">Privacy</Label>
                      <Select
                        value={config.facebookSettings?.privacyStatus || "public"}
                        onValueChange={(value: "public" | "friends" | "only_me") =>
                          onConfigChange({
                            ...config,
                            facebookSettings: {
                              ...config.facebookSettings,
                              privacyStatus: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="only_me">Only Me</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Custom RTMP Destinations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Custom RTMP</p>
                <p className="text-xs text-muted-foreground">Twitch, Twitter/X, LinkedIn, etc.</p>
              </div>
              {!showAddCustom && (
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddCustom(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {/* Existing Custom Destinations */}
            {config.customDestinations && config.customDestinations.length > 0 && (
              <div className="space-y-2">
                {config.customDestinations.map((dest) => {
                  const PlatformIcon = getPlatformIcon(dest.platform)
                  return (
                    <Card key={dest.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <PlatformIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{dest.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{dest.rtmpUrl}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleStreamKeyVisibility(dest.id)}
                            >
                              {showStreamKeys[dest.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveCustomDestination(dest.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {showStreamKeys[dest.id] && (
                          <div className="mt-2 p-2 rounded bg-muted text-xs font-mono truncate">{dest.streamKey}</div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Add Custom RTMP Form */}
            {showAddCustom && (
              <Card className="border-primary">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-sm">Add Custom RTMP</h5>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCustom(false)}>
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Platform</Label>
                    <Select
                      value={customRtmp.platform || "other"}
                      onValueChange={(value) =>
                        setCustomRtmp({
                          ...customRtmp,
                          platform: value as CustomRtmpDestination["platform"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitch">
                          <div className="flex items-center gap-2">
                            <Twitch className="h-4 w-4" />
                            Twitch
                          </div>
                        </SelectItem>
                        <SelectItem value="twitter">
                          <div className="flex items-center gap-2">
                            <Twitter className="h-4 w-4" />
                            Twitter / X
                          </div>
                        </SelectItem>
                        <SelectItem value="linkedin">
                          <div className="flex items-center gap-2">
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </div>
                        </SelectItem>
                        <SelectItem value="other">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Other
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Destination Name</Label>
                    <Input
                      placeholder="e.g., My Twitch Channel"
                      value={customRtmp.name || ""}
                      onChange={(e) => setCustomRtmp({ ...customRtmp, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">RTMP URL</Label>
                    <Input
                      placeholder="rtmp://live.twitch.tv/app"
                      value={customRtmp.rtmpUrl || ""}
                      onChange={(e) => setCustomRtmp({ ...customRtmp, rtmpUrl: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Stream Key</Label>
                    <Input
                      type="password"
                      placeholder="Enter stream key"
                      value={customRtmp.streamKey || ""}
                      onChange={(e) => setCustomRtmp({ ...customRtmp, streamKey: e.target.value })}
                    />
                  </div>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={handleAddCustomDestination}
                    disabled={!customRtmp.name || !customRtmp.rtmpUrl || !customRtmp.streamKey}
                  >
                    Add Destination
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConnectYouTubeDialog
        open={showConnectYouTube}
        onOpenChange={setShowConnectYouTube}
        onSuccess={(data) => {
          const newChannel: YouTubeChannel = {
            id: `yt-${Date.now()}`,
            ownerId: "current-user",
            ownerType: "streamer",
            channelId: data.channelId,
            channelTitle: data.channelTitle,
            channelThumbnail: data.channelThumbnail,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            tokenExpiresAt: new Date(Date.now() + 3600000),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          onYouTubeChannelConnected(newChannel)
          onConfigChange({ ...config, youtubeChannelId: newChannel.id })
        }}
      />

      <ConnectFacebookDialog
        open={showConnectFacebook}
        onOpenChange={setShowConnectFacebook}
        onSuccess={(data) => {
          const newPage: FacebookPage = {
            id: `fb-${Date.now()}`,
            ownerId: "current-user",
            ownerType: "streamer",
            pageId: data.pageId,
            pageName: data.pageName,
            pageThumbnail: data.pageThumbnail,
            accessToken: data.accessToken,
            tokenExpiresAt: new Date(Date.now() + 86400000 * 60),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          onFacebookPageConnected(newPage)
          onConfigChange({ ...config, facebookPageId: newPage.id })
        }}
      />
    </div>
  )
}
