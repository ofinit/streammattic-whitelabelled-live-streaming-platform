"use client"

import { useState } from "react"
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
import { Loader2, Ban, UserCheck } from "lucide-react"

interface StatusChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userName: string
  currentStatus: string
  targetStatus: "active" | "suspended"
  onConfirm: () => Promise<void>
}

export function StatusChangeDialog({
  open,
  onOpenChange,
  userName,
  currentStatus,
  targetStatus,
  onConfirm,
}: StatusChangeDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isSuspending = targetStatus === "suspended"

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                isSuspending ? "bg-destructive/20 text-destructive" : "bg-emerald-500/20 text-emerald-500"
              }`}
            >
              {isSuspending ? <Ban className="h-5 w-5" /> : <UserCheck className="h-5 w-5" />}
            </div>
            <AlertDialogTitle className="text-foreground">
              {isSuspending ? "Suspend User" : "Activate User"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground">
            {isSuspending ? (
              <>
                Are you sure you want to suspend <span className="font-semibold text-foreground">{userName}</span>?
                <br />
                <br />
                This will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Prevent them from logging in</li>
                  <li>Stop all active streams</li>
                  <li>Disable access to their dashboard</li>
                </ul>
              </>
            ) : (
              <>
                Are you sure you want to activate <span className="font-semibold text-foreground">{userName}</span>?
                <br />
                <br />
                This will:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Restore login access</li>
                  <li>Enable dashboard access</li>
                  <li>Allow creating new events</li>
                </ul>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-secondary border-0 text-foreground hover:bg-secondary/80">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              isSuspending
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSuspending ? "Suspend User" : "Activate User"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
