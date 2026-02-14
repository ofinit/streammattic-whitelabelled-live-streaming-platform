"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { streamingService, type StreamRecording } from "@/lib/streaming-service"
import { Video, Download, Play, Trash2, MoreVertical, HardDrive, Clock, RefreshCw, Circle } from "lucide-react"
import { toast } from "sonner"

interface RecordingsManagerProps {
  eventId: string
  isRecording?: boolean
  onStartRecording?: () => void
  onStopRecording?: () => void
}

export function RecordingsManager({
  eventId,
  isRecording = false,
  onStartRecording,
  onStopRecording,
}: RecordingsManagerProps) {
  const [recordings, setRecordings] = useState<StreamRecording[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRecording, setSelectedRecording] = useState<StreamRecording | null>(null)

  const fetchRecordings = async () => {
    try {
      const data = await streamingService.getRecordings(eventId)
      setRecordings(data)
    } catch (error) {
      console.error("Failed to fetch recordings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRecordings()
  }, [eventId])

  const handleDelete = async () => {
    if (!selectedRecording) return

    try {
      await streamingService.deleteRecording(selectedRecording.id)
      setRecordings(recordings.filter((r) => r.id !== selectedRecording.id))
      toast.success("Recording deleted")
    } catch (error) {
      toast.error("Failed to delete recording")
    } finally {
      setDeleteDialogOpen(false)
      setSelectedRecording(null)
    }
  }

  const totalSize = recordings.reduce((sum, r) => sum + r.size, 0)
  const totalDuration = recordings.reduce((sum, r) => sum + r.duration, 0)

  return (
    <>
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Recordings
              <Badge variant="outline" className="ml-2">
                {recordings.length}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {isRecording ? (
                <Button variant="destructive" size="sm" onClick={onStopRecording} className="gap-1">
                  <Circle className="h-3 w-3 fill-current animate-pulse" />
                  Stop Recording
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onStartRecording} className="gap-1 bg-transparent">
                  <Circle className="h-3 w-3" />
                  Start Recording
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={fetchRecordings}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <HardDrive className="h-4 w-4" />
              <span>{streamingService.formatBytes(totalSize)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{streamingService.formatDuration(totalDuration)}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Video className="h-5 w-5 animate-pulse mr-2" />
              Loading recordings...
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recordings yet</p>
              <p className="text-xs mt-1">Start recording to capture your stream</p>
            </div>
          ) : (
            <ScrollArea className="h-[250px]">
              <div className="space-y-2">
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center">
                        <Video className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm">{recording.filename}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{streamingService.formatBytes(recording.size)}</span>
                          <span>{streamingService.formatDuration(recording.duration)}</span>
                          <span>{recording.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(recording.url, "_blank")}
                        title="Play"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const link = document.createElement("a")
                          link.href = recording.url
                          link.download = recording.filename
                          link.click()
                        }}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRecording(recording)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recording</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedRecording?.filename}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
