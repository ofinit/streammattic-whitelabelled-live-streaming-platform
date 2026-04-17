"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ExternalLink, Loader2, Save, TestTube2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CLIENT_GALLERY_BASE } from "@/lib/client-gallery-nav-items"

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: "include" })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || res.statusText || "Request failed")
  }
  return data
}

type StoragePayload = {
  configured?: boolean
  endpoint?: string | null
  region?: string
  bucket?: string
  accessKeyId?: string
  forcePathStyle?: boolean
}

type ProviderGuide = {
  name: string
  docsUrl: string
  endpoint: string
  region: string
  forcePathStyle: string
}

const PROVIDER_GUIDES: ProviderGuide[] = [
  {
    name: "AWS S3",
    docsUrl: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html",
    endpoint: "Leave blank (AWS default endpoint routing).",
    region: "Use your bucket region (e.g. us-east-1).",
    forcePathStyle: "Off",
  },
  {
    name: "Cloudflare R2",
    docsUrl: "https://developers.cloudflare.com/r2/api/s3/api/",
    endpoint: "https://<account-id>.r2.cloudflarestorage.com",
    region: "auto",
    forcePathStyle: "Off",
  },
  {
    name: "Wasabi",
    docsUrl: "https://docs.wasabi.com/docs/how-do-i-use-aws-sdks-with-wasabi",
    endpoint: "https://s3.<region>.wasabisys.com",
    region: "Use your Wasabi region (e.g. us-east-1).",
    forcePathStyle: "Off",
  },
  {
    name: "MinIO",
    docsUrl: "https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html",
    endpoint: "https://<your-minio-host>",
    region: "auto or your custom server region.",
    forcePathStyle: "On (recommended for MinIO).",
  },
  {
    name: "DigitalOcean Spaces",
    docsUrl: "https://docs.digitalocean.com/products/spaces/how-to/use-aws-sdks/",
    endpoint: "https://<region>.digitaloceanspaces.com",
    region: "Use your Space region (e.g. nyc3).",
    forcePathStyle: "Off",
  },
  {
    name: "Backblaze B2 (S3)",
    docsUrl: "https://www.backblaze.com/docs/cloud-storage-use-the-aws-sdk-for-javascript-v3-with-backblaze-b2",
    endpoint: "https://s3.<region>.backblazeb2.com",
    region: "Use your B2 region code.",
    forcePathStyle: "Off",
  },
]

export function ClientGalleryStorageSettings() {
  const { data, isLoading, mutate } = useSWR<StoragePayload>("/api/client-gallery/storage", fetcher, {
    revalidateOnFocus: true,
  })

  const [endpoint, setEndpoint] = useState("")
  const [region, setRegion] = useState("auto")
  const [bucket, setBucket] = useState("")
  const [accessKeyId, setAccessKeyId] = useState("")
  const [secretAccessKey, setSecretAccessKey] = useState("")
  const [forcePathStyle, setForcePathStyle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    if (!data) return
    setEndpoint(data.endpoint ?? "")
    setRegion(data.region ?? "auto")
    setBucket(data.bucket ?? "")
    setAccessKeyId(data.accessKeyId ?? "")
    setForcePathStyle(data.forcePathStyle === true)
    setSecretAccessKey("")
  }, [data])

  async function onSave() {
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        endpoint: endpoint.trim() || null,
        region: region.trim() || "auto",
        bucket: bucket.trim(),
        accessKeyId: accessKeyId.trim(),
        forcePathStyle,
      }
      if (secretAccessKey.trim().length > 0) {
        body.secretAccessKey = secretAccessKey.trim()
      }
      const res = await fetch("/api/client-gallery/storage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((out as { error?: string }).error || "Save failed")
      }
      toast.success("Storage settings saved")
      setSecretAccessKey("")
      await mutate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function onTest() {
    setTesting(true)
    try {
      const res = await fetch("/api/client-gallery/storage/test", {
        method: "POST",
        credentials: "include",
      })
      const out = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((out as { error?: string }).error || "Test failed")
      }
      toast.success("Connection OK — bucket is reachable with your credentials.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed")
    } finally {
      setTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading settings…
      </div>
    )
  }

  return (
    <div className="space-y-8 py-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Storage (BYOS)</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Add your own S3-compatible credentials (Cloudflare R2, AWS S3, MinIO, Wasabi, etc.). Secrets are encrypted on the
          server. Your streamer/studio account does not need server environment access.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">S3-compatible endpoint</CardTitle>
          <CardDescription>
            Leave endpoint empty for AWS default. For R2, use your account endpoint (e.g.{" "}
            <code className="text-xs">https://&lt;account-id&gt;.r2.cloudflarestorage.com</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cg-endpoint">Endpoint URL (optional)</Label>
            <Input
              id="cg-endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://..."
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cg-region">Region</Label>
            <Input
              id="cg-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="auto"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cg-bucket">Bucket name</Label>
            <Input
              id="cg-bucket"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
              placeholder="my-gallery-bucket"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cg-access-key">Access key ID</Label>
            <Input
              id="cg-access-key"
              value={accessKeyId}
              onChange={(e) => setAccessKeyId(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cg-secret">Secret access key</Label>
            <Input
              id="cg-secret"
              type="password"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              placeholder={data?.configured ? "Leave blank to keep current secret" : "Required"}
              autoComplete="new-password"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="cg-path-style">Force path style</Label>
              <p className="text-xs text-muted-foreground">Enable for MinIO and some S3-compatible APIs.</p>
            </div>
            <Switch id="cg-path-style" checked={forcePathStyle} onCheckedChange={setForcePathStyle} />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="button" onClick={() => void onSave()} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void onTest()}
              disabled={testing || !data?.configured}
              className="gap-2"
              title={!data?.configured ? "Save settings first" : undefined}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
              Test connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Provider quick-start</CardTitle>
          <CardDescription>
            Use these references to map each provider into this form. Create an API key with read/write/list bucket access,
            then run <span className="font-medium">Test connection</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3">
            {PROVIDER_GUIDES.map((provider) => (
              <div key={provider.name} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground">{provider.name}</h3>
                  <Link
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Docs
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Endpoint:</span> {provider.endpoint}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Region:</span> {provider.region}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Force path style:</span> {provider.forcePathStyle}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Before saving</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Confirm the bucket already exists and is in the region you entered.</li>
              <li>Grant key permissions for list, read, and write objects in that bucket.</li>
              <li>Set bucket CORS/policies if your provider requires them for uploads.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        The platform uses <code className="rounded bg-muted px-1">ENCRYPTION_SECRET</code> (server-only) to encrypt your
        secret key in the database — set once by your host, not per user.
      </p>
      <p className="text-xs text-muted-foreground">
        Full auto-configuration is not available yet. It requires provider OAuth/API integrations with account-level
        permissions. Today this page supports manual credentials, encrypted server-side storage, and one-click connection
        testing.
      </p>

      <Button variant="ghost" asChild>
        <Link href={CLIENT_GALLERY_BASE}>Back to gallery dashboard</Link>
      </Button>
    </div>
  )
}
