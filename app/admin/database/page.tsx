"use client"

import { useCallback, useMemo, useState } from "react"
import useSWR from "swr"
import {
  AlertTriangle,
  Database,
  Download,
  FileUp,
  HardDrive,
  Loader2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"
import { formatDateTimeIst } from "@/lib/format-datetime-ist"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type BackupRow = { name: string; size: number; mtime: string }

const fetcher = async (url: string) => {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.error || "Request failed") as Error & { status?: number; code?: string }
    err.status = res.status
    err.code = data.code
    throw err
  }
  return data
}

type ImportMode = "full_replace" | "schema_only" | "append" | "merge"

function parseFilenameFromDisposition(header: string | null): string | null {
  if (!header) return null
  const m = /filename\*?=(?:UTF-8'')?["']?([^";\n]+)/i.exec(header)
  return m ? decodeURIComponent(m[1].replace(/["']/g, "").trim()) : null
}

export default function AdminDatabasePage() {
  const [schemaOnly, setSchemaOnly] = useState(false)
  const [skipFileUploads, setSkipFileUploads] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [importMode, setImportMode] = useState<ImportMode>("full_replace")
  const [importTab, setImportTab] = useState<"upload" | "server">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [serverFile, setServerFile] = useState<string | undefined>(undefined)
  const [importing, setImporting] = useState(false)
  const [confirmFullOpen, setConfirmFullOpen] = useState(false)

  const {
    data: backupsData,
    error: backupsError,
    isLoading: backupsLoading,
    mutate: mutateBackups,
  } = useSWR<{ backups: BackupRow[]; directory: string }>("/api/admin/database/backups", fetcher, {
    revalidateOnFocus: false,
  })

  const toolsDisabled =
    backupsError && (backupsError as Error & { code?: string }).code === "TOOLS_DISABLED"

  const backups = backupsData?.backups ?? []

  const exportUrl = useMemo(() => {
    const p = new URLSearchParams()
    if (schemaOnly) p.set("schemaOnly", "true")
    if (skipFileUploads) p.set("skipFileUploads", "true")
    const q = p.toString()
    return `/api/admin/database/export${q ? `?${q}` : ""}`
  }, [schemaOnly, skipFileUploads])

  const handleExportDownload = useCallback(async () => {
    try {
      setExporting(true)
      const res = await fetch(exportUrl, { credentials: "include" })
      if (res.status === 403) {
        const j = await res.json().catch(() => ({}))
        toast.error(j.code === "TOOLS_DISABLED" ? "Database tools are disabled on this server." : "Forbidden")
        return
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        toast.error(j.error || "Export failed")
        return
      }
      const blob = await res.blob()
      const dispo = res.headers.get("Content-Disposition")
      const name =
        parseFilenameFromDisposition(dispo) || `streamlivee-export-${Date.now()}.sql`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Export downloaded")
    } catch {
      toast.error("Export failed")
    } finally {
      setExporting(false)
    }
  }, [exportUrl])

  const runImport = useCallback(async () => {
    if (importMode === "append" || importMode === "merge") return

    const form = new FormData()
    form.set("mode", importMode)
    form.set("source", importTab === "server" ? "server" : "upload")

    if (importTab === "server") {
      if (!serverFile) {
        toast.error("Select a backup file on the server")
        return
      }
      form.set("serverFilename", serverFile!)
    } else {
      if (!file) {
        toast.error("Choose a .sql or .sql.gz file")
        return
      }
      form.set("file", file)
    }

    try {
      setImporting(true)
      const res = await fetch("/api/admin/database/import", {
        method: "POST",
        body: form,
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 501) {
        toast.message(data.error || "This import mode is not available")
        return
      }
      if (res.status === 403) {
        toast.error(data.code === "TOOLS_DISABLED" ? "Database tools are disabled." : "Forbidden")
        return
      }
      if (res.status === 413) {
        toast.error("File exceeds 50MB limit")
        return
      }
      if (!res.ok) {
        toast.error(data.error || "Import failed", {
          description: typeof data.detail === "string" ? data.detail.slice(0, 500) : undefined,
        })
        return
      }
      toast.success("Import completed")
      setFile(null)
      mutateBackups()
    } catch {
      toast.error("Import failed")
    } finally {
      setImporting(false)
    }
  }, [file, importMode, importTab, mutateBackups, serverFile])

  const onImportClick = () => {
    if (importMode === "full_replace") {
      setConfirmFullOpen(true)
      return
    }
    void runImport()
  }

  const importLabel =
    importMode === "full_replace"
      ? "Run full replace import"
      : importMode === "schema_only"
        ? "Run schema-only import"
        : "Import"

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database management
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Export or import the PostgreSQL database. Full replace can destroy existing data. Append and merge are not
            supported for arbitrary SQL dumps — use <code className="text-xs">pg_restore</code> with custom format when
            you need merge semantics.
          </p>
        </div>

        {toolsDisabled && (
          <div
            className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-sm"
            role="status"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-medium text-foreground">Database tools are disabled</p>
              <p className="text-muted-foreground mt-0.5">
                Set <code className="text-xs">ADMIN_DATABASE_TOOLS_ENABLED=true</code> in the server environment to
                enable export, import, and server backup listing.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Export</CardTitle>
              <CardDescription>
                Download a SQL dump. Prefer <strong>pg_dump</strong> on the server for schema + data; without it, a
                data-only fallback is used (not for schema-only).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schema-only"
                  checked={schemaOnly}
                  onCheckedChange={(v) => setSchemaOnly(v === true)}
                  disabled={toolsDisabled}
                />
                <Label htmlFor="schema-only" className="font-normal cursor-pointer">
                  Schema only (requires pg_dump)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="skip-uploads"
                  checked={skipFileUploads}
                  onCheckedChange={(v) => setSkipFileUploads(v === true)}
                  disabled={toolsDisabled}
                />
                <Label htmlFor="skip-uploads" className="font-normal cursor-pointer">
                  Skip <code className="text-xs">file_uploads</code> table if it exists
                </Label>
              </div>
              <Button onClick={() => void handleExportDownload()} disabled={exporting || toolsDisabled}>
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download SQL export
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import</CardTitle>
              <CardDescription>Up to 50MB per file. Requires <code className="text-xs">psql</code> on the server.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <ModeCard
                  title="Full replace"
                  description="Run SQL as-is (typical pg_dump with --clean). Destructive."
                  selected={importMode === "full_replace"}
                  onSelect={() => setImportMode("full_replace")}
                  disabled={toolsDisabled}
                />
                <ModeCard
                  title="Schema only"
                  description="Apply a schema-only dump. Review file contents first."
                  selected={importMode === "schema_only"}
                  onSelect={() => setImportMode("schema_only")}
                  disabled={toolsDisabled}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ModeCard
                        title="Append"
                        description="Not available for generic SQL."
                        selected={importMode === "append"}
                        onSelect={() => setImportMode("append")}
                        disabled
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Use pg_dump custom format and pg_restore, or app-specific migrations. API returns 501 for this mode.
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <ModeCard
                        title="Merge (upsert)"
                        description="Not available for generic SQL."
                        selected={importMode === "merge"}
                        onSelect={() => setImportMode("merge")}
                        disabled
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    True upsert needs known keys and ON CONFLICT per table — not derivable from arbitrary .sql files.
                  </TooltipContent>
                </Tooltip>
              </div>

              <Tabs value={importTab} onValueChange={(v) => setImportTab(v as "upload" | "server")}>
                <TabsList>
                  <TabsTrigger value="upload" disabled={toolsDisabled}>
                    <Upload className="mr-1.5 h-3.5 w-3.5" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="server" disabled={toolsDisabled}>
                    <HardDrive className="mr-1.5 h-3.5 w-3.5" />
                    Server
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-4 space-y-3">
                  <label
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-10 text-center text-sm transition-colors hover:bg-muted/50",
                      toolsDisabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <FileUp className="mb-2 h-8 w-8 text-muted-foreground" />
                    <span className="font-medium">Drop .sql or .sql.gz here, or click to browse</span>
                    <span className="text-xs text-muted-foreground mt-1">Maximum size 50MB</span>
                    <input
                      type="file"
                      accept=".sql,.gz,application/gzip"
                      className="sr-only"
                      disabled={toolsDisabled}
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: <span className="text-foreground font-medium">{file.name}</span> (
                      {(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="server" className="mt-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <Label>Backup on server ({backupsData?.directory ?? "…"})</Label>
                    {backupsLoading ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : backups.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No files in backup directory yet.</p>
                    ) : (
                      <Select value={serverFile} onValueChange={setServerFile} disabled={toolsDisabled}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a file" />
                        </SelectTrigger>
                        <SelectContent>
                          {backups.map((b) => (
                            <SelectItem key={b.name} value={b.name}>
                              {b.name} — {(b.size / 1024).toFixed(1)} KB — {formatDateTimeIst(b.mtime)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                onClick={onImportClick}
                disabled={
                  importing ||
                  toolsDisabled ||
                  importMode === "append" ||
                  importMode === "merge" ||
                  (importTab === "upload" && !file) ||
                  (importTab === "server" && !serverFile)
                }
              >
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {importLabel}
              </Button>
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={confirmFullOpen} onOpenChange={setConfirmFullOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace entire database?</AlertDialogTitle>
              <AlertDialogDescription>
                Full replace runs your SQL file against the current database with <code className="text-xs">ON_ERROR_STOP</code>.
                Typical dumps include DROP statements and will destroy existing data. This cannot be undone from the UI.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmFullOpen(false)
                  void runImport()
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, run full replace
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}

function ModeCard({
  title,
  description,
  selected,
  onSelect,
  disabled,
}: {
  title: string
  description: string
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "rounded-lg border p-3 text-left text-sm transition-colors",
        selected && !disabled ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="font-medium">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{description}</div>
    </button>
  )
}
