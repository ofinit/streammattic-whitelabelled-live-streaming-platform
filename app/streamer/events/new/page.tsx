"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, Calendar, Play, Video, Check, MessageSquare, Loader2, Wallet, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { mockEventTemplates, mockUsers, mockStudios } from "@/lib/mock-data"
import type { StreamTypeKey } from "@/lib/types"
import { toast } from "@/hooks/use-toast"
import { StreamTypeSelector } from "@/components/events/stream-type-selector"
import { SimulcastSelector } from "@/components/events/simulcast-selector"
import { YouTubeChannelSelector } from "@/components/youtube/youtube-channel-selector"
import { useAuth } from "@/lib/auth-context"
import {
  calculateEventPrice,
  formatCurrency,
  validateCascade,
  type AncestorInfo,
} from "@/lib/cascade-wallet-service"

export default function ScheduleEventPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cascadeError, setCascadeError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    streamType: "" as StreamTypeKey | "",
    templateId: "tpl-default",
    isPrivate: false,
    pinCode: "",
    chatEnabled: true,
    reactionsEnabled: true,
    enableDvr: true,
    youtubeUrl: "",
    thirdPartyUrl: "",
    youtubeChannelId: "",
    simulcastDestinations: [] as ("youtube" | "facebook" | "custom_rtmp")[],
    templateData: {} as Record<string, string>,
  })

  const steps = [
    { id: 0, name: "Type", icon: Play },
    { id: 1, name: "Details", icon: Calendar },
    { id: 2, name: "Template", icon: Video },
    { id: 3, name: "Settings", icon: MessageSquare },
    { id: 4, name: "Review", icon: Check },
  ]

  const handleNext = () => {
    if (currentStep === 0 && !formData.streamType) {
      toast({ title: "Please select a stream type", variant: "destructive" })
      return
    }
    if (currentStep === 1) {
      if (!formData.title || !formData.date || !formData.time) {
        toast({ title: "Please fill in all required fields", variant: "destructive" })
        return
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // Calculate price preview
  const pricePreview = formData.streamType
    ? calculateEventPrice(
        formData.streamType as StreamTypeKey,
        formData.simulcastDestinations,
        "user",
      )
    : null

  // Validate cascade before submission
  const validateCascadeForSubmit = () => {
    if (!formData.streamType) return null

    // Build ancestor chain: User -> Studio -> Admin
    const currentUser = mockUsers[0] // In production, use actual auth user
    const parentStudio = mockStudios.find((r) => r.id === currentUser.studioId)

    const chain: AncestorInfo[] = [
      { id: currentUser.id, name: currentUser.name, type: "user", walletBalance: currentUser.walletBalance, parentId: currentUser.studioId },
    ]

    if (parentStudio) {
      chain.push({
        id: parentStudio.id,
        name: parentStudio.name,
        type: "studio",
        walletBalance: parentStudio.walletBalance,
      })
    }

    // Admin at the top
    chain.push({ id: "admin-1", name: "Platform Admin", type: "admin", walletBalance: 999999 })

    return validateCascade(chain, formData.streamType as StreamTypeKey, formData.simulcastDestinations)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setCascadeError(null)

    try {
      // 1. Validate cascade wallet balances
      const cascadeResult = validateCascadeForSubmit()
      if (cascadeResult && !cascadeResult.isValid) {
        setCascadeError(cascadeResult.failureReason || "Insufficient wallet balance in the chain")
        setIsSubmitting(false)
        return
      }

      // 2. Create stream on Nimble server (for RTMP streams)
      const newEventId = `evt-${Date.now()}`
      let streamData = null

      if (formData.streamType === "rtmp") {
        const streamRes = await fetch("/api/stream/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: newEventId,
            eventTitle: formData.title,
            enableRecording: formData.enableDvr,
            enableTranscoding: true,
          }),
        })

        if (streamRes.ok) {
          const result = await streamRes.json()
          streamData = result.stream
        }
      }

      // 3. Event created successfully
      toast({
        title: "Event created successfully!",
        description: streamData
          ? `${formData.title} has been scheduled. Stream key generated.`
          : `${formData.title} has been scheduled`,
      })

      // Navigate to stream control room
      router.push(`/dashboard/events/${newEventId}/stream`)
    } catch (error) {
      toast({
        title: "Failed to create event",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTemplate = mockEventTemplates.find((t) => t.id === formData.templateId)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create New Event</h1>
              <p className="mt-1 text-muted-foreground">Set up your live streaming event in a few steps</p>
            </div>
            <Button variant="ghost" onClick={() => router.push("/dashboard/events")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      index < currentStep
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </div>
                  <p
                    className={`hidden text-xs font-medium sm:block ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 w-8 shrink-0 sm:mx-3 sm:w-12 ${index < currentStep ? "bg-primary" : "bg-border"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Step 0: Choose Event Type */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Choose Event Type</h2>
              <p className="mt-1 text-muted-foreground">Select how you want to stream your event</p>
            </div>

            <StreamTypeSelector
              value={formData.streamType}
              onChange={(value) => setFormData({ ...formData, streamType: value })}
              showPricing={true}
              userLevel="user"
            />

            {formData.streamType === "rtmp" && (
              <div className="mt-6">
                <SimulcastSelector
                  value={formData.simulcastDestinations}
                  onChange={(value) => setFormData({ ...formData, simulcastDestinations: value })}
                  showPricing={true}
                  userLevel="user"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 1: Event Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Event Details</h2>
              <p className="mt-1 text-muted-foreground">Basic information about your event</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event"
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="date">Event Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="time">Event Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                  placeholder="Event location or 'Online'"
                  className="mt-1"
                />
              </div>

              {/* YouTube Channel Selection for YouTube API */}
              {formData.streamType === "youtube_api" && (
                <div>
                  <Label>YouTube Channel *</Label>
                  <YouTubeChannelSelector
                    ownerId="user-1"
                    ownerType="user"
                    selectedChannelId={formData.youtubeChannelId || null}
                    onSelectChannel={(channelId) => setFormData({ ...formData, youtubeChannelId: channelId || "" })}
                    broadcastSettings={{
                      privacyStatus: "unlisted",
                      enableDvr: true,
                      enableAutoStart: true,
                      enableAutoStop: true,
                    }}
                    onSettingsChange={() => {}}
                  />
                </div>
              )}

              {/* YouTube URL for YouTube Embed */}
              {formData.streamType === "youtube_embed" && (
                <div>
                  <Label htmlFor="youtubeUrl">YouTube Live URL *</Label>
                  <Input
                    id="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1"
                  />
                </div>
              )}

              {/* Third Party URL */}
              {formData.streamType === "third_party" && (
                <div>
                  <Label htmlFor="thirdPartyUrl">Stream URL (HLS) *</Label>
                  <Input
                    id="thirdPartyUrl"
                    value={formData.thirdPartyUrl}
                    onChange={(e) => setFormData({ ...formData, thirdPartyUrl: e.target.value })}
                    placeholder="https://example.com/stream.m3u8"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Choose Template */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Choose Template</h2>
              <p className="mt-1 text-muted-foreground">Select a design template for your event page</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {mockEventTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    formData.templateId === template.id
                      ? "border-2 border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setFormData({ ...formData, templateId: template.id })}
                >
                  <div className="aspect-video overflow-hidden rounded-t-lg bg-secondary">
                    <img
                      src={`/.jpg?height=200&width=300&query=${encodeURIComponent(template.name + " event template")}`}
                      alt={template.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {template.features.slice(0, 2).map((feature) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Template Customization */}
            {selectedTemplate && selectedTemplate.customFields.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold">Customize Template</h3>
                {selectedTemplate.customFields.map((field) => (
                  <div key={field.id}>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.type === "text" ? (
                      <Input
                        id={field.id}
                        value={formData.templateData[field.id] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            templateData: { ...formData.templateData, [field.id]: e.target.value },
                          })
                        }
                        placeholder={field.placeholder}
                        className="mt-1"
                      />
                    ) : field.type === "textarea" ? (
                      <Textarea
                        id={field.id}
                        value={formData.templateData[field.id] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            templateData: { ...formData.templateData, [field.id]: e.target.value },
                          })
                        }
                        placeholder={field.placeholder}
                        className="mt-1"
                        rows={3}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Settings */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Event Settings</h2>
              <p className="mt-1 text-muted-foreground">Configure privacy and interactive features</p>
            </div>

            <div className="space-y-6">
              {/* Privacy Settings */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold">Privacy</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isPrivate" className="text-base font-medium">
                        Private Event
                      </Label>
                      <p className="text-sm text-muted-foreground">Require PIN code to access</p>
                    </div>
                    <Switch
                      id="isPrivate"
                      checked={formData.isPrivate}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                    />
                  </div>

                  {formData.isPrivate && (
                    <div>
                      <Label htmlFor="pinCode">PIN Code</Label>
                      <Input
                        id="pinCode"
                        type="text"
                        value={formData.pinCode}
                        onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                        placeholder="Enter 4-6 digit PIN"
                        maxLength={6}
                        className="mt-1"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Interactive Features */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold">Interactive Features</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chatEnabled" className="text-base font-medium">
                        Live Chat
                      </Label>
                      <p className="text-sm text-muted-foreground">Enable real-time chat for viewers</p>
                    </div>
                    <Switch
                      id="chatEnabled"
                      checked={formData.chatEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, chatEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reactionsEnabled" className="text-base font-medium">
                        Reactions
                      </Label>
                      <p className="text-sm text-muted-foreground">Allow emoji reactions during the stream</p>
                    </div>
                    <Switch
                      id="reactionsEnabled"
                      checked={formData.reactionsEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, reactionsEnabled: checked })}
                    />
                  </div>
                </div>
              </Card>

              {/* DVR Settings for RTMP */}
              {formData.streamType === "rtmp" && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold">Recording</h3>
                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableDvr" className="text-base font-medium">
                          DVR Recording
                        </Label>
                        <p className="text-sm text-muted-foreground">Record stream for later playback</p>
                      </div>
                      <Switch
                        id="enableDvr"
                        checked={formData.enableDvr}
                        onCheckedChange={(checked) => setFormData({ ...formData, enableDvr: checked })}
                      />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Review & Confirm</h2>
              <p className="mt-1 text-muted-foreground">Check your event details before creating</p>
            </div>

            <div className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold">Event Information</h3>
                <dl className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Title:</dt>
                    <dd className="font-medium">{formData.title}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Date:</dt>
                    <dd className="font-medium">{formData.date}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Time:</dt>
                    <dd className="font-medium">{formData.time}</dd>
                  </div>
                  {formData.venue && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Venue:</dt>
                      <dd className="font-medium">{formData.venue}</dd>
                    </div>
                  )}
                </dl>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold">Stream Configuration</h3>
                <dl className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Stream Type:</dt>
                    <dd className="font-medium">{formData.streamType}</dd>
                  </div>
                  {formData.streamType === "rtmp" && formData.simulcastDestinations.length > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Simulcast:</dt>
                      <dd className="font-medium">{formData.simulcastDestinations.join(", ")}</dd>
                    </div>
                  )}
                </dl>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold">Settings</h3>
                <dl className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Privacy:</dt>
                    <dd className="font-medium">{formData.isPrivate ? "Private (PIN Required)" : "Public"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Live Chat:</dt>
                    <dd className="font-medium">{formData.chatEnabled ? "Enabled" : "Disabled"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Reactions:</dt>
                    <dd className="font-medium">{formData.reactionsEnabled ? "Enabled" : "Disabled"}</dd>
                  </div>
                  {formData.streamType === "rtmp" && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">DVR Recording:</dt>
                      <dd className="font-medium">{formData.enableDvr ? "Enabled" : "Disabled"}</dd>
                    </div>
                  )}
                </dl>
              </Card>

              {/* Pricing Card */}
              {pricePreview && (
                <Card className="p-6 border-primary/30 bg-primary/5">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Event Cost
                  </h3>
                  <dl className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Stream Type:</dt>
                      <dd className="font-medium">{formatCurrency(pricePreview.streamPrice)}</dd>
                    </div>
                    {pricePreview.simulcastPrice > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Simulcast ({formData.simulcastDestinations.length} destinations):</dt>
                        <dd className="font-medium">{formatCurrency(pricePreview.simulcastPrice)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <dt className="font-semibold">Total:</dt>
                      <dd className="text-lg font-bold text-primary">{formatCurrency(pricePreview.total)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-muted-foreground">
                    This amount will be deducted from your wallet upon event creation.
                  </p>
                </Card>
              )}

              {/* Cascade Error Alert */}
              {cascadeError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{cascadeError}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Event...
                </>
              ) : pricePreview ? (
                `Create Event (${formatCurrency(pricePreview.total)})`
              ) : (
                "Create Event"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
