"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Video,
  Youtube,
  Globe,
  Zap,
  Calendar,
  Lock,
  MessageSquare,
  Heart,
  Copy,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  List,
} from "lucide-react"
import type {
  LiveEvent,
  StreamType,
  EventStatus,
  YouTubeChannel,
  FacebookPage,
  SimulcastConfig,
  TemplateData,
} from "@/lib/types"
import { mockEventTemplates, mockYouTubeChannels, mockFacebookPages } from "@/lib/mock-data"
import { YouTubeChannelSelector } from "@/components/youtube/youtube-channel-selector"
import { SimulcastDestinations } from "@/components/simulcast/simulcast-destinations"
import { TemplateCustomFields } from "@/components/events/template-custom-fields"

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: LiveEvent | null
  onSave: (event: LiveEvent, keepOpen?: boolean) => void
}

export function EventFormDialog({ open, onOpenChange, event, onSave }: EventFormDialogProps) {
  const isEditing = !!event

  const [activeTab, setActiveTab] = useState("details")
  const [showCredentialsScreen, setShowCredentialsScreen] = useState(false)
  const [credentials, setCredentials] = useState<{
    rtmpUrl: string
    streamKey: string
    broadcastId?: string
    eventTitle?: string
  } | null>(null)
  const [copied, setCopied] = useState<"rtmp" | "key" | null>(null)
  const [showStreamKey, setShowStreamKey] = useState(false)

  // YouTube state
  const [youtubeChannels, setYoutubeChannels] = useState<YouTubeChannel[]>(mockYouTubeChannels)
  const [selectedYouTubeChannel, setSelectedYouTubeChannel] = useState<string | null>(null)
  const [youtubeBroadcastSettings, setYoutubeBroadcastSettings] = useState({
    privacyStatus: "public" as "public" | "unlisted" | "private",
    enableDvr: true,
    enableAutoStart: true,
    enableAutoStop: true,
  })

  // Facebook state
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>(mockFacebookPages)

  const [simulcastConfig, setSimulcastConfig] = useState<SimulcastConfig>({
    enabled: false,
    customDestinations: [],
  })

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    streamType: "rtmp" as StreamType,
    youtubeUrl: "",
    embedCode: "",
    scheduledAt: "",
    isPasswordProtected: false,
    password: "",
    allowChat: true,
    allowReactions: true,
    templateId: "",
    rtmpUrl: "",
    streamKey: "",
  })

  const [templateData, setTemplateData] = useState<TemplateData>({})
  const [templateFieldErrors, setTemplateFieldErrors] = useState<Record<string, string>>({})

  // State for template category filter
  const [templateCategory, setTemplateCategory] = useState<string>("all")

  const templateCategories = useMemo(() => {
    const categoryCount: Record<string, number> = {}
    mockEventTemplates.forEach((template) => {
      categoryCount[template.category] = (categoryCount[template.category] || 0) + 1
    })
    return Object.entries(categoryCount)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category, count]) => ({ category, count }))
  }, [])

  const filteredTemplates = useMemo(() => {
    if (templateCategory === "all") return mockEventTemplates
    return mockEventTemplates.filter((template) => template.category === templateCategory)
  }, [templateCategory])

  // Reset form when dialog opens with new event or fresh
  useEffect(() => {
    if (open && !showCredentialsScreen) {
      if (event) {
        setFormData({
          title: event.title,
          description: event.description || "",
          streamType: event.streamType,
          youtubeUrl: event.youtubeUrl || "",
          embedCode: event.embedCode || "",
          scheduledAt: event.scheduledAt ? new Date(event.scheduledAt).toISOString().slice(0, 16) : "",
          isPasswordProtected: event.isPasswordProtected,
          password: event.password || "",
          allowChat: event.allowChat,
          allowReactions: event.allowReactions,
          templateId: "",
          rtmpUrl: event.rtmpUrl || "",
          streamKey: event.streamKey || "",
        })
        // Load simulcast config if editing
        if (event.simulcastConfig) {
          setSimulcastConfig(event.simulcastConfig)
        }
        if ((event as any).templateData) {
          setTemplateData((event as any).templateData)
        }
      } else {
        setFormData({
          title: "",
          description: "",
          streamType: "rtmp",
          youtubeUrl: "",
          embedCode: "",
          scheduledAt: "",
          isPasswordProtected: false,
          password: "",
          allowChat: true,
          allowReactions: true,
          templateId: "",
          rtmpUrl: "",
          streamKey: "",
        })
        setSimulcastConfig({
          enabled: false,
          customDestinations: [],
        })
        setTemplateData({})
        setTemplateFieldErrors({})
      }
      setActiveTab("details")
    }
  }, [open, event, showCredentialsScreen])

  useEffect(() => {
    if (!isEditing) {
      setTemplateData({})
      setTemplateFieldErrors({})
    }
  }, [formData.templateId, isEditing])

  // Reset credentials screen when dialog closes
  useEffect(() => {
    if (!open) {
      setShowCredentialsScreen(false)
      setCredentials(null)
    }
  }, [open])

  const hasCredentials = formData.rtmpUrl && formData.streamKey
  const showRtmpCredentials = hasCredentials

  const copyToClipboard = (text: string, type: "rtmp" | "key") => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const generateCredentials = () => {
    const streamKey = `live_${Math.random().toString(36).substring(2, 15)}`
    const rtmpUrl = "rtmp://stream.streammattic.com/live"
    return { rtmpUrl, streamKey }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const { rtmpUrl, streamKey } =
      formData.streamType === "rtmp" || formData.streamType === "youtube_api"
        ? isEditing && formData.rtmpUrl
          ? { rtmpUrl: formData.rtmpUrl, streamKey: formData.streamKey }
          : generateCredentials()
        : { rtmpUrl: "", streamKey: "" }

    const savedEvent: LiveEvent = {
      id: event?.id || `event-${Date.now()}`,
      userId: event?.userId || "user-1",
      resellerId: event?.resellerId || "reseller-1",
      title: formData.title,
      description: formData.description,
      streamType: formData.streamType,
      streamKey: streamKey,
      rtmpUrl: rtmpUrl,
      youtubeUrl: formData.streamType === "youtube" ? formData.youtubeUrl : undefined,
      embedCode: formData.streamType === "embedded" ? formData.embedCode : undefined,
      status: (event?.status || "scheduled") as EventStatus,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : undefined,
      maxViewers: event?.maxViewers || 500,
      currentViewers: event?.currentViewers || 0,
      totalViews: event?.totalViews || 0,
      isPasswordProtected: formData.isPasswordProtected,
      password: formData.isPasswordProtected ? formData.password : undefined,
      allowChat: formData.allowChat,
      allowReactions: formData.allowReactions,
      createdAt: event?.createdAt || new Date(),
      updatedAt: new Date(),
      simulcastConfig: formData.streamType === "rtmp" ? simulcastConfig : undefined,
    }
    ;(savedEvent as any).templateId = formData.templateId
    ;(savedEvent as any).templateData = templateData

    // For RTMP or YouTube API, show credentials screen after creation (not when editing)
    if (!isEditing && (formData.streamType === "rtmp" || formData.streamType === "youtube_api")) {
      setCredentials({
        rtmpUrl,
        streamKey,
        broadcastId: formData.streamType === "youtube_api" ? `broadcast_${Date.now()}` : undefined,
        eventTitle: formData.title,
      })
      setShowCredentialsScreen(true)
      onSave(savedEvent, true) // keepOpen = true
    } else {
      onSave(savedEvent, false)
      onOpenChange(false)
    }
  }

  const handleCloseCredentialsScreen = () => {
    setShowCredentialsScreen(false)
    setCredentials(null)
    onOpenChange(false)
  }

  // Render credentials success screen
  if (showCredentialsScreen && credentials) {
    return (
      <Dialog open={open} onOpenChange={handleCloseCredentialsScreen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Check className="h-5 w-5" />
              Event Created Successfully!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Alert className="border-primary/50 bg-primary/5">
              <Video className="h-4 w-4" />
              <AlertTitle>Your Streaming Credentials</AlertTitle>
              <AlertDescription>
                Use these credentials in OBS, Wirecast, or any RTMP-compatible encoder.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">RTMP URL (Server)</Label>
                <div className="flex gap-2">
                  <Input value={credentials.rtmpUrl} readOnly className="font-mono text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.rtmpUrl, "rtmp")}
                  >
                    {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Stream Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={credentials.streamKey}
                      readOnly
                      type={showStreamKey ? "text" : "password"}
                      className="font-mono text-sm pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowStreamKey(!showStreamKey)}
                    >
                      {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(credentials.streamKey, "key")}
                  >
                    {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Simulcast destinations summary */}
            {simulcastConfig.enabled && (
              <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
                <h5 className="font-medium text-sm">Simulcast Destinations</h5>
                <div className="text-xs text-muted-foreground space-y-1">
                  {simulcastConfig.youtubeChannelId && (
                    <p>
                      • YouTube Live -{" "}
                      {youtubeChannels.find((c) => c.id === simulcastConfig.youtubeChannelId)?.channelTitle}
                    </p>
                  )}
                  {simulcastConfig.facebookPageId && (
                    <p>
                      • Facebook Live - {facebookPages.find((p) => p.id === simulcastConfig.facebookPageId)?.pageName}
                    </p>
                  )}
                  {simulcastConfig.customDestinations.map((dest) => (
                    <p key={dest.id}>• {dest.name}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
              <h5 className="font-medium text-sm">Quick Setup for OBS Studio</h5>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Open OBS Studio → Settings → Stream</li>
                <li>Set Service to "Custom..."</li>
                <li>Paste RTMP URL in "Server" field</li>
                <li>Paste Stream Key in "Stream Key" field</li>
                <li>Click "Apply" and start streaming!</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={handleCloseCredentialsScreen}>
                <List className="h-4 w-4 mr-2" />
                View All Events
              </Button>
              <Button className="flex-1" onClick={handleCloseCredentialsScreen}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Event" : "Create New Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="stream">Stream</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Scheduled Date & Time
                </Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="stream" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Stream Type *</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "rtmp", label: "RTMP Server", icon: Video, desc: "Use OBS/Wirecast" },
                    {
                      value: "youtube_api",
                      label: "YouTube API",
                      icon: Zap,
                      desc: "Direct broadcast",
                      badge: "Recommended",
                    },
                    { value: "youtube", label: "YouTube Embed", icon: Youtube, desc: "Embed existing" },
                    { value: "embedded", label: "Third Party", icon: Globe, desc: "External embed" },
                  ].map((type) => (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-colors ${
                        formData.streamType === type.value ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => setFormData({ ...formData, streamType: type.value as StreamType })}
                    >
                      <CardContent className="p-4 text-center relative">
                        {type.badge && (
                          <Badge className="absolute top-2 right-2 text-xs bg-red-500">{type.badge}</Badge>
                        )}
                        <type.icon
                          className={`h-8 w-8 mx-auto mb-2 ${type.value === "youtube_api" ? "text-red-500" : "text-primary"}`}
                        />
                        <p className="font-medium text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {isEditing &&
                showRtmpCredentials &&
                (formData.streamType === "rtmp" || formData.streamType === "youtube_api") && (
                  <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                    <Alert className="border-primary/50 bg-primary/5">
                      <Video className="h-4 w-4" />
                      <AlertTitle>Your Streaming Credentials</AlertTitle>
                      <AlertDescription>Use these credentials in OBS, Wirecast, or any RTMP encoder.</AlertDescription>
                    </Alert>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">RTMP URL (Server)</Label>
                      <div className="flex gap-2">
                        <Input value={formData.rtmpUrl || ""} readOnly className="font-mono text-sm" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(formData.rtmpUrl!, "rtmp")}
                        >
                          {copied === "rtmp" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Stream Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={formData.streamKey || ""}
                            readOnly
                            type={showStreamKey ? "text" : "password"}
                            className="font-mono text-sm pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowStreamKey(!showStreamKey)}
                          >
                            {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(formData.streamKey!, "key")}
                        >
                          {copied === "key" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* OBS Setup Instructions */}
                    <div className="space-y-2 p-3 rounded border bg-background">
                      <h5 className="font-medium text-sm">Quick Setup for OBS Studio</h5>
                      <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Open OBS Studio → Settings → Stream</li>
                        <li>Set Service to "Custom..."</li>
                        <li>Paste RTMP URL in "Server" field</li>
                        <li>Paste Stream Key in "Stream Key" field</li>
                        <li>Click "Apply" and start streaming!</li>
                      </ol>
                    </div>
                  </div>
                )}

              {formData.streamType === "rtmp" && (
                <SimulcastDestinations
                  youtubeChannels={youtubeChannels}
                  facebookPages={facebookPages}
                  config={simulcastConfig}
                  onConfigChange={setSimulcastConfig}
                  onYouTubeChannelConnected={(channel) => {
                    setYoutubeChannels([...youtubeChannels, channel])
                  }}
                  onFacebookPageConnected={(page) => {
                    setFacebookPages([...facebookPages, page])
                  }}
                />
              )}

              {formData.streamType === "youtube_api" && (
                <YouTubeChannelSelector
                  channels={youtubeChannels}
                  selectedChannelId={selectedYouTubeChannel}
                  onSelectChannel={setSelectedYouTubeChannel}
                  broadcastSettings={youtubeBroadcastSettings}
                  onSettingsChange={setYoutubeBroadcastSettings}
                  onChannelConnected={(channel) => {
                    setYoutubeChannels([...youtubeChannels, channel])
                  }}
                />
              )}

              {formData.streamType === "youtube" && (
                <div className="space-y-2">
                  <Label htmlFor="youtubeUrl">YouTube Live URL *</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              {formData.streamType === "embedded" && (
                <div className="space-y-2">
                  <Label htmlFor="embedCode">Embed Code *</Label>
                  <Textarea
                    id="embedCode"
                    value={formData.embedCode}
                    onChange={(e) => setFormData({ ...formData, embedCode: e.target.value })}
                    placeholder="<iframe src=..."
                    rows={4}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="template" className="space-y-4 mt-4">
              <Label>Select Event Template</Label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Category:</span>
                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories ({mockEventTemplates.length})</SelectItem>
                    {templateCategories.map(({ category, count }) => (
                      <SelectItem key={category} value={category}>
                        {category} ({count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-colors overflow-hidden ${
                      formData.templateId === template.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setFormData({ ...formData, templateId: template.id })}
                  >
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={`/.jpg?key=enjz1&height=120&width=200&query=${encodeURIComponent(template.name + " template")}`}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      {formData.templateId === template.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-8 w-8 text-primary" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-2">
                      <p className="text-xs font-medium truncate">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.category}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {formData.templateId && (
                <div className="mt-6 pt-4 border-t">
                  <TemplateCustomFields
                    templateId={formData.templateId}
                    data={templateData}
                    onChange={setTemplateData}
                    errors={templateFieldErrors}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Password Protection</p>
                      <p className="text-xs text-muted-foreground">Require password to view</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.isPasswordProtected}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPasswordProtected: checked })}
                  />
                </div>

                {formData.isPasswordProtected && (
                  <div className="space-y-2 pl-8">
                    <Label htmlFor="password">Event Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Live Chat</p>
                      <p className="text-xs text-muted-foreground">Allow viewers to chat</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.allowChat}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowChat: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Reactions</p>
                      <p className="text-xs text-muted-foreground">Allow emoji reactions</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.allowReactions}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowReactions: checked })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{isEditing ? "Save Changes" : "Create Event"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
