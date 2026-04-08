"use client"

import { useState } from "react"
import useSWR from "swr"
import { format } from "date-fns"
import { 
  Activity, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Search,
  RefreshCw,
  Tractor
} from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")

  const cronLogs = data?.cronLogs || []
  const deletionLogs = data?.deletionLogs || []

  const lastJob = cronLogs[0]
  const totalDeleted = deletionLogs.reduce((acc: number, log: any) => acc + (log.assetsDeleted || 0), 0)

  const filteredDeletionLogs = deletionLogs.filter((log: any) => 
    log.eventTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Tasks</h1>
          <p className="text-muted-foreground">Monitor automated cleanup jobs and event deletion logs.</p>
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
              {lastJob?.startedAt ? format(new Date(lastJob.startedAt), "MMM d, HH:mm") : "Never"}
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
            <CardTitle className="text-sm font-medium">Cron Status</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {lastJob?.status === "success" ? (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Healthy
              </Badge>
            ) : lastJob?.status === "failure" ? (
              <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10">
                <XCircle className="w-3 h-3 mr-1" /> Unhealthy
              </Badge>
            ) : (
              <Badge variant="outline">Unknown</Badge>
            )}
            <p className="text-xs text-muted-foreground mt-2">Daily auto-cleanup enabled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {/* Cron Job History */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Recent Executions
            </CardTitle>
            <CardDescription>Status history of the cleanup cron script.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cronLogs.length === 0 && <p className="text-sm text-center py-4 text-muted-foreground">No history found</p>}
              {cronLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-3 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-medium">{format(new Date(log.startedAt), "MMM d, HH:mm")}</span>
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

        {/* Deletion Audit Logs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Deletion Audit
                </CardTitle>
                <CardDescription>Records of events deleted due to expiry.</CardDescription>
              </div>
              <div className="relative w-48 sm:w-64">
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
            <div className="rounded-md border max-h-[500px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead className="text-right">Assets</TableHead>
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
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {log.eventTitle}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs uppercase">
                        {log.ownerEmail || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {format(new Date(log.deletedAt), "MMM d, HH:mm")}
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
    </div>
  )
}
