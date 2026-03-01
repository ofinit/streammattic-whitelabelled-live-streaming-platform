"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Package, PricingModel, StreamTypePricing, SimulcastPricing } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Video, Youtube, Play, Globe, Facebook, Radio } from "lucide-react"
import { defaultStreamTypePricing, defaultSimulcastPricing } from "@/lib/cascade-wallet-service"

interface PackageFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pkg?: Package | null
  onSubmit: (data: Partial<Package>) => void
}

export function PackageFormDialog({ open, onOpenChange, pkg, onSubmit }: PackageFormDialogProps) {
  const [formData, setFormData] = useState<Partial<Package>>(
    pkg || {
      name: "",
      slug: "",
      type: "event_pack",
      pricingModel: "monthly",
      description: "",
      basePriceStudio: 0,
      basePriceStreamer: 0,
      duration: 30,
      maxEvents: 10,
      maxConcurrentViewers: 500,
      features: [],
      isActive: true,
      minQty: 1,
      maxQty: 100,
      streamTypePricing: defaultStreamTypePricing,
      simulcastPricing: defaultSimulcastPricing,
    },
  )
  const [newFeature, setNewFeature] = useState("")

  // Reset form when package changes
  useEffect(() => {
    if (pkg) {
      setFormData({
        ...pkg,
        streamTypePricing: pkg.streamTypePricing || defaultStreamTypePricing,
        simulcastPricing: pkg.simulcastPricing || defaultSimulcastPricing,
      })
    } else {
      setFormData({
        name: "",
        slug: "",
        type: "event_pack",
        pricingModel: "monthly",
        description: "",
        basePriceStudio: 0,
        basePriceStreamer: 0,
        duration: 30,
        maxEvents: 10,
        maxConcurrentViewers: 500,
        features: [],
        isActive: true,
        minQty: 1,
        maxQty: 100,
        streamTypePricing: defaultStreamTypePricing,
        simulcastPricing: defaultSimulcastPricing,
      })
    }
  }, [pkg])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData((prev) => ({
        ...prev,
        features: [...(prev.features || []), newFeature.trim()],
      }))
      setNewFeature("")
    }
  }

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index),
    }))
  }

  const updateStreamTypePrice = (
    streamType: keyof StreamTypePricing,
    level: "streamerPrice" | "studioPrice" | "enabled",
    value: number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      streamTypePricing: {
        ...prev.streamTypePricing!,
        [streamType]: {
          ...prev.streamTypePricing![streamType],
          [level]: value,
        },
      },
    }))
  }

  const updateSimulcastPrice = (
    destination: keyof SimulcastPricing,
    level: "streamerPrice" | "studioPrice" | "enabled",
    value: number | boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      simulcastPricing: {
        ...prev.simulcastPricing!,
        [destination]: {
          ...prev.simulcastPricing![destination],
          [level]: value,
        },
      },
    }))
  }

  const isPayPerEvent = formData.pricingModel === "pay_per_event"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pkg ? "Edit Package" : "Create Package"}</DialogTitle>
          <DialogDescription>
            {pkg ? "Update the package details below." : "Fill in the details to create a new package."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Package Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as Package["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="event_pack">Event Pack</SelectItem>
                      <SelectItem value="pay_per_event">Pay Per Event</SelectItem>
                      <SelectItem value="validity">Validity Extension</SelectItem>
                      <SelectItem value="addon">Add-on</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricingModel">Pricing Model</Label>
                  <Select
                    value={formData.pricingModel}
                    onValueChange={(value) => setFormData({ ...formData, pricingModel: value as PricingModel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Subscription</SelectItem>
                      <SelectItem value="pay_per_event">Pay Per Event</SelectItem>
                      <SelectItem value="credits">Prepaid Credits</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    disabled={isPayPerEvent}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxEvents">Max Events</Label>
                  <Input
                    id="maxEvents"
                    type="number"
                    value={formData.maxEvents}
                    onChange={(e) => setFormData({ ...formData, maxEvents: Number(e.target.value) })}
                    placeholder="-1 for unlimited"
                    disabled={isPayPerEvent}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxViewers">Max Viewers</Label>
                  <Input
                    id="maxViewers"
                    type="number"
                    value={formData.maxConcurrentViewers}
                    onChange={(e) => setFormData({ ...formData, maxConcurrentViewers: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-4">
              {/* Base Package Price (for monthly/event_pack) */}
              {!isPayPerEvent && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Base Package Price</CardTitle>
                    <CardDescription>The fixed price for this package subscription</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="basePriceStudio">Studio Price (₹)</Label>
                        <Input
                          id="basePriceStudio"
                          type="number"
                          value={formData.basePriceStudio}
                          onChange={(e) => setFormData({ ...formData, basePriceStudio: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="basePriceStreamer">Streamer Price (₹)</Label>
                        <Input
                          id="basePriceStreamer"
                          type="number"
                          value={formData.basePriceStreamer}
                          onChange={(e) => setFormData({ ...formData, basePriceStreamer: Number(e.target.value) })}
                          required
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stream Type Per-Event Pricing - always visible */}
              <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Per-Event Stream Type Pricing</CardTitle>
                      <CardDescription>Set per-event price for each stream type (in paisa). Applied when user schedules an event.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { key: "rtmp" as const, label: "RTMP Server", icon: Video },
                        { key: "youtube_api" as const, label: "YouTube API", icon: Youtube },
                        { key: "youtube_embed" as const, label: "YouTube Embed", icon: Play },
                        { key: "third_party" as const, label: "Third Party Embed", icon: Globe },
                      ].map(({ key, label, icon: StreamIcon }) => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <StreamIcon className="h-4 w-4" />
                            {label}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">User Price</Label>
                              <Input
                                type="number"
                                value={formData.streamTypePricing?.[key].streamerPrice}
                                onChange={(e) => updateStreamTypePrice(key, "streamerPrice", Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Studio Price</Label>
                              <Input
                                type="number"
                                value={formData.streamTypePricing?.[key].studioPrice}
                                onChange={(e) => updateStreamTypePrice(key, "studioPrice", Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Simulcast Pricing */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Simulcast Add-on Pricing</CardTitle>
                      <CardDescription>Additional charges for multi-platform streaming</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { key: "youtube" as const, label: "YouTube Live", icon: Youtube, color: "text-red-500" },
                        { key: "facebook" as const, label: "Facebook Live", icon: Facebook, color: "text-blue-600" },
                        { key: "customRtmp" as const, label: "Custom RTMP", icon: Radio, color: "text-purple-500" },
                      ].map(({ key, label, icon: SimIcon, color }) => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <SimIcon className={`h-4 w-4 ${color}`} />
                            {label}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">User Price</Label>
                              <Input
                                type="number"
                                value={formData.simulcastPricing?.[key].streamerPrice}
                                onChange={(e) => updateSimulcastPrice(key, "streamerPrice", Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Studio Price</Label>
                              <Input
                                type="number"
                                value={formData.simulcastPricing?.[key].studioPrice}
                                onChange={(e) => updateSimulcastPrice(key, "studioPrice", Number(e.target.value))}
                                className="h-8"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" variant="outline" onClick={addFeature}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.features?.map((feature, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {feature}
                      <button type="button" onClick={() => removeFeature(i)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minQty">Min Quantity</Label>
                  <Input
                    id="minQty"
                    type="number"
                    value={formData.minQty}
                    onChange={(e) => setFormData({ ...formData, minQty: Number(e.target.value) })}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxQty">Max Quantity</Label>
                  <Input
                    id="maxQty"
                    type="number"
                    value={formData.maxQty}
                    onChange={(e) => setFormData({ ...formData, maxQty: Number(e.target.value) })}
                    min={1}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{pkg ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
