"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Video, Youtube, MonitorPlay, Globe, Save, RotateCcw, Gift,
  ChevronDown, Plus, Trash2, Clock, CreditCard, Loader2, X,
  IndianRupee, AlertCircle
} from "lucide-react"
import { masterStreamTypePricing, masterSimulcastPricing, masterValiditySettings } from "@/lib/mock-data"
import { parseStreamTypePricing, parseSimulcastPricing } from "@/lib/stream-type-pricing"
import { parseValidityExtensionsSetting } from "@/lib/validity-extensions"
import { formatCurrency } from "@/lib/cascade-wallet-service"
import type { StreamTypePricing, VolumeDiscountTier, ValidityTier } from "@/lib/types"
import { toast } from "sonner"

// ─── Constants ───────────────────────────────────────────────────────────────

const STREAM_TYPES = [
  { key: "rtmp" as const,         label: "RTMP Server",    description: "Use OBS/Wirecast",     icon: Video },
  { key: "youtube_api" as const,  label: "YouTube API",    description: "Direct broadcast",     icon: Youtube, recommended: true },
  { key: "youtube_embed" as const,label: "YouTube Embed",  description: "Embed existing stream",icon: MonitorPlay },
  { key: "third_party" as const,  label: "Third Party",   description: "External RTMP embed",  icon: Globe },
]

const SIMULCAST_CHANNELS = [
  { key: "youtube"    as const, label: "YouTube",      icon: Youtube },
  { key: "facebook"   as const, label: "Facebook",     icon: Globe   },
  { key: "customRtmp" as const, label: "Custom RTMP",  icon: Video   },
]

type Tab = "stream" | "simulcast" | "validity" | "subscription" | "bonus"

// ─── Props ────────────────────────────────────────────────────────────────────

interface FullscreenCustomPricingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  targetName: string
  targetType: "streamer" | "studio"
  /** Existing saved custom_pricing JSON blob from DB */
  existingCustomPricing?: Record<string, unknown> | null
  onSaved?: () => void
}

// ─── Helper: clone deep ──────────────────────────────────────────────────────

function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FullscreenCustomPricingDialog({
  open,
  onOpenChange,
  userId,
  targetName,
  targetType,
  existingCustomPricing,
  onSaved,
}: FullscreenCustomPricingDialogProps) {
  // ── Section override flags (null = use master) ─────────────────────────────
  const [streamOverrideEnabled,      setStreamOverrideEnabled]      = useState(false)
  const [simulcastOverrideEnabled,   setSimulcastOverrideEnabled]   = useState(false)
  const [validityOverrideEnabled,    setValidityOverrideEnabled]    = useState(false)
  const [subscriptionOverrideEnabled,setSubscriptionOverrideEnabled]= useState(false)
  const [bonusCreditsEnabled,        setBonusCreditsEnabled]        = useState(false)

  // ── Section state ──────────────────────────────────────────────────────────
  const [streamPricing,     setStreamPricing]     = useState<StreamTypePricing>(() => cloneDeep(masterStreamTypePricing))
  const [simulcastPricing,  setSimulcastPricing]  = useState(() => cloneDeep(masterSimulcastPricing))
  const [validityTiers,     setValidityTiers]     = useState<ValidityTier[]>(() => masterValiditySettings.extendedTiers.map(t => ({ ...t })))
  const [validityDefaultDays,setValidityDefaultDays] = useState(30)
  const [studioSubscription,setStudioSubscription]= useState({ price: 1800000, enabled: true })
  const [aiImagePricing,    setAiImagePricing]    = useState({ price: 500, enabled: true })
  const [bonusCredits,      setBonusCredits]      = useState<Record<string, string>>({})

  const [adminNote,    setAdminNote]    = useState("")
  const [activeTab,   setActiveTab]    = useState<Tab>("stream")
  const [expanded,    setExpanded]     = useState<Record<string, boolean>>({ rtmp: true })
  const [saving,      setSaving]       = useState(false)
  const [masterPricing, setMasterPricing] = useState<{
    stream: StreamTypePricing
    simulcast: typeof masterSimulcastPricing
    validity: { defaultDays: number; extendedTiers: ValidityTier[] }
  } | null>(null)

  // ── Load master settings from DB on first open ─────────────────────────────
  const loadMaster = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json() as { settings?: { key: string; value: unknown }[] }
      const rows = data.settings ?? []
      const map = Object.fromEntries(rows.map(r => [r.key, r.value])) as Record<string, unknown>
      const stream    = parseStreamTypePricing(map.stream_type_pricing ?? null, map.volume_discount_tiers ?? null)
      const simulcast = parseSimulcastPricing(map.simulcast_pricing ?? null)
      const ve        = parseValidityExtensionsSetting(map.validity_extensions ?? null)
      const validity  = { defaultDays: ve.defaultDays, extendedTiers: ve.extendedTiers }
      setMasterPricing({ stream, simulcast, validity })
      return { stream, simulcast, validity }
    } catch {
      return null
    }
  }, [])

  // ── Initialise state when dialog opens ────────────────────────────────────
  useEffect(() => {
    if (!open) return
    void (async () => {
      const master = await loadMaster()
      const cp = existingCustomPricing

      // Stream pricing
      if (cp?.streamTypePricing) {
        setStreamOverrideEnabled(true)
        setStreamPricing(parseStreamTypePricing(cp.streamTypePricing as any, null))
      } else {
        setStreamOverrideEnabled(false)
        setStreamPricing(master ? cloneDeep(master.stream) : cloneDeep(masterStreamTypePricing))
      }

      // Simulcast
      if (cp?.simulcastPricing) {
        setSimulcastOverrideEnabled(true)
        setSimulcastPricing(parseSimulcastPricing(cp.simulcastPricing as any))
      } else {
        setSimulcastOverrideEnabled(false)
        setSimulcastPricing(master ? cloneDeep(master.simulcast) : cloneDeep(masterSimulcastPricing))
      }

      // Validity
      if (cp?.validityTiers) {
        setValidityOverrideEnabled(true)
        const ve = parseValidityExtensionsSetting({ extendedTiers: cp.validityTiers, defaultDays: cp.validityDefaultDays })
        setValidityDefaultDays(ve.defaultDays)
        setValidityTiers(ve.extendedTiers.map(t => ({ ...t })))
      } else {
        setValidityOverrideEnabled(false)
        if (master) {
          setValidityDefaultDays(master.validity.defaultDays)
          setValidityTiers(master.validity.extendedTiers.map((t: ValidityTier) => ({ ...t })))
        }
      }

      // Subscription
      if (cp?.studioSubscription) {
        setSubscriptionOverrideEnabled(true)
        const s = cp.studioSubscription as Record<string, unknown>
        setStudioSubscription({ price: Number(s.price ?? 1800000), enabled: s.enabled !== false })
      } else {
        setSubscriptionOverrideEnabled(false)
        setStudioSubscription({ price: 1800000, enabled: true })
      }

      // Bonus credits
      if (cp?.bonusCredits && typeof cp.bonusCredits === "object") {
        setBonusCreditsEnabled(true)
        const bc: Record<string, string> = {}
        for (const { key } of STREAM_TYPES) bc[key] = String((cp.bonusCredits as any)[key] ?? 0)
        setBonusCredits(bc)
      } else {
        setBonusCreditsEnabled(false)
        const bc: Record<string, string> = {}
        for (const { key } of STREAM_TYPES) bc[key] = "0"
        setBonusCredits(bc)
      }

      setAdminNote("")
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ─── Stream Pricing Helpers ──────────────────────────────────────────────

  const updateBasePrice = (key: keyof StreamTypePricing, value: number) =>
    setStreamPricing(prev => ({ ...prev, [key]: { ...prev[key], basePrice: value } }))

  const toggleStreamType = (key: keyof StreamTypePricing, enabled: boolean) =>
    setStreamPricing(prev => ({ ...prev, [key]: { ...prev[key], enabled } }))

  const addDiscountTier = (key: keyof StreamTypePricing) => {
    setStreamPricing(prev => {
      const cfg = prev[key]
      const last = cfg.volumeDiscountTiers.at(-1)
      return {
        ...prev,
        [key]: {
          ...cfg,
          volumeDiscountTiers: [
            ...cfg.volumeDiscountTiers,
            { minQty: last ? last.minQty * 2 : 5, pricePerEvent: Math.round(cfg.basePrice * 0.8), label: "" },
          ],
        },
      }
    })
  }

  const updateDiscountTier = (key: keyof StreamTypePricing, idx: number, field: keyof VolumeDiscountTier, value: string | number) =>
    setStreamPricing(prev => {
      const cfg = prev[key]
      return { ...prev, [key]: { ...cfg, volumeDiscountTiers: cfg.volumeDiscountTiers.map((t, i) => i === idx ? { ...t, [field]: value } : t) } }
    })

  const removeDiscountTier = (key: keyof StreamTypePricing, idx: number) =>
    setStreamPricing(prev => {
      const cfg = prev[key]
      return { ...prev, [key]: { ...cfg, volumeDiscountTiers: cfg.volumeDiscountTiers.filter((_, i) => i !== idx) } }
    })

  const updateValidityTier = (days: number, field: keyof ValidityTier, value: number | boolean | string) =>
    setValidityTiers(prev => prev.map(t => t.days === days ? { ...t, [field]: value } : t))

  // ─── Section Resets (isolated) ──────────────────────────────────────────

  const resetSection = (section: Tab) => {
    if (!masterPricing) return
    if (section === "stream") {
      setStreamPricing(cloneDeep(masterPricing.stream))
      setStreamOverrideEnabled(false)
    } else if (section === "simulcast") {
      setSimulcastPricing(cloneDeep(masterPricing.simulcast))
      setSimulcastOverrideEnabled(false)
    } else if (section === "validity") {
      setValidityDefaultDays(masterPricing.validity.defaultDays)
      setValidityTiers(masterPricing.validity.extendedTiers.map(t => ({ ...t })))
      setValidityOverrideEnabled(false)
    } else if (section === "subscription") {
      setStudioSubscription({ price: 1800000, enabled: true })
      setSubscriptionOverrideEnabled(false)
    } else if (section === "bonus") {
      const bc: Record<string, string> = {}
      for (const { key } of STREAM_TYPES) bc[key] = "0"
      setBonusCredits(bc)
      setBonusCreditsEnabled(false)
    }
    toast.success(`${section} pricing reset to master`)
  }

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}

      if (streamOverrideEnabled)       payload.streamTypePricing  = streamPricing
      if (simulcastOverrideEnabled)    payload.simulcastPricing   = simulcastPricing
      if (validityOverrideEnabled)     { payload.validityTiers = validityTiers; payload.validityDefaultDays = validityDefaultDays }
      if (subscriptionOverrideEnabled) payload.studioSubscription = studioSubscription
      if (bonusCreditsEnabled) {
        const bc: Record<string, number> = {}
        for (const { key } of STREAM_TYPES) { const v = Number(bonusCredits[key] || 0); if (v > 0) bc[key] = v }
        payload.bonusCredits = bc
      }

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, adminNote: adminNote || undefined }),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(body.error || "Failed to save custom pricing")
        return
      }

      toast.success("Custom pricing saved successfully")
      onSaved?.()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  const hasAnyOverride = streamOverrideEnabled || simulcastOverrideEnabled || validityOverrideEnabled || subscriptionOverrideEnabled || bonusCreditsEnabled

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "stream",       label: "Stream Types",    icon: IndianRupee },
    { id: "simulcast",    label: "Simulcast",       icon: Globe },
    { id: "validity",     label: "Validity",        icon: Clock },
    { id: "subscription", label: "Subscription",    icon: CreditCard },
    { id: "bonus",        label: "Bonus Credits",   icon: Gift },
  ]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Custom Pricing — {targetName}</h2>
            <p className="text-xs text-muted-foreground capitalize">
              {targetType} · overrides platform master pricing · disabled sections inherit master
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnyOverride && (
            <Badge variant="outline" className="text-amber-500 border-amber-500/30">
              Custom pricing active
            </Badge>
          )}
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border px-6 py-2 shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {/* Dot indicator when section has override */}
            {(
              (tab.id === "stream"       && streamOverrideEnabled)       ||
              (tab.id === "simulcast"    && simulcastOverrideEnabled)    ||
              (tab.id === "validity"     && validityOverrideEnabled)     ||
              (tab.id === "subscription" && subscriptionOverrideEnabled) ||
              (tab.id === "bonus"        && bonusCreditsEnabled)
            ) && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 ml-0.5" />
            )}
          </button>
        ))}
      </div>

      {/* ── Scrollable content ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto w-full">

        {/* ── Stream Type Pricing ──────────────────────────── */}
        {activeTab === "stream" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Stream Type Pricing</h3>
                <p className="text-xs text-muted-foreground">Set custom base prices and volume discount tiers for this {targetType}.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Override master</span>
                <Switch checked={streamOverrideEnabled} onCheckedChange={setStreamOverrideEnabled} />
                {streamOverrideEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => resetSection("stream")}>
                    <RotateCcw className="mr-1.5 h-3 w-3" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {!streamOverrideEnabled && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                Stream type pricing inherits master platform rates. Toggle override above to configure custom rates.
              </div>
            )}

            {streamOverrideEnabled && STREAM_TYPES.map(({ key, label, description, icon: Icon, recommended }) => {
              const config = streamPricing[key]
              const isExpanded = expanded[key] ?? false
              return (
                <div key={key} className={`rounded-lg border transition-colors ${config.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"}`}>
                  <Collapsible open={isExpanded} onOpenChange={o => setExpanded(p => ({ ...p, [key]: o }))}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
                      <CollapsibleTrigger asChild disabled={!config.enabled}>
                        <button type="button" className="flex min-w-[12rem] flex-1 items-center gap-3 text-left" disabled={!config.enabled}>
                          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isExpanded && config.enabled ? "rotate-180" : ""}`} />
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.enabled ? "bg-primary/10" : "bg-muted"}`}>
                            <Icon className={`h-5 w-5 ${config.enabled ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{label}</span>
                              {recommended && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Recommended</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{description}</p>
                          </div>
                          {config.volumeDiscountTiers.length > 0 && !isExpanded && (
                            <Badge variant="secondary" className="ml-2 shrink-0 text-[10px] px-1.5 py-0">
                              {config.volumeDiscountTiers.length} tier{config.volumeDiscountTiers.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </button>
                      </CollapsibleTrigger>

                      <div className="flex shrink-0 items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Base Price</Label>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                          <Input
                            type="number" step="0.01" min="0"
                            value={config.basePrice / 100}
                            onChange={(e) => { const n = parseFloat(e.target.value); if (!Number.isNaN(n)) updateBasePrice(key, Math.round(n * 100)) }}
                            className="h-9 border-0 bg-secondary pl-7"
                            disabled={!config.enabled}
                          />
                        </div>
                        <div className="flex items-center border-l border-border/60 pl-2" onPointerDown={e => e.stopPropagation()}>
                          <Switch checked={config.enabled} onCheckedChange={c => toggleStreamType(key, c)} />
                        </div>
                      </div>
                    </div>

                    <CollapsibleContent>
                      {config.enabled && (
                        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-muted-foreground">Volume Discount Tiers</p>
                            <Button size="sm" variant="ghost" onClick={() => addDiscountTier(key)}>
                              <Plus className="mr-1 h-3 w-3" /> Add Tier
                            </Button>
                          </div>
                          {config.volumeDiscountTiers.length === 0 && (
                            <p className="text-sm text-muted-foreground">No tiers. Users pay the base price for any quantity.</p>
                          )}
                          {config.volumeDiscountTiers.map((tier, idx) => {
                            const base = config.basePrice
                            const pct  = base > 0 ? Math.round((1 - tier.pricePerEvent / base) * 100) : 0
                            return (
                              <div key={idx} className="rounded-md bg-secondary/30 p-3">
                                <div className="grid items-start gap-3 md:grid-cols-[120px_140px_1fr_40px]">
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Min Quantity</Label>
                                    <Input type="number" min="1" value={tier.minQty}
                                      onChange={e => { if (e.target.value) updateDiscountTier(key, idx, "minQty", Math.round(Number(e.target.value))) }}
                                      className="h-8 border-0 bg-secondary text-sm" />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Price/Event</Label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                                      <Input type="number" step="0.01" min="0"
                                        value={tier.pricePerEvent === 0 ? "" : tier.pricePerEvent / 100}
                                        onChange={e => {
                                          if (e.target.value === "") { updateDiscountTier(key, idx, "pricePerEvent", 0); return }
                                          const n = parseFloat(e.target.value)
                                          if (!Number.isNaN(n)) updateDiscountTier(key, idx, "pricePerEvent", Math.round(n * 100))
                                        }}
                                        className="h-8 border-0 bg-secondary pl-7 text-sm" />
                                    </div>
                                    {base > 0 && (
                                      <p className={`text-[10px] px-1 ${pct > 0 ? "text-emerald-500" : pct < 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                                        {pct > 0 ? `${pct}% off vs base` : pct < 0 ? `${Math.abs(pct)}% above base` : "Same as base"}
                                      </p>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Label</Label>
                                    <Input value={tier.label ?? ""} onChange={e => updateDiscountTier(key, idx, "label", e.target.value)}
                                      className="h-8 border-0 bg-secondary text-sm" placeholder="e.g. 5 Pack" />
                                  </div>
                                  <div className="flex items-center justify-center pt-5">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={() => removeDiscountTier(key, idx)}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {/* Master price reference */}
                          {masterPricing && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Master base: {formatCurrency(masterPricing.stream[key].basePrice)}
                            </p>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Simulcast Pricing ────────────────────────────── */}
        {activeTab === "simulcast" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Simulcast Pricing</h3>
                <p className="text-xs text-muted-foreground">Per-destination fee charged when streaming to multiple platforms simultaneously.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Override master</span>
                <Switch checked={simulcastOverrideEnabled} onCheckedChange={setSimulcastOverrideEnabled} />
                {simulcastOverrideEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => resetSection("simulcast")}>
                    <RotateCcw className="mr-1.5 h-3 w-3" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {!simulcastOverrideEnabled && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                Simulcast pricing inherits master platform rates.
              </div>
            )}

            {simulcastOverrideEnabled && (
              <div className="space-y-3">
                {SIMULCAST_CHANNELS.map(({ key, label, icon: Icon }) => (
                  <div key={key} className={`rounded-lg border p-4 transition-colors ${simulcastPricing[key].enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"}`}>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex flex-1 items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{label}</span>
                        {masterPricing && (
                          <span className="text-xs text-muted-foreground">
                            Master: {formatCurrency(masterPricing.simulcast[key].price)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                          <Input
                            type="number" step="0.01" min="0"
                            defaultValue={simulcastPricing[key].price / 100}
                            onBlur={e => setSimulcastPricing(prev => ({ ...prev, [key]: { ...prev[key], price: Math.round(Number(e.target.value) * 100) } }))}
                            className="pl-7 bg-secondary border-0 h-9"
                            disabled={!simulcastPricing[key].enabled}
                          />
                        </div>
                        <Switch
                          checked={simulcastPricing[key].enabled}
                          onCheckedChange={c => setSimulcastPricing(prev => ({ ...prev, [key]: { ...prev[key], enabled: c } }))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Validity Extensions ──────────────────────────── */}
        {activeTab === "validity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Event Validity Extensions</h3>
                <p className="text-xs text-muted-foreground">Customise the credit cost for validity extensions for this {targetType}.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Override master</span>
                <Switch checked={validityOverrideEnabled} onCheckedChange={setValidityOverrideEnabled} />
                {validityOverrideEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => resetSection("validity")}>
                    <RotateCcw className="mr-1.5 h-3 w-3" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {!validityOverrideEnabled && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                Validity extension pricing inherits master platform rates.
              </div>
            )}

            {validityOverrideEnabled && (
              <>
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Default validity: {validityDefaultDays} days (included by default)</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {validityTiers.map(tier => (
                    <div key={tier.days} className={`rounded-lg border p-4 transition-colors ${tier.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"}`}>
                      <div className="grid items-center gap-4 md:grid-cols-[1fr_130px_1fr_80px]">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{tier.days} days</span>
                          <span className="text-xs text-muted-foreground">(+{Math.max(0, tier.days - validityDefaultDays)} extra)</span>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Credit Cost</Label>
                          <Input type="number" min="1" defaultValue={tier.creditCost}
                            onBlur={e => updateValidityTier(tier.days, "creditCost", Number(e.target.value))}
                            className="bg-secondary border-0 h-9 mt-1" disabled={!tier.enabled} />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Label</Label>
                          <Input defaultValue={tier.label ?? ""}
                            onBlur={e => updateValidityTier(tier.days, "label", e.target.value)}
                            className="bg-secondary border-0 h-9 mt-1" disabled={!tier.enabled} />
                        </div>
                        <div className="flex items-center justify-center">
                          <Switch checked={tier.enabled} onCheckedChange={c => updateValidityTier(tier.days, "enabled", c)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Studio Subscription ──────────────────────────── */}
        {activeTab === "subscription" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Annual Subscription</h3>
                <p className="text-xs text-muted-foreground">Override the annual subscription fee for this {targetType}.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Override master</span>
                <Switch checked={subscriptionOverrideEnabled} onCheckedChange={setSubscriptionOverrideEnabled} />
                {subscriptionOverrideEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => resetSection("subscription")}>
                    <RotateCcw className="mr-1.5 h-3 w-3" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {!subscriptionOverrideEnabled && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                Subscription price inherits master platform rate (₹18,000/yr by default).
              </div>
            )}

            {subscriptionOverrideEnabled && (
              <div className="rounded-lg border border-border bg-card p-6 max-w-sm space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <Label>Enable Subscription</Label>
                  <Switch checked={studioSubscription.enabled} onCheckedChange={e => setStudioSubscription(p => ({ ...p, enabled: e }))} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="sub-price">Annual Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
                    <Input
                      id="sub-price" type="number" step="1" min="0"
                      value={studioSubscription.price / 100}
                      onChange={e => { const n = parseFloat(e.target.value); if (!Number.isNaN(n)) setStudioSubscription(p => ({ ...p, price: Math.round(n * 100) })) }}
                      className="border-0 bg-secondary pl-7" disabled={!studioSubscription.enabled}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Master default: ₹18,000/year</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Bonus Credits ────────────────────────────────── */}
        {activeTab === "bonus" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Grant Bonus Credits</h3>
                <p className="text-xs text-muted-foreground">Add free credits to this {targetType}'s wallet, per stream type.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Enable</span>
                <Switch checked={bonusCreditsEnabled} onCheckedChange={setBonusCreditsEnabled} />
                {bonusCreditsEnabled && (
                  <Button variant="ghost" size="sm" onClick={() => resetSection("bonus")}>
                    <RotateCcw className="mr-1.5 h-3 w-3" /> Reset
                  </Button>
                )}
              </div>
            </div>

            {!bonusCreditsEnabled && (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <Gift className="h-5 w-5 mx-auto mb-2 opacity-50" />
                Enable to grant bonus credits to this {targetType}.
              </div>
            )}

            {bonusCreditsEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STREAM_TYPES.map(({ key, label, icon: Icon }) => (
                  <div key={key} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </Label>
                    <Input
                      type="number" min="0"
                      value={bonusCredits[key] || "0"}
                      onChange={e => setBonusCredits(prev => ({ ...prev, [key]: e.target.value }))}
                      className="bg-secondary border-0"
                    />
                    <p className="text-xs text-muted-foreground">credits to grant</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Admin Note ───────────────────────────────────── */}
        <div className="mt-8 space-y-2">
          <Label>Admin Note (optional)</Label>
          <Textarea
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            placeholder="Reason for custom pricing override…"
            rows={2}
            className="resize-none"
          />
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
        <div className="text-xs text-muted-foreground">
          {hasAnyOverride
            ? "Custom overrides will be saved to the database for this user only."
            : "No overrides active — this user inherits master platform pricing."}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Custom Pricing
          </Button>
        </div>
      </div>
    </div>
  )
}
