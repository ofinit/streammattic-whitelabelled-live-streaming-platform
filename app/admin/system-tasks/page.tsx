"use client"

import { useState } from "react"
import useSWR from "swr"
import { formatDateTimeIst } from "@/lib/format-datetime-ist"
import { 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Search,
  RefreshCw,
  Tractor,
  Play,
  Settings2,
  Copy,
  Terminal
} from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function SystemTasksPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/system-logs", fetcher)
  const { data: configData, mutate: mutateConfig } = useSWR("/api/admin/system-tasks/automation", fetcher)
  const [isRunning, setIsRunning] = useState(false)
  const [isUpdatingConfig, setIsUpdatingConfig] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const cronLogs = data?.cronLogs || []
  const deletionLogs = data?.deletionLogs || []
  const config = configData?.config || { enabled: false, schedule: "0 0 * * *" }

  const lastJob = cronLogs[0]
  const totalDeleted = deletionLogs.reduce((acc: number, log: any) => acc + (log.assetsDeleted || 0), 0)

  const filteredDeletionLogs = deletionLogs.filter((log: any) => 
    log.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRunNow = async () => {
    try {
      setIsRunning(true)
      const res = await fetch("/api/admin/system-tasks/run", { method: "POST" })
      const result = await res.json()
      if (result.success) {
        toast.success(`Cleanup complete. Deleted ${result.deletedCount} events.`)
        mutate()
      } else {
        toast.error(result.error || "Failed to run cleanup")
      }
    } catch (error) {
      toast.error("An error occurred while running the cleanup")
    } finally {
      setIsRunning(false)
    }
  }

  const handleToggleAutoCleanup = async (checked: boolean) => {
    try {
      setIsUpdatingConfig(true)
      const res = await fetch("/api/admin/system-tasks/automation", {
        method: "POST",
        body: JSON.stringify({ ...config, enabled: checked }),
      })
      if (res.ok) {
        toast.success(`Auto-cleanup ${checked ? "enabled" : "disabled"}`)
        mutateConfig()
      } else {
        toast.error("Failed to update settings")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsUpdatingConfig(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Command copied to clipboard")
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Tasks</h1>
            <p className="text-muted-foreground">
              Monitor automated cleanup jobs and event deletion logs. Times below are shown in{" "}
              <span className="text-foreground/90">IST (Asia/Kolkata)</span>.
            </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => mutate()}
          disabled={isLoading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Last Cleanup</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastJob?.startedAt ? formatDateTimeIst(lastJob.startedAt) : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastJob?.status === "success" ? "Completed successfully" : lastJob?.status === "failure" ? "Job failed" : "No recent activity"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Events Cleaned</CardTitle>
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deletionLogs.length}</div>
            <p className="text-xs text-muted-foreground">Audit records retained</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Assets Removed</CardTitle>
            <Tractor className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeleted}</div>
            <p className="text-xs text-muted-foreground">Images deleted from server</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Auto-Cleanup</CardTitle>
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-1">
              <Switch 
                checked={config.enabled} 
                onCheckedChange={handleToggleAutoCleanup}
                disabled={isUpdatingConfig}
              />
              <span className="text-sm font-medium">{config.enabled ? "Enabled" : "Disabled"}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Hourly check in the app; runs cleanup when enabled and last success was over 24h ago
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Automation & Controls */}
        <Card className="border-primary/20 bg-primary/5 min-h-[320px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Actions & Controls
            </CardTitle>
            <CardDescription>Manage your automation settings and manual tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Immediate Cleanup</h4>
              <p className="text-xs text-muted-foreground">
                Scans for events past <code className="text-[10px]">validity_expires_at</code>,{" "}
                <strong className="text-foreground">permanently deletes</strong> matching image files under{" "}
                <code className="text-[10px]">UPLOAD_DIR</code>, then removes the event row and writes an audit log.
              </p>
              <Button 
                onClick={handleRunNow} 
                className="w-full" 
                disabled={isRunning}
              >
                {isRunning ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Run Cleanup Task Now
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">Coolify Cron Command</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Not required</strong> if this app stays online and Auto-Cleanup is
                on—the same cleanup runs inside the Node process. Coolify does{" "}
                <strong className="text-foreground">not</strong> add a cron for you; add one only if you want a
                scheduled job independent of the long-running server (e.g. extra safety after deploys).
              </p>
              <p className="text-[10px] text-muted-foreground">Production (app container, repo root):</p>
              <div className="relative group">
                <code className="block p-3 rounded bg-muted text-[10px] break-all pr-10 border leading-relaxed">
                  node --env-file=.env.production scripts/cron-delete-expired.js
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() =>
                    copyToClipboard("node --env-file=.env.production scripts/cron-delete-expired.js")
                  }
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Requires <code className="text-[10px]">DATABASE_URL</code> and <code className="text-[10px]">UPLOAD_DIR</code>{" "}
                (same as the web app). Deletes files on disk like “Run Cleanup Task Now”.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cron Job History */}
        <Card className="min-h-[320px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Recent Executions
            </CardTitle>
            <CardDescription>History of cleanup runs (manual, auto, or external cron).</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {cronLogs.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">No history found</p>}
              {cronLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium">{formatDateTimeIst(log.startedAt)}</span>
                    <span className="text-xs text-muted-foreground">
                      Deleted {log.deletedCount || 0} event(s)
                    </span>
                  </div>
                  {log.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deletion Audit — full width */}
      <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Deletion Audit
                </CardTitle>
                <CardDescription>Records of events deleted due to expiry.</CardDescription>
              </div>
              <div className="relative w-full max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events or owners..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[min(560px,70vh)] overflow-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Event Title</TableHead>
                    <TableHead className="min-w-[160px]">Owner</TableHead>
                    <TableHead className="min-w-[200px] whitespace-nowrap">Deleted At (IST)</TableHead>
                    <TableHead className="text-right min-w-[100px]">Assets</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeletionLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No records found.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredDeletionLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium max-w-[min(100vw,480px)]">
                        <span className="line-clamp-2" title={log.eventTitle}>
                          {log.eventTitle}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <span className="break-all">{log.ownerEmail || "N/A"}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDateTimeIst(log.deletedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-normal">
                          {log.assetsDeleted || 0} / {log.assetsFound || 0}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}
