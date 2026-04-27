"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { Copy, KeyRound, Loader2, Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

type GatewayConfig = {
  host: string
  fallbackHost?: string
  sftpPort: number
  ftpPort: number
  ftpsPort: number
  preferredProtocol: "sftp" | "ftps" | "ftp"
}

type CameraCredential = {
  id: string
  label: string
  username: string
  uploadPrefix: string
  enabled: boolean
  expiresAt: string | null
  lastUploadAt: string | null
  importedAssetCount: number
}

type CameraIngestResponse = {
  gateway: GatewayConfig
  credentials: CameraCredential[]
}

const SUPPORTED_CAMERA_GROUPS = [
  {
    brand: "Canon",
    models: [
      "EOS R1",
      "EOS R3",
      "EOS R5 Mark II",
      "EOS R5",
      "EOS R5 C",
      "EOS R6 Mark II",
      "EOS R7",
      "EOS-1D X Mark III",
      "EOS-1D X Mark II",
      "EOS 5D Mark IV",
      "EOS 7D Mark II",
      "WFT-compatible EOS bodies",
    ],
  },
  {
    brand: "Nikon",
    models: [
      "Z9",
      "Z8",
      "Z6III",
      "Z7II",
      "Z6II",
      "D6",
      "D5",
      "D850",
      "D500",
      "WT-compatible Nikon bodies",
    ],
  },
  {
    brand: "Sony",
    models: [
      "Alpha 1",
      "Alpha 9 III",
      "Alpha 9 II",
      "Alpha 7R V",
      "Alpha 7 IV",
      "Alpha 7S III",
      "Alpha 7C II",
      "FX3",
      "FX30",
      "FTP Transfer-compatible Alpha bodies",
    ],
  },
  {
    brand: "Fujifilm",
    models: ["GFX100 II", "GFX100S II", "X-H2S", "X-H2", "X-T5", "X-T4", "FT-XH-compatible bodies"],
  },
  {
    brand: "Panasonic Lumix",
    models: ["S5IIX", "S5II", "S1H", "S1R", "S1", "GH7", "GH6", "G9II", "FTP-compatible Lumix bodies"],
  },
  {
    brand: "Other cameras",
    models: ["Any camera, grip, or wireless transmitter that can upload to FTP, FTPS, or SFTP"],
  },
]

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed")
  }
  return data
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init })
  const data = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed")
  }
  return data as T
}

function dateToInput(value: string | null): string {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 10)
}

function inputToIso(value: string): string | null {
  if (!value) return null
  const d = new Date(`${value}T23:59:59`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function protocolPort(gateway: GatewayConfig): number {
  if (gateway.preferredProtocol === "ftp") return gateway.ftpPort
  if (gateway.preferredProtocol === "ftps") return gateway.ftpsPort
  return gateway.sftpPort
}

export function ClientGalleryCameraIngestPanel({
  albumId,
  storageConfigured,
}: {
  albumId: string
  storageConfigured: boolean
}) {
  const { data, error, isLoading, mutate } = useSWR<CameraIngestResponse>(
    `/api/client-gallery/albums/${albumId}/camera-ingest`,
    fetcher,
    { revalidateOnFocus: true },
  )
  const [label, setLabel] = useState("Main Photographer")
  const [expiresAt, setExpiresAt] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [passwords, setPasswords] = useState<Record<string, string>>({})

  const gateway = data?.gateway
  const endpoint = useMemo(() => {
    if (!gateway?.host) return ""
    return `${gateway.preferredProtocol.toUpperCase()} ${gateway.host}:${protocolPort(gateway)}`
  }, [gateway])

  const credentials = data?.credentials ?? []

  const createCredential = async () => {
    setCreating(true)
    try {
      const out = await fetchJson<{
        credential: CameraCredential
        oneTimePassword: string
      }>(`/api/client-gallery/albums/${albumId}/camera-ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          expiresAt: inputToIso(expiresAt),
        }),
      })
      setPasswords((prev) => ({ ...prev, [out.credential.id]: out.oneTimePassword }))
      setLabel("Main Photographer")
      setExpiresAt("")
      toast.success("Camera upload access created")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create camera upload access")
    } finally {
      setCreating(false)
    }
  }

  const patchCredential = async (credentialId: string, body: Record<string, unknown>) => {
    setBusyId(credentialId)
    try {
      await fetchJson(`/api/client-gallery/albums/${albumId}/camera-ingest/${credentialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update camera upload access")
    } finally {
      setBusyId(null)
    }
  }

  const resetPassword = async (credentialId: string) => {
    setBusyId(credentialId)
    try {
      const out = await fetchJson<{
        credential: CameraCredential
        oneTimePassword: string
      }>(`/api/client-gallery/albums/${albumId}/camera-ingest/${credentialId}`, {
        method: "POST",
      })
      setPasswords((prev) => ({ ...prev, [out.credential.id]: out.oneTimePassword }))
      toast.success("New camera password generated")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reset password")
    } finally {
      setBusyId(null)
    }
  }

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
    } catch {
      toast.error("Could not copy")
    }
  }

  const copySetup = async (credential: CameraCredential) => {
    const password = passwords[credential.id] || "<reset password to generate a new one>"
    const text = [
      `Protocol: ${gateway?.preferredProtocol.toUpperCase() || "SFTP"}`,
      `Host: ${gateway?.host || "not configured"}`,
      gateway?.fallbackHost ? `Fallback host: ${gateway.fallbackHost}` : "",
      `Port: ${gateway ? protocolPort(gateway) : ""}`,
      `Username: ${credential.username}`,
      `Password: ${password}`,
      `Upload folder/prefix: ${credential.uploadPrefix}`,
    ].filter(Boolean).join("\n")
    await copyText(text, "Camera setup copied")
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5" />
              Camera FTP/SFTP upload
            </CardTitle>
            <CardDescription>
              Generate temporary camera credentials for photographers. Photos land in this album&apos;s Wasabi-backed
              incoming prefix.
            </CardDescription>
          </div>
          {endpoint ? <Badge variant="secondary">{endpoint}</Badge> : <Badge variant="outline">Gateway not configured</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {gateway?.fallbackHost ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
            Branded camera host is enabled for this studio domain. If a camera cannot resolve it, use fallback host{" "}
            <span className="font-mono">{gateway.fallbackHost}</span>.
          </div>
        ) : null}
        {!storageConfigured ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-foreground">
            Connect this account&apos;s S3-compatible storage before creating camera upload access.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error instanceof Error ? error.message : "Could not load camera upload access"}
          </div>
        ) : null}

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">Supported camera models</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Works with cameras or wireless transmitters that support FTP, FTPS, or SFTP image transfer. Exact menu
              names vary by firmware and accessory.
            </p>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {SUPPORTED_CAMERA_GROUPS.map((group) => (
              <div key={group.brand} className="rounded-md border border-border bg-background/70 p-3">
                <p className="mb-2 text-sm font-medium text-foreground">{group.brand}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.models.map((model) => (
                    <Badge key={`${group.brand}-${model}`} variant="outline" className="bg-background text-[11px]">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="camera-ingest-label">Photographer / camera label</Label>
            <Input
              id="camera-ingest-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Main Photographer"
              disabled={creating || !storageConfigured}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="camera-ingest-expiry">Expiry</Label>
            <Input
              id="camera-ingest-expiry"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={creating || !storageConfigured}
            />
          </div>
          <Button type="button" disabled={creating || !storageConfigured} onClick={() => void createCredential()}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create access
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading camera access…
          </div>
        ) : null}

        <div className="space-y-3">
          {credentials.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">
              No camera upload access yet. Create one per photographer or camera team for this album.
            </p>
          ) : null}

          {credentials.map((credential) => {
            const password = passwords[credential.id]
            return (
              <div key={credential.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{credential.label}</p>
                      <Badge variant={credential.enabled ? "secondary" : "outline"}>
                        {credential.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Username</span>
                        <Input readOnly value={credential.username} className="mt-1 font-mono text-xs" />
                      </div>
                      <div>
                        <span className="text-muted-foreground">Password</span>
                        <Input
                          readOnly
                          value={password || "Shown only after create/reset"}
                          className="mt-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <p className="break-all text-xs text-muted-foreground">Prefix: {credential.uploadPrefix}</p>
                    <p className="text-xs text-muted-foreground">
                      Imported: {credential.importedAssetCount} photos
                      {credential.lastUploadAt ? ` • Last upload: ${new Date(credential.lastUploadAt).toLocaleString()}` : ""}
                      {credential.expiresAt ? ` • Expires: ${new Date(credential.expiresAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button type="button" variant="outline" size="sm" onClick={() => void copySetup(credential)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy setup
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId === credential.id}
                      onClick={() => void resetPassword(credential.id)}
                    >
                      {busyId === credential.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Reset password
                    </Button>
                    <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                      <Switch
                        id={`camera-ingest-enabled-${credential.id}`}
                        checked={credential.enabled}
                        disabled={busyId === credential.id}
                        onCheckedChange={(enabled) => void patchCredential(credential.id, { enabled })}
                      />
                      <Label htmlFor={`camera-ingest-enabled-${credential.id}`} className="text-sm font-normal">
                        Active
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_12rem_auto] md:items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`camera-ingest-label-${credential.id}`}>Label</Label>
                    <Input
                      id={`camera-ingest-label-${credential.id}`}
                      defaultValue={credential.label}
                      onBlur={(e) => {
                        const next = e.currentTarget.value.trim()
                        if (next && next !== credential.label) {
                          void patchCredential(credential.id, { label: next })
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`camera-ingest-expiry-${credential.id}`}>Expiry</Label>
                    <Input
                      id={`camera-ingest-expiry-${credential.id}`}
                      type="date"
                      defaultValue={dateToInput(credential.expiresAt)}
                      onBlur={(e) => void patchCredential(credential.id, { expiresAt: inputToIso(e.currentTarget.value) })}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

